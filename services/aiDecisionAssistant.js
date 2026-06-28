import { db } from "@/services/firebase";
import { requireActiveHousehold } from "@/services/households";
import { getMonthKey } from "@/utils/budget";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

const MONTHLY_AI_USAGE_LIMIT = 10;
const AI_ENDPOINT = process.env.EXPO_PUBLIC_HIFE_AI_ENDPOINT;

const VALID_PRIORITIES = new Set(["P0", "P1", "P2", "P3"]);
const VALID_RECOMMENDATIONS = new Set([
  "approve",
  "decline",
  "buy_later",
  "needs_more_info",
]);

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function makeCacheKey(payload) {
  const input = stableStringify(payload);
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return `draft_${hash.toString(36)}`;
}

function buildAiPayload(input) {
  return {
    title: input.title.trim(),
    reason: input.reason.trim(),
    price: Number(input.price || 0),
    budget: Number(input.budget || 0),
    priority: input.priority,
    category: input.category,
    recentSpending: input.recentSpending,
  };
}

function normalizeDecision(decision, source) {
  return {
    suggestedPriority: VALID_PRIORITIES.has(decision?.suggestedPriority)
      ? decision.suggestedPriority
      : "P2",
    recommendation: VALID_RECOMMENDATIONS.has(decision?.recommendation)
      ? decision.recommendation
      : "needs_more_info",
    budgetImpact:
      typeof decision?.budgetImpact === "string" && decision.budgetImpact.trim()
        ? decision.budgetImpact.trim()
        : "Budget impact could not be estimated from the available details.",
    reasoning:
      typeof decision?.reasoning === "string" && decision.reasoning.trim()
        ? decision.reasoning.trim()
        : "Review the request details and confirm the priority before deciding.",
    suggestedMessage:
      typeof decision?.suggestedMessage === "string" &&
      decision.suggestedMessage.trim()
        ? decision.suggestedMessage.trim()
        : "Thanks for sharing this. Let us review the budget and decide together.",
    source,
  };
}

function chooseLocalPriority(payload) {
  const text = `${payload.title} ${payload.reason}`.toLowerCase();
  const price = Number(payload.price || 0);
  const monthlyRemaining = Number(payload.recentSpending?.monthlyRemaining || 0);

  if (/(emergency|urgent|immediate|broken|medical|health|repair)/.test(text)) {
    return price > monthlyRemaining && monthlyRemaining > 0 ? "P1" : "P0";
  }

  if (price > monthlyRemaining && monthlyRemaining > 0) return "P3";
  if (price > Number(payload.budget || 0)) return "P2";
  if (payload.priority === "P0") return "P1";

  return payload.priority || "P2";
}

function buildLocalDecision(payload) {
  const price = Number(payload.price || 0);
  const budget = Number(payload.budget || 0);
  const monthlyRemaining = Number(payload.recentSpending?.monthlyRemaining || 0);
  const categoryRemaining = Number(payload.recentSpending?.categoryRemaining || 0);
  const suggestedPriority = chooseLocalPriority(payload);
  const overMaxBudget = budget > 0 && price > budget;
  const overMonthlyBudget = monthlyRemaining > 0 && price > monthlyRemaining;
  const overCategoryBudget = categoryRemaining > 0 && price > categoryRemaining;

  let recommendation = "approve";
  let suggestedMessage =
    "This looks reasonable within the current budget. I am okay approving it if the product link and price still look right.";

  if (overMaxBudget) {
    recommendation = "needs_more_info";
    suggestedMessage =
      "Can we find an option closer to the max budget or explain why this one is worth the extra amount?";
  } else if (overMonthlyBudget || overCategoryBudget) {
    recommendation = suggestedPriority === "P0" ? "buy_later" : "buy_later";
    suggestedMessage =
      "This seems useful, but it may be better to buy later so we do not stretch this month's budget.";
  } else if (suggestedPriority === "P3" && price > 0) {
    recommendation = "buy_later";
    suggestedMessage =
      "This is a nice-to-have purchase. I suggest we keep it for later unless there is a stronger need right now.";
  }

  const pressure = [];
  if (overMaxBudget) pressure.push("above the max budget");
  if (overMonthlyBudget) pressure.push("above the monthly remaining budget");
  if (overCategoryBudget) pressure.push(`above the ${payload.category} category balance`);

  return normalizeDecision(
    {
      suggestedPriority,
      recommendation,
      budgetImpact:
        pressure.length > 0
          ? `This request is ${pressure.join(" and ")}.`
          : `This request appears to fit the available monthly and ${payload.category} budget context.`,
      reasoning:
        overMaxBudget || overMonthlyBudget || overCategoryBudget
          ? "The price creates budget pressure, so postponing or asking for a cheaper option is safer."
          : "The reason, priority, and available budget do not show a major spending risk.",
      suggestedMessage,
    },
    "local_assistant"
  );
}

async function getConfiguredAiDecision(payload) {
  if (!AI_ENDPOINT) return null;

  const response = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("AI service could not generate a recommendation");
  }

  return normalizeDecision(await response.json(), "configured_ai");
}

async function assertUsageAvailable(householdId, monthKey) {
  const usageRef = doc(db, "households", householdId, "aiUsage", monthKey);
  const usageSnapshot = await getDoc(usageRef);
  const currentCount = Number(usageSnapshot.data()?.count || 0);

  if (currentCount >= MONTHLY_AI_USAGE_LIMIT) {
    const error = new Error(
      `Monthly AI limit reached (${MONTHLY_AI_USAGE_LIMIT} recommendations).`
    );
    error.code = "ai/monthly-limit-reached";
    throw error;
  }

  return { usageRef, nextCount: currentCount + 1 };
}

export async function getAiDecisionForDraft(input) {
  const household = await requireActiveHousehold();
  const monthKey = getMonthKey();
  const payload = buildAiPayload(input);
  const cacheKey = makeCacheKey(payload);
  const cacheRef = doc(db, "households", household.id, "aiDecisionCache", cacheKey);
  const cachedSnapshot = await getDoc(cacheRef);

  if (cachedSnapshot.exists()) {
    return {
      ...normalizeDecision(cachedSnapshot.data().result, "cache"),
      fromCache: true,
      source: "cache",
    };
  }

  const { usageRef, nextCount } = await assertUsageAvailable(
    household.id,
    monthKey
  );
  const decision =
    (await getConfiguredAiDecision(payload)) || buildLocalDecision(payload);

  await setDoc(cacheRef, {
    householdId: household.id,
    monthKey,
    payload,
    result: decision,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(
    usageRef,
    {
      count: nextCount,
      limit: MONTHLY_AI_USAGE_LIMIT,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return {
    ...decision,
    fromCache: false,
  };
}

export { MONTHLY_AI_USAGE_LIMIT };
