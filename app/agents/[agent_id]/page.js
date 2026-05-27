import { cookies } from "next/headers";
import AgentChatClient from "./AgentChatClient";

export async function generateMetadata() {
  return { title: "Agent Chat - Open Generative AI" };
}

function getLiteLLMCredentials(cookieStore) {
  return {
    key: cookieStore.get("litellm_key")?.value ? decodeURIComponent(cookieStore.get("litellm_key").value) : "",
    url: cookieStore.get("litellm_url")?.value ? decodeURIComponent(cookieStore.get("litellm_url").value).replace(/\/+$/, "") : "http://localhost:4000",
  };
}

async function fetchAgentDetails(agentId, credentials) {
  if (!credentials.key) return null;
  const paths = [`/agents/by-slug/${agentId}`];
  if (agentId.length > 20) paths.push(`/agents/${agentId}`);

  for (const path of paths) {
    try {
      const res = await fetch(`${credentials.url}${path}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${credentials.key}` },
      });
      if (res.ok) return await res.json();
    } catch {}
  }
  return null;
}

function buildUserData(credentials) {
  if (!credentials.key) return null;
  return { username: "LiteLLM User", email: null, balance: null };
}

export default async function AgentPage({ params }) {
  const { agent_id } = await params;
  const cookieStore = await cookies();
  const credentials = getLiteLLMCredentials(cookieStore);

  const agentDetails = await fetchAgentDetails(agent_id, credentials);
  const userData = buildUserData(credentials);

  return (
    <AgentChatClient
      agentDetails={agentDetails}
      initialHistory={null}
      userData={userData}
    />
  );
}
