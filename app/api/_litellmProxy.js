const DEFAULT_LITELLM_URL = 'http://localhost:4000';

function getCookie(request, name) {
    return request.cookies.get(name)?.value;
}

export function getLiteLLMBaseUrl(request) {
    const fromHeader = request.headers.get('x-litellm-url');
    const fromCookie = getCookie(request, 'litellm_url');
    const raw = fromHeader || (fromCookie ? decodeURIComponent(fromCookie) : '') || process.env.LITELLM_URL || DEFAULT_LITELLM_URL;
    return raw.replace(/\/+$/, '');
}

export function getLiteLLMKey(request) {
    const auth = request.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) return auth.slice(7);
    const fromCookie = getCookie(request, 'litellm_key');
    return fromCookie ? decodeURIComponent(fromCookie) : '';
}

function cleanHeaders(request) {
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('connection');
    headers.delete('cookie');
    headers.delete('x-litellm-url');

    const key = getLiteLLMKey(request);
    if (key) headers.set('Authorization', `Bearer ${key}`);
    return headers;
}

function buildTargetUrl(request, prefix, pathSegments = []) {
    const path = pathSegments.filter(Boolean).join('/');
    const { search } = new URL(request.url);
    const cleanPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
    return `${getLiteLLMBaseUrl(request)}${cleanPrefix}${path ? `/${path}` : ''}${search}`;
}

export async function proxyToLiteLLM(request, { prefix, pathSegments = [], method }) {
    const targetUrl = buildTargetUrl(request, prefix, pathSegments);
    const init = {
        method,
        headers: cleanHeaders(request),
    };

    if (method !== 'GET' && method !== 'HEAD') {
        init.body = await request.arrayBuffer();
    }

    const upstream = await fetch(targetUrl, init);
    const headers = new Headers(upstream.headers);
    headers.delete('content-encoding');
    headers.delete('transfer-encoding');

    return new Response(await upstream.arrayBuffer(), {
        status: upstream.status,
        statusText: upstream.statusText,
        headers,
    });
}
