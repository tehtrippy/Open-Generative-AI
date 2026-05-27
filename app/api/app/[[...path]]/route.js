import { proxyToLiteLLM } from '../../_litellmProxy.js';

async function proxy(request, params, method) {
    const slug = await params;
    const path = slug.path || [];
    const effectivePath = path.length === 1 && path[0] === 'get_upload_file'
        ? ['get_file_upload_url']
        : path;

    return proxyToLiteLLM(request, {
        prefix: '/app',
        pathSegments: effectivePath,
        method,
    });
}

export async function GET(request, { params }) {
    return proxy(request, params, 'GET');
}

export async function POST(request, { params }) {
    return proxy(request, params, 'POST');
}

export async function DELETE(request, { params }) {
    return proxy(request, params, 'DELETE');
}

export async function PUT(request, { params }) {
    return proxy(request, params, 'PUT');
}
