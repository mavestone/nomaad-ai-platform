// Vercel serverless function — POST /api/prospect/search
// Queries Explorium (Vibe Prospecting) REST API and returns normalised prospect records.
//
// Request body:
//   { filters: { linkedin_category?, job_level?, job_department?, prospect_country_code?,
//                company_size?, website_keywords? }, limit?: number }
//
// Response:
//   200 { prospects: [...], total: number }
//   503 { error: string, setup_required: true }   ← missing API key
//   4xx/5xx { error: string }

export const config = { runtime: 'nodejs' };

const EXPLORIUM_BASE = 'https://api.explorium.ai/v1';

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

/** Flatten whatever shape Explorium returns into a predictable object */
function normalise(p) {
  const firstName = p.first_name || '';
  const lastName = p.last_name || '';
  const fullName = p.full_name || p.name || [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
  const location = p.location || [p.city, p.country].filter(Boolean).join(', ') || '';

  return {
    id: p.prospect_id || p.id || p.uid || null,
    prospect_id: p.prospect_id || p.id || null,
    full_name: fullName,
    job_title: p.job_title || p.title || p.current_title || '',
    company_name: p.company_name || p.employer || p.current_company || '',
    linkedin_industry: p.linkedin_industry || p.industry || '',
    location,
    city: p.city || '',
    country: p.country || '',
    company_size: p.company_size || '',
    bio: p.bio || p.summary || '',
    has_email: p.has_email || false,
    has_phone_number: p.has_phone_number || false,
    linkedin_url: p.linkedin_url || p.linkedin || '',
  };
}

// ─── handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS pre-flight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check API key
  const apiKey = process.env.EXPLORIUM_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'EXPLORIUM_API_KEY is not configured. Add it to your Vercel environment variables and redeploy.',
      setup_required: true,
    });
  }

  // Parse request
  let payload;
  try { payload = await readBody(req); }
  catch { return res.status(400).json({ error: 'Invalid JSON body' }); }

  const { filters = {}, limit = 25 } = payload;
  const numResults = Math.min(Math.max(Number(limit) || 25, 1), 100);

  // Build Explorium filter object — only include non-empty values
  const exploFilters = {};

  if (Array.isArray(filters.linkedin_category) && filters.linkedin_category.length) {
    exploFilters.linkedin_category = filters.linkedin_category;
  }
  if (filters.job_level && filters.job_level !== 'any level') {
    // Explorium expects lowercase: 'director', 'manager', 'vp', 'c-suite'
    exploFilters.job_level = String(filters.job_level).toLowerCase();
  }
  if (filters.job_department && filters.job_department !== 'any dept.') {
    exploFilters.job_department = String(filters.job_department).toLowerCase();
  }
  if (filters.prospect_country_code) {
    exploFilters.prospect_country_code = String(filters.prospect_country_code).toUpperCase();
  }
  if (filters.company_size && filters.company_size !== 'any size') {
    exploFilters.company_size = String(filters.company_size);
  }
  if (Array.isArray(filters.website_keywords) && filters.website_keywords.length) {
    exploFilters.website_keywords = filters.website_keywords;
  }

  // Call Explorium
  let upstream;
  try {
    upstream = await fetch(`${EXPLORIUM_BASE}/prospects/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': apiKey,
      },
      body: JSON.stringify({
        entity_type: 'prospects',
        filters: exploFilters,
        number_of_results: numResults,
      }),
    });
  } catch (err) {
    console.error('[prospect/search] upstream fetch failed:', err.message);
    return res.status(502).json({ error: `Could not reach Explorium API: ${err.message}` });
  }

  // Read response body once
  let data;
  try { data = await upstream.json(); }
  catch { data = {}; }

  if (!upstream.ok) {
    console.error('[prospect/search] Explorium error:', upstream.status, data);
    const msg = data?.message || data?.error || data?.detail || `Explorium returned ${upstream.status}`;
    return res.status(upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502).json({ error: msg });
  }

  // Normalise — Explorium may return data under different keys
  const raw = data.prospects || data.data || data.results || data.items || data.records || [];
  const prospects = Array.isArray(raw) ? raw.map(normalise) : [];

  return res.status(200).json({
    prospects,
    total: data.total || data.count || prospects.length,
  });
}
