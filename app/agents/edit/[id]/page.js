import { cookies } from "next/headers";
import AgentEditClient from "./AgentEditClient";

function buildUserData(cookieStore) {
  const key = cookieStore.get("litellm_key")?.value;
  if (!key) return null;
  return { username: "LiteLLM User", email: null, balance: null };
}

export default async function EditAgentPage() {
  const cookieStore = await cookies();
  return <AgentEditClient userData={buildUserData(cookieStore)} />;
}
