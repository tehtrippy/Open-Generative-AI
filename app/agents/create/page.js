import { cookies } from "next/headers";
import AgentCreateClient from "./AgentCreateClient";

function buildUserData(cookieStore) {
  const key = cookieStore.get("litellm_key")?.value;
  if (!key) return null;
  return { username: "LiteLLM User", email: null, balance: null };
}

export default async function CreateAgentPage() {
  const cookieStore = await cookies();
  return <AgentCreateClient userData={buildUserData(cookieStore)} />;
}
