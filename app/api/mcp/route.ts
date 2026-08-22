import { createMcpHandler, withMcpAuth } from "mcp-handler";
import type { AuthInfo } from "@modelcontextprotocol/server";

import { getUserByApiToken } from "@/lib/auth";
import { mcpServerOptions, registerRecipeTools } from "@/lib/mcp";

export const runtime = "nodejs";

const handler = createMcpHandler(registerRecipeTools, mcpServerOptions);

/** Same personal API tokens as the REST API (Authorization: Bearer rcp_…). */
const verifyToken = async (
  _req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> => {
  if (!bearerToken) return undefined;
  const user = await getUserByApiToken(bearerToken);
  if (!user) return undefined;
  return { token: bearerToken, clientId: user.id, scopes: [], extra: { user } };
};

const authedHandler = withMcpAuth(handler, verifyToken, { required: true });

export { authedHandler as GET, authedHandler as POST };
