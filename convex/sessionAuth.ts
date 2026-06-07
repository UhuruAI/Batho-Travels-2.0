import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

type SessionAuthCtx = QueryCtx | MutationCtx;

export type AuthenticatedUser = {
  session: Doc<"sessions">;
  user: Doc<"users">;
};

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function getAuthenticatedUser(
  ctx: SessionAuthCtx,
  sessionToken: string
): Promise<AuthenticatedUser | null> {
  if (!sessionToken) {
    return null;
  }

  const sessionTokenHash = await sha256Hex(sessionToken);
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (query) => query.eq("sessionTokenHash", sessionTokenHash))
    .first();

  if (!session || session.expiresAt < Date.now()) {
    return null;
  }

  const user = await ctx.db.get(session.userId);
  if (!user) {
    return null;
  }

  return { session, user };
}

export async function requireAuthenticatedUser(
  ctx: SessionAuthCtx,
  sessionToken: string
): Promise<AuthenticatedUser> {
  const authenticated = await getAuthenticatedUser(ctx, sessionToken);
  if (!authenticated) {
    throw new Error("Authentication required.");
  }

  return authenticated;
}
