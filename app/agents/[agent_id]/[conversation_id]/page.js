import { cookies } from "next/headers";
import AgentChatClient from "../AgentChatClient";

export async function generateMetadata() {
  return { title: "Agent Chat - Open Generative AI" };
}

function getLiteLLMCredentials(cookieStore) {
  return {
    key: cookieStore.get("litellm_key")?.value ? decodeURIComponent(cookieStore.get("litellm_key").value) : "",
    url: cookieStore.get("litellm_url")?.value ? decodeURIComponent(cookieStore.get("litellm_url").value).replace(/\/+$/, "") : "http://localhost:4000",
  };
}

async function fetchJson(credentials, path) {
  if (!credentials.key) return null;
  try {
    const res = await fetch(`${credentials.url}${path}`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${credentials.key}` },
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

async function fetchAgentDetails(agentId, credentials) {
  return (
    await fetchJson(credentials, `/agents/by-slug/${agentId}`) ||
    (agentId.length > 20 ? await fetchJson(credentials, `/agents/${agentId}`) : null)
  );
}

async function fetchHistory(agentId, conversationId, credentials) {
  return (
    await fetchJson(credentials, `/agents/by-slug/${agentId}/${conversationId}`) ||
    (agentId.length > 20 ? await fetchJson(credentials, `/agents/${agentId}/${conversationId}`) : null)
  );
}

function buildUserData(credentials) {
  if (!credentials.key) return null;
  return { username: "LiteLLM User", email: null, balance: null };
}

export default async function AgentConversationPage({ params }) {
  const { agent_id, conversation_id } = await params;
  const cookieStore = await cookies();
  const credentials = getLiteLLMCredentials(cookieStore);

  const [agentDetails, initialHistory] = await Promise.all([
    fetchAgentDetails(agent_id, credentials),
    fetchHistory(agent_id, conversation_id, credentials),
  ]);

  return (
    <AgentChatClient
      agentDetails={agentDetails}
      initialHistory={initialHistory}
      userData={buildUserData(credentials)}
    />
  );
}
