const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

function validatePublicUrl(value) {
  const parsed = new URL(value);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only http and https product URLs are supported');
  if (BLOCKED_HOSTS.has(parsed.hostname) || parsed.hostname.endsWith('.local')) throw new Error('Local URLs are not allowed');
  return parsed;
}

function decodeEntities(value) {
  return value.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&#x27;/gi, "'");
}

function extractPageText(html) {
  return decodeEntities(html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim())
    .slice(0, 100000);
}

async function fetchProductPage(value) {
  const parsedUrl = validatePublicUrl(value);
  const response = await fetch(parsedUrl, {
    headers: { 'User-Agent': 'MitraScan-AuditBot/1.0 (+legal-metrology-audit)' },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Product page returned HTTP ${response.status}`);
  const html = await response.text();
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || parsedUrl.hostname;
  const text = extractPageText(html);
  if (text.length < 80) throw new Error('The product page did not expose enough readable text; it may require JavaScript or block automated access');
  return { sourceUrl: parsedUrl.toString(), pageTitle: decodeEntities(title).replace(/\s+/g, ' ').trim(), text };
}

module.exports = { fetchProductPage };