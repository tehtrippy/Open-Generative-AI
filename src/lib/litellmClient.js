// LiteLLM (OpenAI-compatible) API client.
// Supports image generation, chat completion, and polling via the OpenAI API format.
// LiteLLM proxy provides a unified OpenAI-compatible interface to any backend model.

import { getLiteLLMConfig } from './providers.js';
import { getSizeForLiteLLMModel } from './litellmModels.js';

export class LiteLLMClient {
    constructor() {
        const config = getLiteLLMConfig();
        this.baseUrl = config.url.replace(/\/+$/, '');
        this.apiKey = config.key;
        // Refresh config in case settings changed
        this._refreshConfig = () => {
            const cfg = getLiteLLMConfig();
            this.baseUrl = cfg.url.replace(/\/+$/, '');
            this.apiKey = cfg.key;
        };
    }

    getKey() {
        this._refreshConfig();
        if (!this.apiKey) throw new Error('LiteLLM API Key missing. Please set it in Settings.');
        return this.apiKey;
    }

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getKey()}`,
        };
    }

    /**
     * Generate image(s) via LiteLLM (OpenAI-compatible /v1/images/generations).
     * LiteLLM routes this to whatever backend model you've configured.
     *
     * @param {Object} params
     * @param {string} params.model - Model name as configured in LiteLLM
     * @param {string} params.prompt
     * @param {string} [params.aspect_ratio] - Will be converted to size if possible
     * @param {number} [params.n] - Number of images (default 1)
     * @param {string} [params.quality] - 'standard' or 'hd'
     */
    async generateImage(params) {
        const key = this.getKey();

        const payload = {
            model: params.model,
            prompt: params.prompt,
            n: params.num_images || 1,
            response_format: 'url',
        };

        // Map aspect ratio to size
        if (params.aspect_ratio) {
            payload.size = params.size || this._aspectRatioToSize(params.aspect_ratio, params.model);
        } else if (params.width && params.height) {
            payload.size = `${params.width}x${params.height}`;
        } else {
            payload.size = '1024x1024';
        }

        if (params.quality) {
            payload.quality = params.quality;
        }

        const url = `${this.baseUrl}/v1/images/generations`;

        console.log('[LiteLLM] Image Request:', url);
        console.log('[LiteLLM] Payload:', payload);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('[LiteLLM] API Error:', errText);
                throw new Error(`LiteLLM API Error: ${response.status} - ${errText.slice(0, 200)}`);
            }

            const data = await response.json();
            console.log('[LiteLLM] Response:', data);

            // OpenAI returns: { data: [{ url: '...' }] }
            const imageUrl = data.data?.[0]?.url || data.url || data.output?.url;
            return { ...data, url: imageUrl };

        } catch (error) {
            console.error('LiteLLM Client Error:', error);
            throw error;
        }
    }

    /**
     * Chat completion via LiteLLM.
     */
    async chat(messages, model = 'gpt-4o', options = {}) {
        const payload = {
            model,
            messages,
            ...options,
        };

        const url = `${this.baseUrl}/v1/chat/completions`;

        console.log('[LiteLLM] Chat Request:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`LiteLLM Chat Error: ${response.status} - ${errText.slice(0, 200)}`);
        }

        return await response.json();
    }

    /**
     * Generate video — uses the same submit+ poll pattern but with LiteLLM endpoint.
     * Falls back to /v1/images/generations if no video-specific endpoint is configured.
     */
    async generateVideo(params) {
        const key = this.getKey();

        // LiteLLM doesn't have a standard video generation endpoint like OpenAI.
        // We pass it through a custom route. The user configures LiteLLM to handle
        // the model name routing.
        const payload = {
            model: params.model,
            prompt: params.prompt || '',
            n: 1,
        };

        if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
        if (params.duration) payload.duration = params.duration;
        if (params.resolution) payload.resolution = params.resolution;
        if (params.image_url) payload.image_url = params.image_url;

        const url = `${this.baseUrl}/v1/video/generations`;
        console.log('[LiteLLM] Video Request:', url, payload);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`LiteLLM Video Error: ${response.status} - ${errText.slice(0, 200)}`);
            }

            const submitData = await response.json();
            const requestId = submitData.request_id || submitData.id;
            if (!requestId) return submitData;

            if (params.onRequestId) params.onRequestId(requestId);

            const result = await this._pollForResult(requestId, 900, 2000);
            const videoUrl = result.outputs?.[0] || result.url || result.output?.url;
            return { ...result, url: videoUrl };

        } catch (error) {
            console.error('LiteLLM Video Error:', error);
            throw error;
        }
    }

    /**
     * Image-to-Image via LiteLLM.
     * Uses OpenAI's image edit endpoint if available, or the generations endpoint
     * with image reference (model-specific).
     */
    async generateI2I(params) {
        const key = this.getKey();

        const payload = {
            model: params.model,
            prompt: params.prompt || '',
            image: params.image_url,
            n: 1,
            response_format: 'url',
        };

        if (params.aspect_ratio) {
            payload.size = params.size || this._aspectRatioToSize(params.aspect_ratio, params.model);
        }

        const url = `${this.baseUrl}/v1/images/generations`;
        console.log('[LiteLLM] I2I Request:', url, payload);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`LiteLLM I2I Error: ${response.status} - ${errText.slice(0, 200)}`);
            }

            const submitData = await response.json();
            const requestId = submitData.request_id || submitData.id;
            if (!requestId) return submitData;

            if (params.onRequestId) params.onRequestId(requestId);

            const result = await this._pollForResult(requestId, 60, 2000);
            const imageUrl = result.outputs?.[0] || result.url || result.output?.url;
            return { ...result, url: imageUrl };

        } catch (error) {
            console.error('LiteLLM I2I Error:', error);
            throw error;
        }
    }

    /**
     * Image-to-Video via LiteLLM.
     */
    async generateI2V(params) {
        const payload = {
            model: params.model,
            prompt: params.prompt || '',
            image: params.image_url,
        };

        if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
        if (params.duration) payload.duration = params.duration;

        const url = `${this.baseUrl}/v1/video/generations`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`LiteLLM I2V Error: ${response.status} - ${errText.slice(0, 200)}`);
            }

            const submitData = await response.json();
            const requestId = submitData.request_id || submitData.id;
            if (!requestId) return submitData;

            if (params.onRequestId) params.onRequestId(requestId);

            const result = await this._pollForResult(requestId, 900, 2000);
            const videoUrl = result.outputs?.[0] || result.url || result.output?.url;
            return { ...result, url: videoUrl };

        } catch (error) {
            console.error('LiteLLM I2V Error:', error);
            throw error;
        }
    }

    /**
     * Video-to-Video via LiteLLM.
     */
    async processV2V(params) {
        const payload = {
            model: params.model,
            video: params.video_url,
            prompt: params.prompt || '',
        };

        if (params.image_url) payload.image = params.image_url;

        const url = `${this.baseUrl}/v1/video/generations`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`LiteLLM V2V Error: ${response.status} - ${errText.slice(0, 200)}`);
            }

            const submitData = await response.json();
            const requestId = submitData.request_id || submitData.id;
            if (!requestId) return submitData;

            if (params.onRequestId) params.onRequestId(requestId);

            const result = await this._pollForResult(requestId, 900, 2000);
            const videoUrl = result.outputs?.[0] || result.url || result.output?.url;
            return { ...result, url: videoUrl };

        } catch (error) {
            console.error('LiteLLM V2V Error:', error);
            throw error;
        }
    }

    /**
     * LipSync via LiteLLM.
     */
    async processLipSync(params) {
        const payload = {
            model: params.model,
        };

        if (params.audio_url) payload.audio = params.audio_url;
        if (params.image_url) payload.image = params.image_url;
        if (params.video_url) payload.video = params.video_url;
        if (params.prompt) payload.prompt = params.prompt;
        if (params.resolution) payload.resolution = params.resolution;

        const url = `${this.baseUrl}/v1/video/generations`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`LiteLLM LipSync Error: ${response.status} - ${errText.slice(0, 200)}`);
            }

            const submitData = await response.json();
            const requestId = submitData.request_id || submitData.id;
            if (!requestId) return submitData;

            if (params.onRequestId) params.onRequestId(requestId);

            const result = await this._pollForResult(requestId, 900, 2000);
            const videoUrl = result.outputs?.[0] || result.url || result.output?.url;
            return { ...result, url: videoUrl };

        } catch (error) {
            console.error('LiteLLM LipSync Error:', error);
            throw error;
        }
    }

    async uploadFile(file) {
        this.getKey();
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.baseUrl}/v1/files`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`LiteLLM file upload failed: ${response.status} - ${errText.slice(0, 200)}`);
        }

        const data = await response.json();
        const fileUrl = data.url || data.file_url || data.data?.url || data.data?.file_url;
        if (!fileUrl) {
            throw new Error('LiteLLM gateway did not return a file URL. Expected url or file_url from /v1/files.');
        }
        return fileUrl;
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    _aspectRatioToSize(ar, model) {
        return getSizeForLiteLLMModel(model, ar);
    }

    async _pollForResult(requestId, maxAttempts = 60, interval = 2000) {
        const pollUrl = `${this.baseUrl}/v1/predictions/${requestId}/result`;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, interval));

            console.log(`[LiteLLM] Polling attempt ${attempt}/${maxAttempts}...`);

            try {
                const response = await fetch(pollUrl, {
                    method: 'GET',
                    headers: this.getHeaders(),
                });

                if (!response.ok) {
                    const errText = await response.text();
                    if (response.status >= 500) continue;
                    throw new Error(`Poll Failed: ${response.status} - ${errText.slice(0, 100)}`);
                }

                const data = await response.json();
                const status = data.status?.toLowerCase();

                if (status === 'completed' || status === 'succeeded' || status === 'success') {
                    return data;
                }

                if (status === 'failed' || status === 'error') {
                    throw new Error(`Generation failed: ${data.error || 'Unknown error'}`);
                }
            } catch (error) {
                if (attempt === maxAttempts) throw error;
                console.warn('[LiteLLM] Poll attempt failed, retrying...', error.message);
            }
        }

        throw new Error('Generation timed out after polling.');
    }
}

export const litellm = new LiteLLMClient();
