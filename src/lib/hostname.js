/**
 * hostname.js — subdomain routing utility
 *
 * nomaad.ai / www.nomaad.ai  → landing page only
 * app.nomaad.ai               → full app (auth required)
 * username.nomaad.ai          → public creator profile
 * localhost                   → full app (dev mode)
 */

export const APP_URL  = 'https://app.nomaad.ai';
export const BASE_URL = 'https://nomaad.ai';

/**
 * Returns one of:
 *   { route: 'local' }              — localhost dev
 *   { route: 'app' }               — app.nomaad.ai
 *   { route: 'landing' }           — www.nomaad.ai / nomaad.ai
 *   { route: 'profile', username } — username.nomaad.ai
 */
export function getHostnameRoute() {
  const host = window.location.hostname;
  const params = new URLSearchParams(window.location.search);

  // Dev mode: allow ?route=landing to preview landing page
  if ((host === 'localhost' || host === '127.0.0.1') && params.get('route') === 'landing') {
    return { route: 'landing' };
  }

  if (host === 'localhost' || host === '127.0.0.1') return { route: 'local' };
  if (host === 'app.nomaad.ai')                     return { route: 'app' };
  if (host === 'nomaad.ai' || host === 'www.nomaad.ai') return { route: 'landing' };

  const match = host.match(/^([a-z0-9][a-z0-9-]*?)\.nomaad\.ai$/);
  if (match) return { route: 'profile', username: match[1] };

  return { route: 'landing' };
}

/** Navigate to the app from the landing page */
export function goToApp() {
  const { route } = getHostnameRoute();
  if (route === 'local') return; // dev: handled inline
  window.location.href = APP_URL;
}

/** Returns the public profile URL for a given username */
export function profileUrl(username) {
  const { route } = getHostnameRoute();
  if (route === 'local') return `http://localhost:5173/?profile=${username}`; // dev fallback
  return `https://${username}.nomaad.ai`;
}
