// LiteLLM-only provider configuration.

const PROVIDER_KEY = 'ai_provider';
const LITELLM_URL_KEY = 'litellm_url';
const LITELLM_KEY_KEY = 'litellm_key';

export const PROVIDERS = {
    LITELLM: 'litellm',
};

export function getProvider() {
    return PROVIDERS.LITELLM;
}

export function setProvider() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PROVIDER_KEY, PROVIDERS.LITELLM);
}

export function getBaseUrl() {
    if (typeof window === 'undefined') return 'http://localhost:4000';
    return localStorage.getItem(LITELLM_URL_KEY) || 'http://localhost:4000';
}

export function getAuthHeaders() {
    const key = typeof window === 'undefined' ? '' : localStorage.getItem(LITELLM_KEY_KEY) || '';
    return { Authorization: `Bearer ${key}` };
}

export function getLiteLLMConfig() {
    if (typeof window === 'undefined') {
        return { url: 'http://localhost:4000', key: '' };
    }

    return {
        url: localStorage.getItem(LITELLM_URL_KEY) || 'http://localhost:4000',
        key: localStorage.getItem(LITELLM_KEY_KEY) || '',
    };
}

export function setLiteLLMConfig(url, key) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PROVIDER_KEY, PROVIDERS.LITELLM);

    if (url !== undefined) {
        const normalizedUrl = (url || 'http://localhost:4000').trim().replace(/\/+$/, '');
        localStorage.setItem(LITELLM_URL_KEY, normalizedUrl || 'http://localhost:4000');
    }

    if (key !== undefined) {
        localStorage.setItem(LITELLM_KEY_KEY, (key || '').trim());
    }
}

export function getKey() {
    return getAuthHeaders().Authorization?.replace('Bearer ', '') || '';
}

export function hasCredentials() {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem(LITELLM_URL_KEY) && localStorage.getItem(LITELLM_KEY_KEY));
}

export function buildUrl(path) {
    const base = getBaseUrl().replace(/\/+$/, '');
    return `${base}/${path.replace(/^\/+/, '')}`;
}
