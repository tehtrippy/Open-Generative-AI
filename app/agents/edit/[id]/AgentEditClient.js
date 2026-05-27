"use client";

import { EditAgentPage } from "ai-agent";
import "ai-agent/dist/tailwind.css";
import { useCallback, useEffect, useRef } from "react";
import axios from "axios";

const STORAGE_KEY = "litellm_key";
const URL_STORAGE_KEY = "litellm_url";

export default function AgentEditClient({ userData }) {
  const interceptorRef = useRef(null);

  useEffect(() => {
    const getKey = () => {
      if (typeof window === "undefined") return null;
      const fromStorage = localStorage.getItem(STORAGE_KEY);
      if (fromStorage) return fromStorage;
      const match = document.cookie.match(/litellm_key=([^;]+)/);
      return match ? decodeURIComponent(match[1]) : null;
    };
    const getLiteLLMUrl = () => {
      const fromStorage = localStorage.getItem(URL_STORAGE_KEY);
      if (fromStorage) return fromStorage;
      const match = document.cookie.match(/litellm_url=([^;]+)/);
      return match ? decodeURIComponent(match[1]) : "http://localhost:4000";
    };

    const apiKey = getKey();
    if (!apiKey) return;
    const litellmUrl = getLiteLLMUrl();

    interceptorRef.current = axios.interceptors.request.use((config) => {
      const isRelative = config.url.startsWith("/") || !config.url.startsWith("http");
      const isInternalProxy = config.url.includes('/api/app') || config.url.includes('/api/workflow') || config.url.includes('/api/agents') || config.url.includes('/api/api') || config.url.includes('/api/v1');
      
      if (isRelative || isInternalProxy) {
        config.headers["Authorization"] = `Bearer ${apiKey}`;
        config.headers["x-litellm-url"] = litellmUrl;
      }
      return config;
    });

    return () => {
      if (interceptorRef.current !== null) {
        axios.interceptors.request.eject(interceptorRef.current);
      }
    };
  }, []);

  const useUser = useCallback(
    () => ({
      user: {
        username: userData?.email?.split("@")[0] || "Studio User",
        name: userData?.email?.split("@")[0] || "Studio User",
        email: userData?.email || null,
        profile_photo: null,
        balance: userData?.balance ?? null,
      },
      isAuthorized: !!userData,
    }),
    [userData]
  );

  return (
    <EditAgentPage
      useUser={useUser}
      usedIn="studio"
    />
  );
}
