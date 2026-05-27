// BytePlus ModelArk video generation client.
// Direct API integration for Seedance video models.

const BYTEPLUS_KEY_STORAGE = 'byteplus_api_key';
const BYTEPLUS_URL_STORAGE = 'byteplus_base_url';
const DEFAULT_BASE_URL = 'https://ark.ap-southeast.bytepluses.com/api/v3';
const POLL_INTERVAL = 5000;
const POLL_TIMEOUT = 5 * 60 * 1000;

export const videoModels = [
  {
    id: 'seedance-1-0-pro-fast-251015',
    name: 'Seedance 1.0 Pro Fast',
    description: '3x faster than Pro, 72% lower cost. Best balance of quality, speed, and cost.',
    type: 'both',
    isDefault: true,
    supportedResolutions: ['480p', '720p', '1080p'],
    supportedAspectRatios: ['16:9', '9:16', '1:1', '4:3'],
    minDuration: 2,
    maxDuration: 12,
    provider: 'byteplus',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt', description: 'The prompt to generate the video' },
      aspect_ratio: { enum: ['16:9', '9:16', '1:1', '4:3'], title: 'Aspect Ratio', name: 'aspect_ratio', type: 'string', default: '16:9' },
      duration: { title: 'Duration', name: 'duration', type: 'int', description: 'Duration in seconds', default: 5, minValue: 2, maxValue: 12, step: 1 },
      resolution: { enum: ['480p', '720p', '1080p'], title: 'Resolution', name: 'resolution', type: 'string', default: '480p' },
    },
  },
  {
    id: 'seedance-1-0-pro-250528',
    name: 'Seedance 1.0 Pro',
    description: 'Cinematic quality with multi-shot narrative capability. Up to 1080p.',
    type: 'both',
    isDefault: false,
    supportedResolutions: ['480p', '720p', '1080p'],
    supportedAspectRatios: ['16:9', '9:16', '1:1', '4:3'],
    minDuration: 2,
    maxDuration: 12,
    provider: 'byteplus',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt', description: 'The prompt to generate the video' },
      aspect_ratio: { enum: ['16:9', '9:16', '1:1', '4:3'], title: 'Aspect Ratio', name: 'aspect_ratio', type: 'string', default: '16:9' },
      duration: { title: 'Duration', name: 'duration', type: 'int', description: 'Duration in seconds', default: 5, minValue: 2, maxValue: 12, step: 1 },
      resolution: { enum: ['480p', '720p', '1080p'], title: 'Resolution', name: 'resolution', type: 'string', default: '480p' },
    },
  },
  {
    id: 'seedance-1-5-pro-251215',
    name: 'Seedance 1.5 Pro',
    description: 'Native audio-video generation. Synchronized dialogue and sound. Image-to-video only.',
    type: 'i2v',
    isDefault: false,
    supportedResolutions: ['480p', '720p', '1080p'],
    supportedAspectRatios: ['16:9', '9:16', '1:1', '4:3', '21:9'],
    minDuration: 4,
    maxDuration: 12,
    supportsAudio: true,
    provider: 'byteplus',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt', description: 'The prompt to generate the video' },
      aspect_ratio: { enum: ['16:9', '9:16', '1:1', '4:3', '21:9'], title: 'Aspect Ratio', name: 'aspect_ratio', type: 'string', default: '16:9' },
      duration: { title: 'Duration', name: 'duration', type: 'int', description: 'Duration in seconds', default: 5, minValue: 4, maxValue: 12, step: 1 },
      resolution: { enum: ['480p', '720p', '1080p'], title: 'Resolution', name: 'resolution', type: 'string', default: '480p' },
    },
  },
  {
    id: 'dreamina-seedance-2-0-260128',
    name: 'Dreamina Seedance 2.0',
    description: 'Next-generation video generation with improved quality and motion.',
    type: 'both',
    isDefault: false,
    supportedResolutions: ['480p', '720p', '1080p'],
    supportedAspectRatios: ['16:9', '9:16', '1:1', '4:3'],
    minDuration: 2,
    maxDuration: 12,
    provider: 'byteplus',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt', description: 'The prompt to generate the video' },
      aspect_ratio: { enum: ['16:9', '9:16', '1:1', '4:3'], title: 'Aspect Ratio', name: 'aspect_ratio', type: 'string', default: '16:9' },
      duration: { title: 'Duration', name: 'duration', type: 'int', description: 'Duration in seconds', default: 5, minValue: 2, maxValue: 12, step: 1 },
      resolution: { enum: ['480p', '720p', '1080p'], title: 'Resolution', name: 'resolution', type: 'string', default: '480p' },
    },
  },
  {
    id: 'dreamina-seedance-2-0-fast-260128',
    name: 'Dreamina Seedance 2.0 Fast',
    description: 'Fast version of Seedance 2.0. Quick generation with great quality.',
    type: 'both',
    isDefault: false,
    supportedResolutions: ['480p', '720p', '1080p'],
    supportedAspectRatios: ['16:9', '9:16', '1:1', '4:3'],
    minDuration: 2,
    maxDuration: 12,
    provider: 'byteplus',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt', description: 'The prompt to generate the video' },
      aspect_ratio: { enum: ['16:9', '9:16', '1:1', '4:3'], title: 'Aspect Ratio', name: 'aspect_ratio', type: 'string', default: '16:9' },
      duration: { title: 'Duration', name: 'duration', type: 'int', description: 'Duration in seconds', default: 5, minValue: 2, maxValue: 12, step: 1 },
      resolution: { enum: ['480p', '720p', '1080p'], title: 'Resolution', name: 'resolution', type: 'string', default: '480p' },
    },
  },
];

export function getBytePlusApiKey() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(BYTEPLUS_KEY_STORAGE) || '';
}

export function hasBytePlusCredentials() {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(BYTEPLUS_KEY_STORAGE));
}

function getProxyPath() {
  return '/api/byteplus';
}

async function createVideoTask(modelId, content, options = {}) {
  const apiKey = getBytePlusApiKey();
  if (!apiKey) throw new Error('BytePlus API Key missing. Add it in Settings.');

  const proxyBase = getProxyPath();
  const url = `${proxyBase}/contents/generations/tasks`;

  const body = { model: modelId, content };
  if (options.duration) body.duration = options.duration;
  if (options.ratio) body.ratio = options.ratio;
  body.watermark = false;

  const customBaseUrl = typeof window !== 'undefined' ? localStorage.getItem(BYTEPLUS_URL_STORAGE) : '';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  if (customBaseUrl) headers['x-byteplus-url'] = customBaseUrl;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errText = '';
    try { errText = await response.text(); } catch {}
    throw new Error(`BytePlus API Error (${response.status}): ${errText.slice(0, 500)}`);
  }

  const data = await response.json();
  const taskId = data?.id || data?.task_id || data?.data?.id;
  if (!taskId) {
    throw new Error(`BytePlus API did not return a task ID. Response: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return taskId;
}

async function pollVideoTask(taskId) {
  const apiKey = getBytePlusApiKey();
  if (!apiKey) throw new Error('BytePlus API Key missing during polling.');

  const proxyBase = getProxyPath();
  const pollUrl = `${proxyBase}/contents/generations/tasks/${taskId}`;
  const startTime = Date.now();
  let attempt = 0;

  while (Date.now() - startTime < POLL_TIMEOUT) {
    attempt++;
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

    const response = await fetch(pollUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      if (response.status >= 500) continue;
      const errText = await response.text();
      throw new Error(`BytePlus poll failed (${response.status}): ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const status = (data?.status || data?.data?.status || '').toLowerCase();

    if (status === 'succeeded' || status === 'success' || status === 'completed') {
      const videoUrl =
        data?.content?.video_url ||
        data?.data?.video_url ||
        data?.data?.output?.video_url ||
        data?.data?.outputs?.[0] ||
        data?.output?.video_url ||
        data?.video_url ||
        data?.url;

      if (!videoUrl) {
        throw new Error(`BytePlus task succeeded but no video URL found. Response: ${JSON.stringify(data).slice(0, 300)}`);
      }
      return videoUrl;
    }

    if (status === 'failed' || status === 'error') {
      const errorMsg = data?.error?.message || data?.data?.error || data?.error || 'Unknown error';
      throw new Error(`BytePlus generation failed: ${errorMsg}`);
    }
  }

  throw new Error(`BytePlus generation timed out after ${Math.round(POLL_TIMEOUT / 1000)}s (${attempt} polls).`);
}

export async function byteplusGenerateVideo(modelId, prompt, options = {}, imageUrl = null) {
  const content = [];
  if (imageUrl) content.push({ type: 'image_url', image_url: { url: imageUrl } });
  content.push({ type: 'text', text: prompt || '' });

  const taskId = await createVideoTask(modelId, content, options);
  const videoUrl = await pollVideoTask(taskId);

  return { url: videoUrl, taskId, model: modelId };
}
