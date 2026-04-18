// Vercel serverless function — POST /api/prospect/apollo
// Queries Apollo.io People API (mixed_people/api_search)
//
// Request body:
//   {
//     person_titles?: string[],
//     person_seniorities?: string[],   // owner|founder|c_suite|vp|director|manager|senior|entry|intern
//     person_locations?: string[],
//     organization_locations?: string[],
//     q_organization_domains_list?: string[],
//     contact_email_status?: string[], // verified|unverified|likely_to_engage|unavailable
//     page?: number,
//     per_page?: number,
//   }
//
// Response:
//   200 { people: [...], pagination: { page, per_page, total_entries, total_pages } }
//   503 { error, setup_required: true }   ← missing API key
//   4xx/5xx { error }

export const config = { runtime: 'nodejs' };

const APOLLO_URL = 'https://api.apollo.io/api/v1/mixed_people/api_search';

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

/** Normalise Apollo person into a predictable shape */
function normalisePerson(p) {
  return {
    id: p.id,
    name: p.name || [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Unknown',
    first_name: p.first_name || '',
    last_name: p.last_name || '',
    title: p.title || '',
    organization_name: p.organization_name || p.organization?.name || '',
    organization: p.organization || null,
    city: p.city || '',
    state: p.state || '',
    country: p.country || '',
    email: p.email || '',
    email_status: p.email_status || 'unavailable',
    phone_numbers: p.phone_numbers || [],
    photo_url: p.photo_url || '',
    linkedin_url: p.linkedin_url || '',
    industry: p.industry || '',
    seniority: p.seniority || '',
    departments: p.departments || [],
    subdepartments: p.subdepartments || [],
    employment_history: p.employment_history || [],
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'APOLLO_API_KEY is not configured. Add it to Vercel environment variables and redeploy.',
      setup_required: true,
    });
  }

  let payload;
  try { payload = await readBody(req); }
  catch { return res.status(400).json({ error: 'Invalid JSON body' }); }

  const {
    person_titles = [],
    person_seniorities = [],
    person_locations = [],
    organization_locations = [],
    q_organization_domains_list = [],
    contact_email_status = [],
    page = 1,
    per_page = 25,
  } = payload;

  // Build Apollo request body — api_key goes in body (Apollo's supported auth method)
  const body = {
    api_key: apiKey,
    page: Math.max(1, Number(page) || 1),
    per_page: Math.min(Math.max(Number(per_page) || 25, 1), 100),
  };

  if (person_titles.length) body.person_titles = person_titles;
  if (person_seniorities.length) body.person_seniorities = person_seniorities;
  if (person_locations.length) body.person_locations = person_locations;
  if (organization_locations.length) body.organization_locations = organization_locations;
  if (q_organization_domains_list.length) body.q_organization_domains_list = q_organization_domains_list;
  if (contact_email_status.length) body.contact_email_status = contact_email_status;

  let upstream;
  try {
    upstream = await fetch(APOLLO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('[prospect/apollo] fetch error:', err.message);
    return res.status(502).json({ error: `Could not reach Apollo API: ${err.message}` });
  }

  let data;
  try { data = await upstream.json(); } catch { data = {}; }

  if (!upstream.ok) {
    console.error('[prospect/apollo] Apollo error:', upstream.status, data);
    // 401 = invalid key, 403 = not master key
    if (upstream.status === 401 || upstream.status === 403) {
      return res.status(upstream.status).json({
        error: upstream.status === 403
          ? 'Apollo requires a Master API Key for people search. Enable it in Apollo → Settings → Integrations → API.'
          : 'Invalid Apollo API key.',
      });
    }
    const msg = data?.message || data?.error || data?.detail || `Apollo returned ${upstream.status}`;
    return res.status(upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502).json({ error: msg });
  }

  const people = Array.isArray(data.people) ? data.people.map(normalisePerson) : [];
  const pagination = data.pagination || {
    page: body.page,
    per_page: body.per_page,
    total_entries: people.length,
    total_pages: 1,
  };

  return res.status(200).json({ people, pagination });
}
