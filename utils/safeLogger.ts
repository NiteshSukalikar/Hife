type LogLevel = "warn" | "error";

const SAFE_ERROR_CODES = new Set([
  "ai/monthly-limit-reached",
  "permission-denied",
  "unauthenticated",
]);

function getSafeErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") return {};

  const maybeError = error as { code?: unknown; name?: unknown };
  const details: Record<string, string> = {};

  if (typeof maybeError.code === "string" && SAFE_ERROR_CODES.has(maybeError.code)) {
    details.code = maybeError.code;
  }

  if (typeof maybeError.name === "string") {
    details.name = maybeError.name;
  }

  return details;
}

function write(level: LogLevel, message: string, error?: unknown) {
  if (!__DEV__) return;

  const details = getSafeErrorDetails(error);
  const logger = level === "warn" ? console.warn : console.error;

  if (Object.keys(details).length > 0) {
    logger(message, details);
    return;
  }

  logger(message);
}

export function logWarning(message: string, error?: unknown) {
  write("warn", message, error);
}

export function logError(message: string, error?: unknown) {
  write("error", message, error);
}
