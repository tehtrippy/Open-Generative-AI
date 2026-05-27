import { getSizeForLiteLLMModel } from './litellmModels.js';

const LITELLM_URL_KEY = 'litellm_url';
const LITELLM_KEY_KEY = 'litellm_key';
const PROVIDER_KEY = 'ai_provider';

const DEFAULT_LITELLM_URL = 'http://localhost:4000';

function readStorage(key) {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(key) || '';
}

export function getLiteLLMUrl() {
    return (readStorage(LITELLM_URL_KEY) || DEFAULT_LITELLM_URL).replace(/\/+$/, '');
}

export function getLiteLLMKey(apiKey) {
    const key = apiKey || readStorage(LITELLM_KEY_KEY);
    if (!key) throw new Error('LiteLLM API key missing. Please set it in Settings.');
    return key;
}

function ensureLiteLLMMode() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PROVIDER_KEY, 'litellm');
}

function getJsonHeaders(apiKey) {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getLiteLLMKey(apiKey)}`,
    };
}

function getRequestUrl(path) {
    return `${getLiteLLMUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

function getErrorMessage(prefix, response, body) {
    const detail = typeof body === 'string'
        ? body
        : body?.error?.message || body?.error || body?.detail || response.statusText;
    return `${prefix}: ${response.status} - ${String(detail).slice(0, 200)}`;
}

async function parseResponse(response) {
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function notifyAuthRequired(status, detail) {
    if (typeof window === 'undefined') return;
    if (status !== 401 && status !== 403) return;
    window.dispatchEvent(new CustomEvent('litellm:auth-required', { detail: { status, message: detail } }));
}

function extractOutputUrl(data) {
    const first = Array.isArray(data?.data) ? data.data[0] : null;
    const b64 = first?.b64_json || data?.b64_json;
    if (b64) return `data:image/png;base64,${b64}`;

    return (
        first?.url ||
        data?.url ||
        data?.file_url ||
        data?.output?.url ||
        data?.result?.url ||
        data?.outputs?.[0]?.url ||
        data?.outputs?.[0] ||
        data?.output ||
        null
    );
}

function normalizeMediaResponse(data) {
    const url = extractOutputUrl(data);
    return url ? { ...data, url } : data;
}

async function requestJson(path, { apiKey, method = 'GET', body, errorPrefix = 'LiteLLM request failed' } = {}) {
    ensureLiteLLMMode();
    const response = await fetch(getRequestUrl(path), {
        method,
        headers: getJsonHeaders(apiKey),
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await parseResponse(response);
    if (!response.ok) {
        notifyAuthRequired(response.status, data);
        throw new Error(getErrorMessage(errorPrefix, response, data));
    }
    return data;
}

async function pollForResult(requestId, apiKey, maxAttempts = 900, interval = 2000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        const data = await requestJson(`/v1/predictions/${requestId}/result`, {
            apiKey,
            errorPrefix: 'LiteLLM poll failed',
        });
        const status = data?.status?.toLowerCase();
        if (!status || status === 'completed' || status === 'succeeded' || status === 'success') {
            return normalizeMediaResponse(data);
        }
        if (status === 'failed' || status === 'error') {
            throw new Error(`Generation failed: ${data.error || data.detail || 'Unknown error'}`);
        }
    }
    throw new Error('Generation timed out after polling.');
}

async function submitGeneration(path, payload, apiKey, maxAttempts = 900) {
    const data = await requestJson(path, {
        apiKey,
        method: 'POST',
        body: payload,
        errorPrefix: 'LiteLLM generation failed',
    });
    const requestId = data?.request_id || data?.id;
    if (requestId && !extractOutputUrl(data) && !Array.isArray(data?.data)) {
        return await pollForResult(requestId, apiKey, maxAttempts);
    }
    return normalizeMediaResponse(data);
}

function aspectRatioToSize(ar, model) {
    return getSizeForLiteLLMModel(model, ar);
}

function cleanPayload(payload) {
    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}

export async function generateImage(apiKey, params) {
    const payload = cleanPayload({
        model: params.model,
        prompt: params.prompt,
        n: params.num_images || params.n || 1,
        response_format: 'url',
        size: params.size || (params.width && params.height ? `${params.width}x${params.height}` : aspectRatioToSize(params.aspect_ratio, params.model)),
        quality: params.quality,
        style: params.style,
        seed: params.seed !== -1 ? params.seed : undefined,
    });
    return await submitGeneration('/v1/images/generations', payload, apiKey, 60);
}

export async function generateI2I(apiKey, params) {
    const images = params.images_list?.length ? params.images_list : (params.image_url ? [params.image_url] : []);
    const payload = cleanPayload({
        model: params.model,
        prompt: params.prompt || '',
        image: images[0],
        images,
        n: params.num_images || 1,
        response_format: 'url',
        size: params.size || (params.width && params.height ? `${params.width}x${params.height}` : aspectRatioToSize(params.aspect_ratio, params.model)),
        strength: params.strength,
    });
    return await submitGeneration('/v1/images/generations', payload, apiKey, 60);
}

export async function generateVideo(apiKey, params) {
    const payload = cleanPayload({
        model: params.model,
        prompt: params.prompt || '',
        image: params.image_url,
        aspect_ratio: params.aspect_ratio,
        duration: params.duration,
        resolution: params.resolution,
        quality: params.quality,
        mode: params.mode,
    });
    return await submitGeneration('/v1/video/generations', payload, apiKey, 900);
}

export async function generateI2V(apiKey, params) {
    const payload = cleanPayload({
        model: params.model,
        prompt: params.prompt || '',
        image: params.image_url,
        last_image: params.last_image,
        aspect_ratio: params.aspect_ratio,
        duration: params.duration,
        resolution: params.resolution,
        quality: params.quality,
        mode: params.mode,
    });
    return await submitGeneration('/v1/video/generations', payload, apiKey, 900);
}

export async function generateMarketingStudioAd(apiKey, params) {
    const payload = cleanPayload({
        model: params.model || params.resolution || 'marketing-studio',
        prompt: params.prompt,
        aspect_ratio: params.aspect_ratio || '16:9',
        duration: params.duration || 5,
        images: params.images_list || [],
        videos: params.video_files || [],
        resolution: params.resolution,
    });
    return await submitGeneration('/v1/video/generations', payload, apiKey, 900);
}

export async function processV2V(apiKey, params) {
    const payload = cleanPayload({
        model: params.model,
        video: params.video_url,
        image: params.image_url,
        prompt: params.prompt || '',
    });
    return await submitGeneration('/v1/video/generations', payload, apiKey, 900);
}

export async function processLipSync(apiKey, params) {
    const payload = cleanPayload({
        model: params.model,
        audio: params.audio_url,
        image: params.image_url,
        video: params.video_url,
        prompt: params.prompt,
        resolution: params.resolution,
        seed: params.seed !== -1 ? params.seed : undefined,
    });
    return await submitGeneration('/v1/video/generations', payload, apiKey, 900);
}

export function uploadFile(apiKey, file, onProgress) {
    ensureLiteLLMMode();
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('purpose', 'assistants');

        const xhr = new XMLHttpRequest();
        xhr.open('POST', getRequestUrl('/v1/files'));
        xhr.setRequestHeader('Authorization', `Bearer ${getLiteLLMKey(apiKey)}`);

        if (onProgress) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
            };
        }

        xhr.onload = () => {
            let data = null;
            try { data = xhr.responseText ? JSON.parse(xhr.responseText) : null; } catch {}
            if (xhr.status >= 200 && xhr.status < 300) {
                const fileUrl = extractOutputUrl(data);
                if (!fileUrl) {
                    reject(new Error('LiteLLM file upload did not return a usable URL. Configure your LiteLLM gateway to return url or file_url for uploaded media.'));
                } else {
                    resolve(fileUrl);
                }
            } else {
                const detail = data?.error?.message || data?.detail || xhr.statusText;
                notifyAuthRequired(xhr.status, detail);
                reject(new Error(`LiteLLM file upload failed: ${xhr.status} - ${detail}`));
            }
        };

        xhr.onerror = () => reject(new Error('Network error during LiteLLM file upload'));
        xhr.send(formData);
    });
}

export async function getUserBalance() {
    return { username: 'LiteLLM User', email: null, balance: null };
}

export async function getTemplateWorkflows(apiKey) {
    return await requestJson('/workflow/get-template-workflows', { apiKey });
}

export async function getUserWorkflows(apiKey) {
    return await requestJson('/workflow/get-workflow-defs', { apiKey });
}

export async function getPublishedWorkflows(apiKey) {
    return await requestJson('/workflow/get-published-workflows', { apiKey });
}

export async function createWorkflow(apiKey, payload) {
    return await requestJson('/workflow/create', { apiKey, method: 'POST', body: payload });
}

export async function updateWorkflowName(apiKey, workflowId, name) {
    return await requestJson(`/workflow/update-name/${workflowId}`, { apiKey, method: 'POST', body: { name } });
}

export async function deleteWorkflow(apiKey, workflowId) {
    return await requestJson(`/workflow/delete-workflow-def/${workflowId}`, { apiKey, method: 'DELETE' });
}

export async function getWorkflowInputs(apiKey, workflowId) {
    return await requestJson(`/workflow/${workflowId}/api-inputs`, { apiKey });
}

export async function executeWorkflow(apiKey, workflowId, inputs) {
    const data = await requestJson(`/workflow/${workflowId}/api-execute`, {
        apiKey,
        method: 'POST',
        body: { inputs },
    });
    const runId = data?.run_id || data?.id;
    if (!runId) return data;
    return await pollWorkflowResult(runId, apiKey);
}

async function pollWorkflowResult(runId, apiKey, maxAttempts = 900, interval = 2000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        const data = await requestJson(`/workflow/run/${runId}/api-outputs`, { apiKey });
        const status = data?.status?.toLowerCase();
        if (!status || status === 'completed' || status === 'succeeded' || status === 'success') return data;
        if (status === 'failed' || status === 'error') throw new Error(`Workflow failed: ${data.error || 'Unknown error'}`);
    }
    throw new Error('Workflow timed out after polling.');
}

export async function getAllNodeSchemas(apiKey, workflowId) {
    return await requestJson(`/workflow/${workflowId}/node-schemas`, { apiKey });
}

export async function getWorkflowData(apiKey, workflowId) {
    return await requestJson(`/workflow/get-workflow-def/${workflowId}`, { apiKey });
}

export async function getNodeSchemas(apiKey, workflowId) {
    return await requestJson(`/workflow/${workflowId}/api-node-schemas`, { apiKey });
}

export async function runSingleNode(apiKey, workflowId, nodeId, payload) {
    return await requestJson(`/workflow/${workflowId}/node/${nodeId}/run`, { apiKey, method: 'POST', body: payload });
}

export async function getTemplateAgents(apiKey) {
    const data = await requestJson('/agents/templates/agents', { apiKey });
    return Array.isArray(data) ? data : (data?.agents || data?.items || []);
}

export async function getUserAgents(apiKey) {
    const data = await requestJson('/agents/user/agents', { apiKey });
    return Array.isArray(data) ? data : (data?.agents || data?.items || []);
}

export async function getPublishedAgents(apiKey) {
    const data = await requestJson('/agents/featured/agents', { apiKey });
    return Array.isArray(data) ? data : (data?.agents || data?.items || []);
}

export async function getUserConversations(apiKey) {
    const data = await requestJson('/agents/user/conversations', { apiKey });
    return Array.isArray(data) ? data : (data?.conversations || data?.items || []);
}

export async function registerAppInterest(apiKey, appName) {
    return await requestJson('/app/register-interest', { apiKey, method: 'POST', body: { app_name: appName } });
}

export async function getAppInterests(apiKey) {
    const data = await requestJson('/app/interests', { apiKey });
    return Array.isArray(data) ? data : (data?.interests || data?.items || []);
}
