import { proxyToLiteLLM } from '../../../_litellmProxy.js';

async function proxy(request, params, method) {
    const slug = await params;
    return proxyToLiteLLM(request, {
        prefix: '/api/v1',
        pathSegments: slug.path || [],
        method,
    });
}

export async function GET(request, { params }) {
    return proxy(request, params, 'GET');
}

export async function POST(request, { params }) {
    return proxy(request, params, 'POST');
}
