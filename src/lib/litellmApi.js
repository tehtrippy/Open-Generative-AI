import { litellm } from './litellmClient.js';

class LiteLLMStudioClient {
    getKey() {
        return litellm.getKey();
    }

    generateImage(params) {
        return litellm.generateImage(params);
    }

    pollForResult(requestId, _key, maxAttempts = 60, interval = 2000) {
        return litellm._pollForResult(requestId, maxAttempts, interval);
    }

    generateVideo(params) {
        return litellm.generateVideo(params);
    }

    generateI2I(params) {
        return litellm.generateI2I(params);
    }

    generateI2V(params) {
        return litellm.generateI2V(params);
    }

    uploadFile(file) {
        return litellm.uploadFile(file);
    }

    processV2V(params) {
        return litellm.processV2V(params);
    }

    processLipSync(params) {
        return litellm.processLipSync(params);
    }

    getDimensionsFromAR(ar) {
        return litellm._aspectRatioToSize(ar).split('x').map(Number);
    }
}

export const litellmApi = new LiteLLMStudioClient();
