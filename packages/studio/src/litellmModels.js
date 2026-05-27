// Fetches available models from a LiteLLM (OpenAI-compatible) proxy.
// Returns models in the same shape as models.js so the UI can use them directly.

const LITELLM_URL_KEY = 'litellm_url';
const LITELLM_KEY = 'litellm_key';

function getLiteLLMConfig() {
  if (typeof window === 'undefined') return { url: 'http://localhost:4000', key: '' };
  return {
    url: (localStorage.getItem(LITELLM_URL_KEY) || 'http://localhost:4000').replace(/\/+$/, ''),
    key: localStorage.getItem(LITELLM_KEY) || '',
  };
}

/**
 * Fetch available models from LiteLLM's /v1/models endpoint.
 * Returns an array of { id, name, endpoint } objects.
 * Caches result for 60 seconds.
 */
let _cache = null;
let _cacheTime = 0;

function toStringValue(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function firstString(...values) {
  for (const value of values) {
    const normalized = toStringValue(value);
    if (normalized) return normalized;
  }
  return '';
}

function isProviderQualifiedModel(value) {
  const model = toStringValue(value);
  if (!model) return false;
  return (
    model.includes('/') ||
    model.startsWith('azure:') ||
    model.startsWith('vertex_ai:') ||
    model.startsWith('bedrock:')
  );
}

function uniq(values) {
  const seen = new Set();
  const result = [];
  values.forEach((value) => {
    const normalized = toStringValue(value);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    result.push(normalized);
  });
  return result;
}

function chooseRequestModel(raw, fallbackId = '') {
  const candidates = uniq([
    raw?.litellm_params?.model,
    raw?.model_info?.base_model,
    raw?.model_info?.model,
    raw?.model,
    raw?.id,
    raw?.model_name,
    fallbackId,
  ]);
  return candidates.find(isProviderQualifiedModel) || candidates[0] || '';
}

const GENERIC_IMAGE_SIZE_BY_AR = {
  '1:1': '1024x1024',
  '16:9': '1792x1024',
  '9:16': '1024x1792',
  '4:3': '1024x768',
  '3:4': '768x1024',
  '3:2': '1152x768',
  '2:3': '768x1152',
  '21:9': '1792x768',
};

const GPT_IMAGE_SIZE_BY_AR = {
  '1:1': '1024x1024',
  '3:2': '1536x1024',
  '2:3': '1024x1536',
};

const DALLE_3_SIZE_BY_AR = {
  '1:1': '1024x1024',
  '16:9': '1792x1024',
  '9:16': '1024x1792',
};

const DALLE_2_SIZE_BY_AR = {
  '1:1': '1024x1024',
};

const SIZE_TO_AR = {
  '1024x1024': '1:1',
  '512x512': '1:1',
  '256x256': '1:1',
  '1536x1024': '3:2',
  '1024x1536': '2:3',
  '1792x1024': '16:9',
  '1024x1792': '9:16',
  '1024x768': '4:3',
  '768x1024': '3:4',
  '1152x768': '3:2',
  '768x1152': '2:3',
  '1792x768': '21:9',
};

function normalizeModelName(value) {
  return toStringValue(value).toLowerCase();
}

function getKnownImageSizeMap(modelId) {
  const model = normalizeModelName(modelId);
  if (!model) return null;
  if (
    model.includes('gpt-image-1.5') ||
    model.includes('gpt-image-1-mini') ||
    model.includes('gpt-image-1') ||
    model.includes('chatgpt-image-latest')
  ) {
    return GPT_IMAGE_SIZE_BY_AR;
  }
  if (model.includes('dall-e-3') || model.includes('dalle-3')) return DALLE_3_SIZE_BY_AR;
  if (model.includes('dall-e-2') || model.includes('dalle-2')) return DALLE_2_SIZE_BY_AR;
  return null;
}

function extractSizeStrings(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(extractSizeStrings);
  const source = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return source.match(/\b(?:\d{3,5}x\d{3,5}|auto)\b/gi) || [];
}

function getMetadataImageSizes(raw) {
  return uniq([
    raw?.image_sizes,
    raw?.supported_sizes,
    raw?.sizes,
    raw?.model_info?.image_sizes,
    raw?.model_info?.supported_sizes,
    raw?.model_info?.sizes,
    raw?.model_info?.output_sizes,
    raw?.litellm_params?.image_sizes,
    raw?.litellm_params?.supported_sizes,
    raw?.litellm_params?.sizes,
  ].flatMap(extractSizeStrings)).filter((size) => size !== 'auto');
}

function sizeListToAspectMap(sizes) {
  return sizes.reduce((map, size) => {
    const normalizedSize = size.toLowerCase();
    const ar = SIZE_TO_AR[normalizedSize];
    if (ar && !map[ar]) map[ar] = normalizedSize;
    return map;
  }, {});
}

function getImageSizeMap(raw, modelId) {
  const metadataMap = sizeListToAspectMap(getMetadataImageSizes(raw));
  if (Object.keys(metadataMap).length > 0) return metadataMap;
  return getKnownImageSizeMap(modelId) || GENERIC_IMAGE_SIZE_BY_AR;
}

function normalizeModel(raw, fallbackId = '') {
  const id = chooseRequestModel(raw, fallbackId);
  if (!id) return null;

  const displayName = firstString(
    raw?.model_name,
    raw?.name,
    raw?.display_name,
    raw?.id,
    fallbackId,
    id,
  );
  const imageSizeByAspectRatio = getImageSizeMap(raw, id);
  const aspectRatios = Object.keys(imageSizeByAspectRatio);

  return {
    id,
    name: displayName,
    endpoint: id,
    aspectRatios,
    imageSizes: aspectRatios.map((ar) => imageSizeByAspectRatio[ar]),
    imageSizeByAspectRatio,
    aliases: uniq([
      raw?.id,
      raw?.model_name,
      raw?.name,
      raw?.display_name,
      raw?.model,
      raw?.model_info?.id,
      raw?.model_info?.base_model,
      raw?.model_info?.model,
      raw?.litellm_params?.model,
      fallbackId,
    ]),
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt' },
      aspect_ratio: {
        type: 'string',
        title: 'Aspect Ratio',
        name: 'aspect_ratio',
        default: aspectRatios[0] || '1:1',
        enum: aspectRatios.length ? aspectRatios : getDefaultAspectRatios(),
      },
    },
  };
}

function dedupeModels(models) {
  const seen = new Set();
  return models.filter((model) => {
    if (!model?.id || seen.has(model.id)) return false;
    seen.add(model.id);
    return true;
  });
}

function findInfoForModel(model, infoModels) {
  const ids = uniq([
    model?.id,
    model?.model_name,
    model?.name,
    model?.model,
    model?.model_info?.id,
    model?.model_info?.base_model,
    model?.litellm_params?.model,
  ]);
  return infoModels.find((info) => {
    const infoIds = uniq([
      info?.id,
      info?.model_name,
      info?.name,
      info?.model,
      info?.model_info?.id,
      info?.model_info?.base_model,
      info?.litellm_params?.model,
    ]);
    return ids.some((id) => infoIds.includes(id));
  });
}

function mergeModelInfo(model, info) {
  return {
    ...(info || {}),
    ...(model || {}),
    model_info: {
      ...(info?.model_info || {}),
      ...(model?.model_info || {}),
    },
    litellm_params: {
      ...(info?.litellm_params || {}),
      ...(model?.litellm_params || {}),
    },
  };
}

async function fetchOptionalModelInfo(url, key) {
  try {
    const response = await fetch(`${url}/model/info`, {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

export function resolveLiteLLMModelId(value, models = [], fallbackValue = '') {
  const candidates = uniq([value, fallbackValue]);
  const match = models.find((model) => {
    const modelCandidates = uniq([model?.id, model?.name, ...(model?.aliases || [])]);
    return candidates.some((candidate) => modelCandidates.includes(candidate));
  });
  return match?.id || toStringValue(value) || toStringValue(fallbackValue);
}

export function getAspectRatiosForLiteLLMModel(model) {
  if (model?.aspectRatios?.length) return model.aspectRatios;
  const map = model?.imageSizeByAspectRatio || getKnownImageSizeMap(model?.id || model) || GENERIC_IMAGE_SIZE_BY_AR;
  return Object.keys(map);
}

function getAspectRatioOrientation(aspectRatio) {
  const [w, h] = String(aspectRatio || '').split(':').map(Number);
  if (!w || !h || w === h) return 'square';
  return w > h ? 'landscape' : 'portrait';
}

function getFallbackAspectRatio(map, aspectRatio) {
  const orientation = getAspectRatioOrientation(aspectRatio);
  const candidates = orientation === 'landscape'
    ? ['3:2', '16:9', '4:3', '21:9', '1:1']
    : orientation === 'portrait'
      ? ['2:3', '9:16', '3:4', '1:1']
      : ['1:1'];
  return candidates.find((candidate) => map[candidate]) || Object.keys(map)[0];
}

export function getSizeForLiteLLMModel(model, aspectRatio) {
  const map = model?.imageSizeByAspectRatio || getKnownImageSizeMap(model?.id || model) || GENERIC_IMAGE_SIZE_BY_AR;
  return map[aspectRatio] || map[getFallbackAspectRatio(map, aspectRatio)] || '1024x1024';
}

export async function fetchLiteLLMModels() {
  const now = Date.now();
  if (_cache && (now - _cacheTime) < 60000) return _cache;

  const { url, key } = getLiteLLMConfig();
  if (!url || !key) return [];

  try {
    const response = await fetch(`${url}/v1/models`, {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('[LiteLLM Models] Failed to fetch:', response.status);
      return _cache || [];
    }

    const data = await response.json();
    const modelData = Array.isArray(data?.data) ? data.data : [];
    const infoModels = await fetchOptionalModelInfo(url, key);
    const normalized = modelData
      .map((model) => normalizeModel(mergeModelInfo(model, findInfoForModel(model, infoModels)), model?.id))
      .filter(Boolean);
    const normalizedIds = new Set(normalized.flatMap((model) => model.aliases));
    const infoOnly = infoModels
      .filter((model) => !normalizedIds.has(model?.model_name) && !normalizedIds.has(model?.id))
      .map((model) => normalizeModel(model, model?.model_name || model?.id))
      .filter(Boolean);
    const models = dedupeModels([...normalized, ...infoOnly]);

    _cache = models;
    _cacheTime = now;
    return models;
  } catch (err) {
    console.warn('[LiteLLM Models] Error:', err.message);
    return _cache || [];
  }
}

export function isLiteLLMProvider() {
  return true;
}

/**
 * Get default aspect ratios (since LiteLLM models don't define their own).
 */
export function getDefaultAspectRatios() {
  return Object.keys(GENERIC_IMAGE_SIZE_BY_AR);
}

/**
 * Get default resolutions (empty — not all models support resolution selection).
 */
export function getDefaultResolutions() {
  return [];
}
