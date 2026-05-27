'use client';

import { useState } from 'react';

function lsGet(key) {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(key) || '';
}

const BYTEPLUS_KEY = 'byteplus_api_key';
const BYTEPLUS_URL = 'byteplus_base_url';

export default function ApiKeyModal({ onSave, onClose, overlay = false, title, subtitle }) {
  const [key, setKey] = useState('');
  const [litellmUrl, setLiteLLMUrl] = useState(lsGet('litellm_url') || 'http://localhost:4000');
  const [byteplusUrl, setByteplusUrl] = useState(lsGet(BYTEPLUS_URL) || 'https://ark.ap-southeast.bytepluses.com/api/v3');
  const [byteplusKey, setByteplusKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) { setError('Please enter your API key'); return; }
    if (!litellmUrl.trim()) { setError('Please enter your LiteLLM URL'); return; }
    if (byteplusKey.trim()) {
      localStorage.setItem(BYTEPLUS_KEY, byteplusKey.trim());
    }
    if (byteplusUrl.trim()) {
      localStorage.setItem(BYTEPLUS_URL, byteplusUrl.trim());
    }
    onSave(trimmed, litellmUrl.trim());
  };

  const wrapperClass = overlay
    ? 'fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 font-inter animate-fade-in-up'
    : 'min-h-screen bg-[#030303] flex items-center justify-center px-4 font-inter';

  return (
    <div className={wrapperClass}>
      <div className="w-full max-w-sm bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-xl p-10 shadow-2xl relative">
        {overlay && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 w-8 h-8 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-14 h-14 bg-purple-500/10 border-purple-500/20 rounded-2xl flex items-center justify-center border mb-6 group transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5" className="group-hover:scale-110 transition-transform">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L12 17.25l-4.5-4.5L15.5 7.5z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mb-2">
            {title || 'Open Generative AI'}
          </h1>
          <p className="text-white/40 text-[13px] leading-relaxed px-4">
            {subtitle || <>Connect to your LiteLLM proxy to use your own models</>}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-purple-400/70 ml-1">
              LiteLLM Proxy URL
            </label>
            <input
              type="text"
              value={litellmUrl}
              onChange={(e) => setLiteLLMUrl(e.target.value)}
              placeholder="http://localhost:4000"
              className="w-full bg-white/5 border border-white/[0.03] rounded-md px-5 py-3 text-sm text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:bg-white/[0.07] transition-all"
              suppressHydrationWarning
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold ml-1 text-purple-400/70">
              LiteLLM API Key
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => { setKey(e.target.value); setError(''); }}
              placeholder="sk-..."
              className="w-full bg-white/5 border border-white/[0.03] rounded-md px-5 py-3 text-sm text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-[#22d3ee]/30 focus:bg-white/[0.07] transition-all"
              suppressHydrationWarning
            />
            {error && <p className="mt-2 text-red-500/80 text-[11px] font-medium ml-1">{error}</p>}
          </div>

          <div className="border-t border-white/5 pt-4 space-y-2">
            <label className="block text-xs font-bold text-orange-400/70 ml-1">
              BytePlus Base URL
            </label>
            <input
              type="text"
              value={byteplusUrl}
              onChange={(e) => setByteplusUrl(e.target.value)}
              placeholder="https://ark.ap-southeast.bytepluses.com/api/v3"
              className="w-full bg-white/5 border border-white/[0.03] rounded-md px-5 py-3 text-sm text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-orange-400/30 focus:bg-white/[0.07] transition-all"
              suppressHydrationWarning
            />
            <label className="block text-xs font-bold text-orange-400/70 ml-1 mt-3">
              BytePlus API Key (Video Generation)
            </label>
            <input
              type="password"
              value={byteplusKey}
              onChange={(e) => setByteplusKey(e.target.value)}
              placeholder={lsGet(BYTEPLUS_KEY) ? '••••••••' : 'Optional — enables Seedance video models'}
              className="w-full bg-white/5 border border-white/[0.03] rounded-md px-5 py-3 text-sm text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-orange-400/30 focus:bg-white/[0.07] transition-all"
              suppressHydrationWarning
            />
            <p className="text-[11px] text-white/20 ml-1">Optional. Enables Seedance models via BytePlus ModelArk.</p>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-500 text-black font-medium py-2.5 rounded-md hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
            suppressHydrationWarning
          >
            Connect
          </button>

          <p className="text-center text-[12px] text-white/20 pt-2">
            Running <a href="https://docs.litellm.ai" target="_blank" rel="noreferrer" className="text-white/40 hover:text-purple-400 transition-colors font-medium">LiteLLM</a>? Point to your proxy URL →
          </p>
        </form>
      </div>
    </div>
  );
}
