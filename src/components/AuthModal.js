import { setLiteLLMConfig, setProvider } from '../lib/providers.js';
import { getBytePlusApiKey, setBytePlusApiKey, getBytePlusKeyMasked } from '../lib/byteplus.js';

export function AuthModal(onSuccess) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-6';

    const modal = document.createElement('div');
    modal.className = 'w-full max-w-md bg-panel-bg border border-white/10 rounded-3xl p-8 shadow-3xl animate-fade-in-up';

    const existingBpKey = getBytePlusKeyMasked();

    modal.innerHTML = `
        <div class="flex flex-col items-center text-center mb-8">
            <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-glow mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2">
                    <path d="M12 3v18M3 12h18"/><path d="M5 5l14 14M19 5L5 19"/>
                </svg>
            </div>
            <h2 class="text-2xl font-black text-white uppercase tracking-wider mb-2">API Credentials Required</h2>
            <p class="text-secondary text-sm">Enter your LiteLLM proxy URL and API key to start generating. Optionally add a BytePlus key for direct video generation.</p>
        </div>

        <div class="space-y-5">
            <div class="space-y-2">
                <label class="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">LiteLLM Proxy URL</label>
                <input
                    type="text"
                    id="litellm-url-input"
                    placeholder="http://localhost:4000"
                    class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                >
            </div>
            <div class="space-y-2">
                <label class="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">LiteLLM API Key</label>
                <input
                    type="password"
                    id="litellm-key-input"
                    placeholder="sk-..."
                    class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                >
                <p class="text-[11px] text-muted ml-1">The key is stored locally and sent only to your LiteLLM proxy.</p>
            </div>

            <div class="border-t border-white/5 pt-4 mt-4">
                <label class="text-[10px] font-bold text-orange-400/80 uppercase tracking-widest ml-1">BytePlus API Key (Video Generation)</label>
                <input
                    type="password"
                    id="byteplus-key-input"
                    placeholder="${existingBpKey || 'Optional — for direct Seedance video generation'}"
                    class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-muted focus:outline-none focus:border-orange-400/50 transition-colors shadow-inner mt-2"
                >
                <p class="text-[11px] text-muted ml-1 mt-1">Optional. Enables Seedance models via BytePlus ModelArk. Stored locally.</p>
            </div>

            <button id="save-key-btn" class="w-full bg-primary text-black font-black py-4 rounded-2xl hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all">
                Initialize Studio
            </button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const urlInput = modal.querySelector('#litellm-url-input');
    const keyInput = modal.querySelector('#litellm-key-input');
    const bpKeyInput = modal.querySelector('#byteplus-key-input');
    const btn = modal.querySelector('#save-key-btn');

    urlInput.value = localStorage.getItem('litellm_url') || 'http://localhost:4000';

    btn.onclick = () => {
        const url = urlInput.value.trim();
        const key = keyInput.value.trim();
        if (url && key) {
            setProvider();
            setLiteLLMConfig(url, key);
            // Save BytePlus key if provided
            const bpKey = bpKeyInput.value.trim();
            if (bpKey) setBytePlusApiKey(bpKey);
            document.body.removeChild(overlay);
            if (onSuccess) onSuccess();
        } else {
            [urlInput, keyInput].forEach((input) => input.classList.add('border-red-500/50'));
            setTimeout(() => [urlInput, keyInput].forEach((input) => input.classList.remove('border-red-500/50')), 2000);
        }
    };

    return overlay;
}
