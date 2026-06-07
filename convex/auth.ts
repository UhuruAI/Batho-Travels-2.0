import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { sha256Hex } from "./sessionAuth";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeName(name: string | undefined): string | undefined {
  const normalized = name?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
}

function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256Hex(`${salt}:${password}`);
}

function assertPassword(password: string) {
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
}

async function createSession(
  ctx: MutationCtx,
  userId: Id<"users">,
  deviceLabel: string | undefined
) {
  const token = randomHex(32);
  const sessionTokenHash = await sha256Hex(token);
  const now = Date.now();
  const expiresAt = now + THIRTY_DAYS_MS;

  await ctx.db.insert("sessions", {
    userId,
    sessionTokenHash,
    expiresAt,
    deviceLabel,
    createdAt: now
  });

  return { token, expiresAt };
}

export const signUpWithEmail = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
    deviceLabel: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    assertPassword(args.password);

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (query) => query.eq("email", email))
      .first();

    if (existingUser?.passwordHash) {
      throw new Error("An account already exists for this email.");
    }

    const now = Date.now();
    const passwordSalt = randomHex(16);
    const passwordHash = await hashPassword(args.password, passwordSalt);
    const userId =
      existingUser?._id ??
      (await ctx.db.insert("users", {
        email,
        name: normalizeName(args.name),
        passwordHash,
        passwordSalt,
        kycTier: "basic",
        notificationChannels: ["email", "inApp"],
        createdAt: now,
        updatedAt: now
      }));

    if (existingUser && !existingUser.passwordHash) {
      await ctx.db.patch(existingUser._id, {
        name: normalizeName(args.name) ?? existingUser.name,
        passwordHash,
        passwordSalt,
        updatedAt: now
      });
    }

    return {
      user: { id: userId, email, name: normalizeName(args.name) ?? existingUser?.name }
    };
  }
});

export const signInWithEmail = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    deviceLabel: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (query) => query.eq("email", email))
      .first();

    if (!user?.passwordHash || !user.passwordSalt) {
      throw new Error("Invalid email or password.");
    }

    const submittedHash = await hashPassword(args.password, user.passwordSalt);
    if (submittedHash !== user.passwordHash) {
      throw new Error("Invalid email or password.");
    }

    const session = await createSession(ctx, user._id, args.deviceLabel);
    return { ...session, user: { id: user._id, email: user.email, name: user.name } };
  }
});

export const getEmailSession = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    if (!args.sessionToken) return null;
    const sessionTokenHash = await sha256Hex(args.sessionToken);
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (query) => query.eq("sessionTokenHash", sessionTokenHash))
      .first();

    if (!session || session.expiresAt < Date.now()) return null;

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    return {
      tokenExpiresAt: session.expiresAt,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        kycTier: user.kycTier,
        notificationChannels: user.notificationChannels
      }
    };
  }
});

export const signOutEmailSession = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    if (!args.sessionToken) return null;
    const sessionTokenHash = await sha256Hex(args.sessionToken);
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (query) => query.eq("sessionTokenHash", sessionTokenHash))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
    return null;
  }
});

export const createEmailSession = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    sessionTokenHash: v.string(),
    deviceLabel: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const email = normalizeEmail(args.email);
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (query) => query.eq("email", email))
      .first();

    const userId =
      existingUser?._id ??
      (await ctx.db.insert("users", {
        email,
        name: normalizeName(args.name),
        kycTier: "basic",
        notificationChannels: ["email", "inApp"],
        createdAt: now,
        updatedAt: now
      }));

    await ctx.db.insert("sessions", {
      userId,
      sessionTokenHash: args.sessionTokenHash,
      expiresAt: now + THIRTY_DAYS_MS,
      deviceLabel: args.deviceLabel,
      createdAt: now
    });

    return { userId };
  }
});
