// Vercel serverless — POST /api/prospect/search
// Explorium Fetch Prospects: POST https://api.explorium.ai/v1/prospects
// Docs: https://developers.explorium.ai/reference/prospects/fetch_prospects

export const config = { runtime: 'nodejs' };

const EXPLORIUM_URL = 'https://api.explorium.ai/v1/prospects';

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

function normalise(p) {
  const city    = p.city || '';
  const country = p.country_name || '';
  const region  = p.region_name  || '';
  const location = [city, region, country].filter(Boolean).join(', ');

  return {
    id:               p.prospect_id,
    prospect_id:      p.prospect_id,
    full_name:        p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Unknown',
    job_title:        p.job_title || '',
    job_level:        p.job_level_main || '',
    job_department:   p.job_department_main || '',
    company_name:     p.company_name || '',
    company_size:     p.company_size || '',
    company_website:  p.company_website || '',
    company_linkedin: p.company_linkedin || '',
    business_id:      p.business_id || '',
    location,
    city,
    region,
    country,
    linkedin_url:     p.linkedin || (Array.isArray(p.linkedin_url_array) ? p.linkedin_url_array[0] : '') || '',
    has_email:        !!p.professional_email_hashed,
    skills:           Array.isArray(p.skills) ? p.skills.slice(0, 8) : [],
    experience:       Array.isArray(p.experience) ? p.experience.slice(0, 3) : [],
  };
}

function buildFilters(f) {
  const out = {};

  if (f.linkedin_category?.length)
    out.linkedin_category = { values: f.linkedin_category };

  if (f.google_category?.length)
    out.google_category = { values: f.google_category };

  if (f.job_level?.length)
    out.job_level = { values: f.job_level };

  if (f.job_department?.length)
    out.job_department = { values: f.job_department };

  if (f.job_title) {
    out.job_title = {
      values: [f.job_title],
      include_related_job_titles: f.include_related !== false, // default true
    };
  }

  if (f.country_code)
    out.country_code = { values: [f.country_code.toUpperCase()] };

  if (f.company_country_code)
    out.company_country_code = { values: [f.company_country_code.toUpperCase()] };

  if (f.company_size?.length)
    out.company_size = { values: f.company_size };

  if (f.company_name)
    out.company_name = { values: [f.company_name] };

  if (f.has_email === true)
    out.has_email = { value: true };

  if (f.has_phone === true)
    out.has_phone_number = { value: true };

  // Experience range (months)
  if (f.min_experience || f.max_experience) {
    out.total_experience_months = {};
    if (f.min_experience) out.total_experience_months.gte = Number(f.min_experience);
    if (f.max_experience) out.total_experience_months.lte = Number(f.max_experience);
  }

  return out;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.EXPLORIUM_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'EXPLORIUM_API_KEY not configured.',
      setup_required: true,
    });
  }

  let payload;
  try { payload = await readBody(req); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const { filters = {}, limit = 25, page = 1 } = payload;
  const pageSize = Math.min(Math.max(Number(limit) || 25, 1), 100);

  const body = {
    mode:      'full',
    page_size: pageSize,
    size:      pageSize,
    page:      Math.max(Number(page) || 1, 1),
    filters:   buildFilters(filters),
  };

  let upstream;
  try {
    upstream = await fetch(EXPLORIUM_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'API_KEY': apiKey },
      body:    JSON.stringify(body),
    });
  } catch (err) {
    return res.status(502).json({ error: `Network error: ${err.message}` });
  }

  let data;
  try { data = await upstream.json(); } catch { data = {}; }

  if (!upstream.ok) {
    const msg = data?.detail || data?.message || data?.error || `Explorium ${upstream.status}`;
    console.error('[search] Explorium error:', upstream.status, msg);
    return res.status(upstream.status < 600 ? upstream.status : 502).json({ error: msg });
  }

  const prospects = Array.isArray(data.data) ? data.data.map(normalise) : [];

  return res.status(200).json({
    prospects,
    total:       data.total_results ?? prospects.length,
    total_pages: data.total_pages   ?? 1,
    page:        data.page          ?? 1,
  });
}
