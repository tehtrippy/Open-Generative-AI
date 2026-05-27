'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ImageStudio, VideoStudio, LipSyncStudio, CinemaStudio, MarketingStudio, WorkflowStudio, AgentStudio, AppsStudio } from 'studio';

const DesignAgentStudio = dynamic(() => import('studio').then(mod => mod.DesignAgentStudio), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-black flex items-center justify-center text-white/20">Loading Design Studio...</div>
});
import axios from 'axios';
import ApiKeyModal from './ApiKeyModal';

const TABS = [
  { id: 'image',   label: 'Image Studio' },
  { id: 'video',   label: 'Video Studio' },
  { id: 'lipsync', label: 'Lip Sync' },
  { id: 'cinema',  label: 'Cinema Studio' },
  { id: 'marketing', label: 'Marketing Studio' },
  { id: 'workflows', label: 'Workflows' },
  { id: 'agents', label: 'Agents' },
  { id: 'design-agent', label: 'Design Agent' },
  { id: 'apps', label: 'Explore Apps' },
];

const LITELLM_URL_KEY = 'litellm_url';
const LITELLM_KEY = 'litellm_key';
const PROVIDER_KEY = 'ai_provider';
const BYTEPLUS_KEY = 'byteplus_api_key';
const BYTEPLUS_URL = 'byteplus_base_url';

function lsGet(key) {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}
function lsSet(key, val) {
  if (typeof window === 'undefined') return;
  if (val) localStorage.setItem(key, val);
  else localStorage.removeItem(key);
}

export default function StandaloneShell() {
  const params = useParams();
  const router = useRouter();
  const slug = useMemo(() => params?.slug || [], [params?.slug]);
  const idFromParams = params?.id;
  const tabFromParams = params?.tab;

  const getWorkflowInfo = useCallback(() => {
    if (idFromParams) {
        return { id: idFromParams, tab: tabFromParams || null };
    }
    const wfIndex = slug.findIndex(s => s === 'workflows' || s === 'workflow');
    if (wfIndex === -1) return { id: null, tab: null };
    return {
      id: slug[wfIndex + 1] || null,
      tab: slug[wfIndex + 2] || null
    };
  }, [slug, idFromParams, tabFromParams]);

  const { id: urlWorkflowId } = getWorkflowInfo();

  const getInitialTab = () => {
    if (idFromParams || slug.includes('workflow')) return 'workflows';
    if (slug.includes('agents')) return 'agents';
    if (slug.includes('design-agent')) return 'design-agent';
    if (slug.includes('apps')) return 'apps';
    const firstSegment = slug[0];
    if (firstSegment && TABS.find(t => t.id === firstSegment)) return firstSegment;
    return 'image';
  };
  
  const [apiKey, setApiKey] = useState(null);
  const [litellmUrl, setLiteLLMUrl] = useState('');
  const [litellmKey, setLiteLLMKey] = useState('');
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [showSettings, setShowSettings] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState(null);

  useEffect(() => {
    const info = getWorkflowInfo();
    if (info.id) {
        setActiveTab('workflows');
    } else if (slug.includes('agents')) {
        setActiveTab('agents');
    } else if (slug.includes('design-agent')) {
        setActiveTab('design-agent');
    } else if (slug.includes('apps')) {
        setActiveTab('apps');
    } else {
        const firstSegment = slug[0];
        if (firstSegment && TABS.find(t => t.id === firstSegment)) {
          setActiveTab(firstSegment);
        }
    }
  }, [slug, getWorkflowInfo]);

  const handleTabChange = (tabId) => {
    router.push(`/studio/${tabId}`);
  };

  useEffect(() => {
    const isEditingWorkflow = (activeTab === 'workflows' || !!idFromParams) && urlWorkflowId;
    const isDesignAgent = activeTab === 'design-agent';
    if (isEditingWorkflow || isDesignAgent) {
      setIsHeaderVisible(false);
    } else {
      setIsHeaderVisible(true);
    }
  }, [activeTab, urlWorkflowId, idFromParams]);

  useEffect(() => {
    const fromBuilder = sessionStorage.getItem("fromWorkflowBuilder");
    const fromDesignAgent = sessionStorage.getItem("fromDesignAgent");
    if ((fromBuilder && activeTab !== 'workflows') || (fromDesignAgent && activeTab !== 'design-agent')) {
      sessionStorage.removeItem("fromWorkflowBuilder");
      sessionStorage.removeItem("fromDesignAgent");
      window.location.reload();
    }
  }, [activeTab]);

  // ── Init: load all settings from localStorage ────────────────────
  useEffect(() => {
    setHasMounted(true);
    const storedLiteLLMUrl = lsGet(LITELLM_URL_KEY) || 'http://localhost:4000';
    const storedLiteLLMKey = lsGet(LITELLM_KEY) || '';

    lsSet(PROVIDER_KEY, 'litellm');
    setLiteLLMUrl(storedLiteLLMUrl);
    setLiteLLMKey(storedLiteLLMKey);
    setApiKey(storedLiteLLMKey || null);

    if (storedLiteLLMKey) {
      document.cookie = `litellm_key=${encodeURIComponent(storedLiteLLMKey)}; path=/; max-age=31536000; SameSite=Lax`;
    }
    if (storedLiteLLMUrl) {
      document.cookie = `litellm_url=${encodeURIComponent(storedLiteLLMUrl)}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, []);

  // ── Save handlers ────────────────────────────────────────────────
  const handleKeySave = useCallback((key, litellmUrlVal) => {
    const url = litellmUrlVal || 'http://localhost:4000';
    lsSet(PROVIDER_KEY, 'litellm');
    lsSet(LITELLM_KEY, key);
    lsSet(LITELLM_URL_KEY, url);
    setLiteLLMKey(key);
    setLiteLLMUrl(url);
    setApiKey(key);
    document.cookie = `litellm_key=${encodeURIComponent(key)}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `litellm_url=${encodeURIComponent(url)}; path=/; max-age=31536000; SameSite=Lax`;
  }, []);

  const handleKeyChange = useCallback(() => {
    lsSet(LITELLM_KEY, '');
    setLiteLLMKey('');
    setApiKey(null);
    document.cookie = "litellm_key=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }, []);

  const handleSaveSettings = useCallback(() => {
    const litellmUrlVal = document.getElementById('ss-litellm-url')?.value?.trim() || 'http://localhost:4000';
    const litellmKeyVal = document.getElementById('ss-litellm-key')?.value?.trim();

    lsSet(PROVIDER_KEY, 'litellm');
    lsSet(LITELLM_URL_KEY, litellmUrlVal);
    setLiteLLMUrl(litellmUrlVal);
    document.cookie = `litellm_url=${encodeURIComponent(litellmUrlVal)}; path=/; max-age=31536000; SameSite=Lax`;

    if (litellmKeyVal) {
      lsSet(LITELLM_KEY, litellmKeyVal);
      setLiteLLMKey(litellmKeyVal);
      setApiKey(litellmKeyVal);
      document.cookie = `litellm_key=${encodeURIComponent(litellmKeyVal)}; path=/; max-age=31536000; SameSite=Lax`;
    }

    const byteplusKeyVal = document.getElementById('ss-byteplus-key')?.value?.trim();
    if (byteplusKeyVal) {
      lsSet(BYTEPLUS_KEY, byteplusKeyVal);
    }

    const byteplusUrlVal = document.getElementById('ss-byteplus-url')?.value?.trim();
    if (byteplusUrlVal) {
      lsSet(BYTEPLUS_URL, byteplusUrlVal);
      document.cookie = `byteplus_base_url=${encodeURIComponent(byteplusUrlVal)}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      lsSet(BYTEPLUS_URL, '');
      document.cookie = "byteplus_base_url=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    setShowSettings(false);
  }, []);

  // ── Axios interceptor: inject correct auth header ────────────────
  useEffect(() => {
    delete axios.defaults.headers.common['Authorization'];

    if (!apiKey) return;

    const interceptorId = axios.interceptors.request.use((config) => {
      const isRelative = config.url.startsWith('/') || !config.url.startsWith('http');
      const isInternalProxy = config.url.includes('/api/app') || config.url.includes('/api/workflow') || config.url.includes('/api/agents') || config.url.includes('/api/api') || config.url.includes('/api/v1');

      if (isRelative || isInternalProxy) {
        config.headers['Authorization'] = `Bearer ${apiKey}`;
        if (litellmUrl) {
          config.headers['x-litellm-url'] = litellmUrl;
        }
      }
      return config;
    });

    return () => {
      axios.interceptors.request.eject(interceptorId);
    };
  }, [apiKey, litellmUrl]);

  // ── Drag and Drop ────────────────────────────────────────────────
  const handleDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDragEnter = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) setDroppedFiles(files);
  }, []);
  const handleFilesHandled = useCallback(() => setDroppedFiles(null), []);

  // ── Auth gate ─────────────────────────────────────────────────────
  const hasCredentials = () => {
    return !!(litellmKey && litellmUrl);
  };

  if (!hasMounted) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="animate-spin text-[#22d3ee] text-3xl">◌</div>
    </div>
  );

  if (!hasCredentials()) {
    return <ApiKeyModal onSave={handleKeySave} />;
  }

  return (
    <div 
      className="h-screen bg-[#030303] flex flex-col overflow-hidden text-white relative"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="fixed inset-0 z-[100] bg-[#22d3ee]/10 backdrop-blur-md border-4 border-dashed border-[#22d3ee]/50 flex items-center justify-center pointer-events-none transition-all duration-300">
          <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center gap-4 scale-110 animate-pulse">
            <div className="w-20 h-20 bg-[#22d3ee] rounded-2xl flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-white">Drop your media here</span>
              <span className="text-sm text-white/40">Images, videos, or audio files</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      {isHeaderVisible && (
        <header className="flex-shrink-0 h-14 border-b border-white/[0.03] flex items-center justify-between px-6 bg-black/20 backdrop-blur-md z-40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight hidden sm:block">OpenGenerativeAI</span>
          </div>

          <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative py-4 text-[13px] font-medium transition-all whitespace-nowrap px-1 ${
                  activeTab === tab.id ? 'text-[#22d3ee]' : 'text-white/50 hover:text-white'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#22d3ee] rounded-full" />
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {/* Provider badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-purple-500/10 border-purple-500/30 text-purple-400">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              LITELLM
            </div>

            <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 transition-colors">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white/90">
                  Connected
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(true)}
              title="Settings"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-[13px] font-bold text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Settings</span>
            </button>
          </div>
        </header>
      )}

      {/* Studio Content */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {activeTab === 'image'   && <ImageStudio   apiKey={apiKey} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
        {activeTab === 'video'   && <VideoStudio   apiKey={apiKey} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
        {activeTab === 'lipsync' && <LipSyncStudio apiKey={apiKey} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
        {activeTab === 'cinema'  && <CinemaStudio  apiKey={apiKey} />}
        {activeTab === 'marketing' && <MarketingStudio apiKey={apiKey} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
        {activeTab === 'workflows' && <WorkflowStudio apiKey={apiKey} isHeaderVisible={isHeaderVisible} onToggleHeader={setIsHeaderVisible} />}
        {activeTab === 'agents' && <AgentStudio apiKey={apiKey} isHeaderVisible={isHeaderVisible} onToggleHeader={setIsHeaderVisible} />}
        {activeTab === 'design-agent' && <DesignAgentStudio apiKey={apiKey} isHeaderVisible={isHeaderVisible} onToggleHeader={setIsHeaderVisible} />}
        {activeTab === 'apps' && <AppsStudio apiKey={apiKey} />}
      </div>

      {/* ── Settings Modal ──────────────────────────────────────────── */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-8 w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto">
            <h2 className="text-white font-bold text-lg mb-2">Settings</h2>
            <p className="text-white/40 text-[13px] mb-6">
              Manage your LiteLLM connection.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-purple-400/60 mb-1.5">LiteLLM URL</label>
              <input id="ss-litellm-url" type="text"
                defaultValue={lsGet(LITELLM_URL_KEY) || 'http://localhost:4000'}
                placeholder="http://localhost:4000"
                className="w-full bg-white/5 border border-white/[0.08] rounded-md px-4 py-2.5 text-sm text-white placeholder:text-white/15 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all mb-3"
              />
              <label className="block text-xs font-bold text-purple-400/60 mb-1.5">LiteLLM API Key</label>
              <input id="ss-litellm-key" type="password"
                defaultValue={lsGet(LITELLM_KEY) || ''}
                placeholder="sk-..."
                className="w-full bg-white/5 border border-white/[0.08] rounded-md px-4 py-2.5 text-sm text-white placeholder:text-white/15 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all"
              />
            </div>

            <div className="border-t border-white/5 pt-4 mb-4">
              <label className="block text-xs font-bold text-orange-400/70 mb-1.5">BytePlus Base URL</label>
              <input id="ss-byteplus-url" type="text"
                defaultValue={lsGet(BYTEPLUS_URL) || 'https://ark.ap-southeast.bytepluses.com/api/v3'}
                placeholder="https://ark.ap-southeast.bytepluses.com/api/v3"
                className="w-full bg-white/5 border border-white/[0.08] rounded-md px-4 py-2.5 text-sm text-white placeholder:text-white/15 focus:outline-none focus:ring-1 focus:ring-orange-400/30 transition-all mb-3"
              />
              <label className="block text-xs font-bold text-orange-400/70 mb-1.5">BytePlus API Key (Video Generation)</label>
              <input id="ss-byteplus-key" type="password"
                defaultValue={lsGet(BYTEPLUS_KEY) || ''}
                placeholder="Optional — enables Seedance video models"
                className="w-full bg-white/5 border border-white/[0.08] rounded-md px-4 py-2.5 text-sm text-white placeholder:text-white/15 focus:outline-none focus:ring-1 focus:ring-orange-400/30 transition-all"
              />
              <p className="text-[11px] text-white/25 mt-1">Optional. Enables Seedance models via BytePlus ModelArk.</p>
              {lsGet(BYTEPLUS_KEY) && (
                <button
                  type="button"
                  onClick={() => { lsSet(BYTEPLUS_KEY, ''); document.getElementById('ss-byteplus-key').placeholder = 'Cleared'; document.getElementById('ss-byteplus-key').value = ''; }}
                  className="mt-2 text-[11px] font-semibold text-red-400/70 hover:text-red-400 transition-colors"
                >
                  Clear BytePlus Key
                </button>
              )}
            </div>

            {/* ── Current active key ────────────── */}
            <div className="bg-white/5 border border-white/[0.03] rounded-md p-4 mb-6">
              <label className="block text-xs font-bold text-white/30 mb-2">
                Active Key (LiteLLM)
              </label>
              <div className="text-[13px] font-mono text-white/80">
                {apiKey ? `${apiKey.slice(0, 8)}••••••••••••••••` : 'Not set'}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleKeyChange}
                className="flex-1 h-10 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-all"
              >
                Clear Key
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 h-10 rounded-md bg-white/5 text-white/80 hover:bg-white/10 text-xs font-semibold transition-all border border-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="flex-1 h-10 rounded-md bg-[#22d3ee] text-black font-semibold text-xs hover:bg-[#e5ff33] transition-all"
              >
                Save
              </button>
            </div>

            <p className="text-[11px] text-white/25 mt-4">
              LiteLLM mode uses OpenAI-compatible endpoints. Configure your LiteLLM proxy to route model names and custom app routes.
            </p>
          </div>
        </div>
      )}

      {/* Click-outside to close settings */}
      {showSettings && (
        <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
      )}
      {/* Re-render to move the above overlay behind the modal... actually simpler: modal z-50, this z-40 */}
    </div>
  );
}
