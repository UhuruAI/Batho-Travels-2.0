import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function expected() {
  const email = process.env.ADMIN_EMAIL ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!email || !password) {
    throw new Error(
      "Admin credentials not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD via `npx convex env set`."
    );
  }
  return { email: email.toLowerCase(), password };
}

export const signIn = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const credentials = expected();
    const submittedEmail = args.email.trim().toLowerCase();

    if (submittedEmail !== credentials.email || args.password !== credentials.password) {
      throw new Error("Invalid email or password.");
    }

    const token = randomToken();
    const tokenHash = await sha256Hex(token);
    const now = Date.now();

    await ctx.db.insert("adminSessions", {
      email: credentials.email,
      tokenHash,
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS
    });

    return { token, email: credentials.email, expiresAt: now + SESSION_TTL_MS };
  }
});

export const getSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!args.token) return null;
    const tokenHash = await sha256Hex(args.token);
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("tokenHash", tokenHash))
      .first();
    if (!session) return null;
    if (session.expiresAt < Date.now()) return null;
    return { email: session.email, expiresAt: session.expiresAt };
  }
});

export const signOut = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!args.token) return null;
    const tokenHash = await sha256Hex(args.token);
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("tokenHash", tokenHash))
      .first();
    if (session) {
      await ctx.db.delete(session._id);
    }
    return null;
  }
});

export const purgeExpiredSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("adminSessions")
      .withIndex("by_expiry", (q) => q.lt("expiresAt", now))
      .collect();
    await Promise.all(expired.map((s) => ctx.db.delete(s._id)));
    return { deleted: expired.length };
  }
});
