import { proxyToLiteLLM } from '../../_litellmProxy.js';

export async function GET(request) {
    return proxyToLiteLLM(request, {
        prefix: '/app/get_file_upload_url',
        method: 'GET',
    });
}
