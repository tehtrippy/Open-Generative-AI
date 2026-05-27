const DEFAULT_BYTEPLUS_URL = 'https://ark.ap-southeast.bytepluses.com/api/v3';

function getCookie(request, name) {
  return request.cookies.get(name)?.value;
}

function getBytePlusBaseUrl(request) {
  const fromHeader = request.headers.get('x-byteplus-url');
  const fromCookie = getCookie(request, 'byteplus_base_url');
  const raw = fromHeader || (fromCookie ? decodeURIComponent(fromCookie) : '') || process.env.BYTEPLUS_BASE_URL || DEFAULT_BYTEPLUS_URL;
  return raw.replace(/\/+$/, '');
}

function getBytePlusKey(request) {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return '';
}

export async function POST(request, { params }) {
  const pathSegments = (await params).path || [];
  const path = pathSegments.filter(Boolean).join('/');
  const { search } = new URL(request.url);
  const targetUrl = `${getBytePlusBaseUrl(request)}/${path}${search}`;

  console.log('[BytePlus POST]', targetUrl);

  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  const key = getBytePlusKey(request);
  if (key) headers.set('Authorization', `Bearer ${key}`);

  const body = await request.arrayBuffer();

  let upstream;
  try {
    upstream = await fetch(targetUrl, { method: 'POST', headers, body });
  } catch (err) {
    console.error('[BytePlus POST] fetch error:', err.message);
    return new Response(JSON.stringify({ error: `Proxy fetch failed: ${err.message}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const resBody = await upstream.arrayBuffer();

  if (!upstream.ok) {
    const text = Buffer.from(resBody).toString('utf-8').slice(0, 1000);
    console.error(`[BytePlus POST] ${upstream.status} from ${targetUrl}:`, text);
  }

  const resHeaders = new Headers(upstream.headers);
  resHeaders.delete('content-encoding');
  resHeaders.delete('transfer-encoding');
  resHeaders.delete('content-length');

  return new Response(resBody, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: resHeaders,
  });
}

export async function GET(request, { params }) {
  const pathSegments = (await params).path || [];
  const path = pathSegments.filter(Boolean).join('/');
  const { search } = new URL(request.url);
  const targetUrl = `${getBytePlusBaseUrl(request)}/${path}${search}`;

  const headers = new Headers();
  const key = getBytePlusKey(request);
  if (key) headers.set('Authorization', `Bearer ${key}`);

  let upstream;
  try {
    upstream = await fetch(targetUrl, { method: 'GET', headers });
  } catch (err) {
    console.error('[BytePlus GET] fetch error:', err.message);
    return new Response(JSON.stringify({ error: `Proxy fetch failed: ${err.message}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const resBody = await upstream.arrayBuffer();

  const resHeaders = new Headers(upstream.headers);
  resHeaders.delete('content-encoding');
  resHeaders.delete('transfer-encoding');
  resHeaders.delete('content-length');

  return new Response(resBody, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: resHeaders,
  });
}