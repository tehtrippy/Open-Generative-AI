import { setLiteLLMConfig, getLiteLLMConfig, setProvider } from '../lib/providers.js';
import { getBytePlusApiKey, setBytePlusApiKey, clearBytePlusApiKey, getBytePlusKeyMasked } from '../lib/byteplus.js';

export function SettingsModal(onClose) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:100;overflow-y:auto;';

    const modal = document.createElement('div');
    modal.style.cssText = 'background:var(--bg-card,#111);border-radius:1rem;border:1px solid rgba(255,255,255,0.08);width:min(90vw,34rem);max-height:85vh;display:flex;flex-direction:column;overflow:hidden;';

    const cfg = getLiteLLMConfig();
    const bpKeyMasked = getBytePlusKeyMasked();

    modal.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;">
            <h2 style="font-size:1rem;font-weight:800;color:#fff;margin:0;">Settings</h2>
            <button id="settings-close-btn" style="color:rgba(255,255,255,0.4);background:none;border:none;cursor:pointer;padding:4px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
        </div>
        <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem;overflow-y:auto;">
            <div>
                <label style="display:block;font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:0.4rem;font-weight:600;">
                    LiteLLM Proxy URL
                </label>
                <input id="settings-litellm-url" type="text"
                    style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:0.75rem;padding:0.6rem 0.9rem;color:#fff;font-size:0.875rem;outline:none;"
                    placeholder="http://localhost:4000"
                    value="${cfg.url || ''}">
            </div>
            <div>
                <label style="display:block;font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:0.4rem;font-weight:600;">
                    LiteLLM API Key
                </label>
                <input id="settings-litellm-key" type="password"
                    style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:0.75rem;padding:0.6rem 0.9rem;color:#fff;font-size:0.875rem;outline:none;"
                    placeholder="sk-..."
                    value="${cfg.key || ''}">
            </div>

            <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:1rem;margin-top:0.5rem;">
                <label style="display:block;font-size:0.75rem;color:rgba(255,165,0,0.7);margin-bottom:0.4rem;font-weight:600;">
                    BytePlus API Key (Video Generation)
                </label>
                <input id="settings-byteplus-key" type="password"
                    style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:0.75rem;padding:0.6rem 0.9rem;color:#fff;font-size:0.875rem;outline:none;"
                    placeholder="${bpKeyMasked || 'Optional — enables Seedance video models'}">
                <button id="settings-clear-bp-btn" style="margin-top:0.4rem;padding:0.3rem 0.7rem;border-radius:0.4rem;background:none;border:1px solid rgba(255,100,100,0.2);color:rgba(255,100,100,0.6);font-size:0.65rem;font-weight:700;cursor:pointer;">
                    Clear BytePlus Key
                </button>
            </div>

            <p style="font-size:0.7rem;color:rgba(255,255,255,0.35);margin:0;">
                All credentials are stored locally in this browser. LiteLLM keys are sent to your proxy. BytePlus keys are sent directly to BytePlus ModelArk.
            </p>
            <div style="display:flex;justify-content:flex-end;gap:0.5rem;margin-top:0.5rem;">
                <button id="settings-cancel-btn" style="padding:0.5rem 1rem;border-radius:0.5rem;background:none;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);font-size:0.75rem;font-weight:700;cursor:pointer;">Cancel</button>
                <button id="settings-save-btn" style="padding:0.5rem 1rem;border-radius:0.5rem;background:var(--color-primary,#22d3ee);color:#000;font-size:0.75rem;font-weight:700;cursor:pointer;border:none;">Save</button>
            </div>
        </div>
    `;

    const close = () => {
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
        if (onClose) onClose();
    };

    modal.querySelector('#settings-cancel-btn').onclick = close;
    modal.querySelector('#settings-close-btn').onclick = close;
    modal.querySelector('#settings-clear-bp-btn').onclick = () => {
        clearBytePlusApiKey();
        modal.querySelector('#settings-byteplus-key').value = '';
        modal.querySelector('#settings-clear-bp-btn').textContent = 'Cleared';
        setTimeout(() => { modal.querySelector('#settings-clear-bp-btn').textContent = 'Clear BytePlus Key'; }, 1500);
    };
    modal.querySelector('#settings-save-btn').onclick = () => {
        const url = modal.querySelector('#settings-litellm-url').value.trim();
        const key = modal.querySelector('#settings-litellm-key').value.trim();
        setProvider();
        setLiteLLMConfig(url, key);
        // Save BytePlus key if provided
        const bpKey = modal.querySelector('#settings-byteplus-key').value.trim();
        if (bpKey) setBytePlusApiKey(bpKey);
        close();
    };

    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    overlay.appendChild(modal);
    return overlay;
}
