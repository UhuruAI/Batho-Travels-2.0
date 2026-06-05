import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import {
  buildPlannerPromptContext,
  buildPlannerSystemPrompt,
  createDraftPlannerResult,
  type PlannerGuidedInputs,
  validatePlannerResult
} from "../packages/core/src/planner";

const guidedInputsValidator = v.object({
  destinationIdea: v.optional(v.string()),
  helpMeDecide: v.optional(v.boolean()),
  roughBudgetCents: v.number(),
  travellerGroup: v.union(
    v.literal("solo"),
    v.literal("couple"),
    v.literal("family"),
    v.literal("group")
  ),
  tripType: v.union(
    v.literal("domestic"),
    v.literal("africaRegional"),
    v.literal("longHaulInternational")
  ),
  interests: v.array(v.string()),
  dateFlexibility: v.union(
    v.literal("fixed"),
    v.literal("someFlexibility"),
    v.literal("veryFlexible")
  ),
  preferredPlanMonths: v.optional(v.number())
});

export const startPlannerSession = mutation({
  args: {
    userId: v.id("users"),
    guidedInputs: guidedInputsValidator
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return ctx.db.insert("plannerSessions", {
      userId: args.userId,
      status: "draft",
      guidedInputs: args.guidedInputs,
      messages: [
        {
          role: "system",
          content: "Batho Travels planner session started.",
          createdAt: now
        }
      ],
      createdAt: now,
      updatedAt: now
    });
  }
});

export const getPlannerSession = query({
  args: {
    sessionId: v.id("plannerSessions")
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.sessionId);
  }
});

export const internalGetPlannerSession = internalQuery({
  args: {
    sessionId: v.id("plannerSessions")
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.sessionId);
  }
});

export const appendUserPlannerMessage = mutation({
  args: {
    sessionId: v.id("plannerSessions"),
    content: v.string()
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Planner session not found.");
    }

    await ctx.db.patch(args.sessionId, {
      messages: [
        ...session.messages,
        {
          role: "user",
          content: args.content,
          createdAt: Date.now()
        }
      ],
      updatedAt: Date.now()
    });
  }
});

export const savePlannerAssistantResult = mutation({
  args: {
    sessionId: v.id("plannerSessions"),
    assistantMessage: v.string(),
    structuredResult: v.any(),
    validationErrors: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    return savePlannerResult(ctx, args);
  }
});

export const internalSavePlannerAssistantResult = internalMutation({
  args: {
    sessionId: v.id("plannerSessions"),
    assistantMessage: v.string(),
    structuredResult: v.any(),
    validationErrors: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    return savePlannerResult(ctx, args);
  }
});

export const generatePlannerResult = action({
  args: {
    sessionId: v.id("plannerSessions")
  },
  handler: async (
    ctx,
    args
  ): Promise<{ valid: boolean; validationErrors: string[]; plannerResult: unknown }> => {
    const session: { guidedInputs: PlannerGuidedInputs } | null = await ctx.runQuery(
      internal.planner.internalGetPlannerSession,
      {
      sessionId: args.sessionId
      }
    );

    if (!session) {
      throw new Error("Planner session not found.");
    }

    const guidedInputs: PlannerGuidedInputs = session.guidedInputs;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const systemPrompt = buildPlannerSystemPrompt();
    const promptContext = buildPlannerPromptContext(guidedInputs);

    const plannerResult: unknown = apiKey
      ? await requestClaudePlannerResult(apiKey, systemPrompt, promptContext)
      : createDraftPlannerResult(guidedInputs);

    const validation = validatePlannerResult(plannerResult);
    const validationErrors = validation.valid ? [] : validation.errors;
    const assistantMessage = validation.valid
      ? `I found a realistic ${validation.data.destination.name} plan and a savings handoff you can adjust. Costs are estimates until the trip is fully funded and confirmed.`
      : "I drafted a plan, but it needs adjustment before it can become a savings plan.";

    await ctx.runMutation(internal.planner.internalSavePlannerAssistantResult, {
      sessionId: args.sessionId,
      assistantMessage,
      structuredResult: plannerResult,
      validationErrors
    });

    return {
      valid: validation.valid,
      validationErrors,
      plannerResult
    };
  }
});

async function savePlannerResult(
  ctx: MutationCtx,
  args: {
    sessionId: Id<"plannerSessions">;
    assistantMessage: string;
    structuredResult: unknown;
    validationErrors?: string[];
  }
) {
  const session = await ctx.db.get(args.sessionId);
  if (!session) {
    throw new Error("Planner session not found.");
  }

  const hasErrors = args.validationErrors && args.validationErrors.length > 0;

  await ctx.db.patch(args.sessionId, {
    status: hasErrors ? "draft" : "readyForSavings",
    messages: [
      ...session.messages,
      {
        role: "assistant",
        content: args.assistantMessage,
        createdAt: Date.now()
      }
    ],
    structuredResult: args.structuredResult,
    updatedAt: Date.now()
  });

  return {
    valid: !hasErrors,
    validationErrors: args.validationErrors ?? []
  };
}

async function requestClaudePlannerResult(
  apiKey: string,
  systemPrompt: string,
  promptContext: string
): Promise<unknown> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 1800,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Use this context and return only PlannerResult JSON.\n\n${promptContext}`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude planner request failed with status ${response.status}.`);
  }

  const body = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = body.content?.find((item) => item.type === "text")?.text;

  if (!text) {
    throw new Error("Claude planner response did not include text JSON.");
  }

  return JSON.parse(stripJsonFence(text));
}

function stripJsonFence(text: string): string {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}
