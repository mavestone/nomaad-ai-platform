// Vercel serverless — GET /api/prospect/autocomplete?field=linkedin_category&query=market
// Explorium Autocomplete: GET https://api.explorium.ai/v1/prospects/autocomplete
// Docs: https://developers.explorium.ai/reference/prospects/prospects_autocomplete

export const config = { runtime: 'nodejs' };

const EXPLORIUM_URL = 'https://api.explorium.ai/v1/prospects/autocomplete';

// Valid autocomplete fields
const VALID_FIELDS = new Set([
  'linkedin_category', 'google_category', 'naics_category',
  'job_title', 'job_department', 'job_level',
  'country', 'country_code', 'region_country_code', 'city_region_country',
  'company_size', 'company_revenue', 'company_name',
  'company_tech_stack_tech', 'company_tech_stack_categories',
  'business_intent_topics',
]);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.EXPLORIUM_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'EXPLORIUM_API_KEY not configured.', setup_required: true });

  const { field, query = '', semantic = 'false' } = req.query || {};

  if (!field || !VALID_FIELDS.has(field)) {
    return res.status(400).json({ error: `Invalid field. Valid: ${[...VALID_FIELDS].join(', ')}` });
  }

  const params = new URLSearchParams({ field, query });
  if (semantic === 'true') params.set('semantic_search', 'true');

  let upstream;
  try {
    upstream = await fetch(`${EXPLORIUM_URL}?${params}`, {
      headers: { 'api_key': apiKey },
    });
  } catch (err) {
    return res.status(502).json({ error: `Network error: ${err.message}` });
  }

  let data;
  try { data = await upstream.json(); } catch { data = []; }

  if (!upstream.ok) {
    const msg = data?.detail || data?.message || `Explorium ${upstream.status}`;
    return res.status(upstream.status < 600 ? upstream.status : 502).json({ error: msg });
  }

  // Returns [{ query, label, value }]
  return res.status(200).json(Array.isArray(data) ? data : []);
}
