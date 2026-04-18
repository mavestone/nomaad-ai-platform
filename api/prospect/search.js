// Vercel serverless function — POST /api/prospect/search
// Calls Explorium REST API: POST https://api.explorium.ai/v1/prospects
//
// Docs: https://developers.explorium.ai/reference/prospects/fetch_prospects.md
//
// Request body:
//   { filters: { linkedin_category?, job_level?, job_department?, country_code?,
//                company_size?, job_title? }, limit?: number, page?: number }
//
// Response:
//   200 { prospects: [...], total: number, total_pages: number }
//   503 { error: string, setup_required: true }   ← missing API key
//   4xx/5xx { error: string }

export const config = { runtime: 'nodejs' };

const EXPLORIUM_URL = 'https://api.explorium.ai/v1/prospects';

// ─── helpers ──────────────────────────────────────────────────────────────

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

/** Map a single Explorium prospect record → normalised shape */
function normalise(p) {
  const firstName = p.first_name || '';
  const lastName  = p.last_name  || '';
  const fullName  = p.full_name  || [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
  const city      = p.city       || '';
  const country   = p.country_name || p.country || '';
  const location  = [city, country].filter(Boolean).join(', ');

  return {
    id:               p.prospect_id || null,
    prospect_id:      p.prospect_id || null,
    full_name:        fullName,
    job_title:        p.job_title   || '',
    company_name:     p.company_name || '',
    linkedin_industry: p.linkedin_category || p.industry || '',
    location,
    city,
    country,
    region:           p.region_name || '',
    company_size:     p.company_size || '',
    job_level:        p.job_level_main || p.job_level || '',
    job_department:   p.job_department_main || p.job_department || '',
    bio:              p.bio || p.summary || '',
    has_email:        p.has_email        ?? false,
    has_phone_number: p.has_phone_number ?? false,
    linkedin_url:     p.linkedin_url || '',
  };
}

/**
 * Build Explorium filter object.
 * Array filters → { values: [...] }
 * Boolean filters → { value: bool }
 */
function buildFilters(f) {
  const out = {};

  // linkedin_category — array of strings e.g. ["Marketing Services"]
  if (Array.isArray(f.linkedin_category) && f.linkedin_category.length) {
    out.linkedin_category = { values: f.linkedin_category };
  }

  // job_level — single value e.g. "director"
  if (f.job_level && f.job_level !== 'any level') {
    out.job_level = { values: [String(f.job_level).toLowerCase()] };
  }

  // job_department — single value e.g. "marketing"
  if (f.job_department && f.job_department !== 'any dept.') {
    out.job_department = { values: [String(f.job_department).toLowerCase()] };
  }

  // country_code — ISO Alpha-2 e.g. "US"
  if (f.country_code) {
    out.country_code = { values: [String(f.country_code).toUpperCase()] };
  }

  // company_size — e.g. "51-200"
  if (f.company_size && f.company_size !== 'any size') {
    out.company_size = { values: [String(f.company_size)] };
  }

  // job_title — free-text title e.g. "Marketing Director"
  if (f.job_title && f.job_title.trim()) {
    out.job_title = { values: [f.job_title.trim()] };
  }

  // has_email — boolean
  if (f.has_email === true) {
    out.has_email = { value: true };
  }

  return out;
}

// ─── handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.EXPLORIUM_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'EXPLORIUM_API_KEY is not configured. Add it to Vercel environment variables and redeploy.',
      setup_required: true,
    });
  }

  let payload;
  try { payload = await readBody(req); }
  catch { return res.status(400).json({ error: 'Invalid JSON body' }); }

  const { filters = {}, limit = 25, page = 1 } = payload;
  const pageSize = Math.min(Math.max(Number(limit) || 25, 1), 500);
  const pageNum  = Math.max(Number(page) || 1, 1);

  const exploBody = {
    mode:      'full',         // required — 'full' returns all available fields
    page_size: pageSize,       // required
    page:      pageNum,
    size:      pageSize,       // total records requested
    filters:   buildFilters(filters),
  };

  let upstream;
  try {
    upstream = await fetch(EXPLORIUM_URL, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key':      apiKey,            // Explorium auth header
      },
      body: JSON.stringify(exploBody),
    });
  } catch (err) {
    console.error('[prospect/search] network error:', err.message);
    return res.status(502).json({ error: `Could not reach Explorium API: ${err.message}` });
  }

  let data;
  try { data = await upstream.json(); } catch { data = {}; }

  if (!upstream.ok) {
    console.error('[prospect/search] Explorium error:', upstream.status, JSON.stringify(data).slice(0, 400));
    const msg = data?.detail || data?.message || data?.error || `Explorium returned ${upstream.status}`;
    const status = upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502;
    return res.status(status).json({ error: msg });
  }

  // Response shape: { data: [...], total_results: N, page: N, total_pages: N }
  const raw      = Array.isArray(data.data) ? data.data : [];
  const prospects = raw.map(normalise);

  return res.status(200).json({
    prospects,
    total:       data.total_results ?? prospects.length,
    total_pages: data.total_pages   ?? 1,
    page:        data.page          ?? pageNum,
  });
}
