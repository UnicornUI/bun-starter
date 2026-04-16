import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { isAppError } from "./types";
import { errorResponse } from "../utils/response";
import { getStatus, extractEffectError } from "./format";

export const errorMiddleware = async (err: Error, c: Context) => {
  // 1. HTTPException 直接透传
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  // 2. Zod 验证错误 (hono-openapi/zod-validator)
  const zodErrors = extractZodErrors(err);
  if (zodErrors.length > 0) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          _tag: "ZodValidationError",
          message: "Request validation failed",
          details: zodErrors,
        },
        success: false,
        timestamp: new Date().toISOString(),
      },
      400 as const
    );
  }

  // 3. Effect 错误 (从 err.cause 提取)
  const effectError = extractEffectError(err);
  if (effectError) {
    const status = getStatus(effectError) as 400 | 404 | 500;
    const response = errorResponse(effectError);
    console.error("[Effect Error]", {
      ...response,
      path: c.req.path,
      method: c.req.method,
    });
    return c.json(response, status);
  }

  // 4. 直接是 AppError 实例
  if (isAppError(err)) {
    const status = getStatus(err) as 400 | 404 | 500;
    const response = errorResponse(err);
    return c.json(response, status);
  }

  // 5. 未知错误
  console.error("[Error]", {
    message: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
  });

  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        _tag: "UnknownError",
        message: err.message || "Internal Server Error",
      },
      success: false,
      timestamp: new Date().toISOString(),
    },
    500 as const
  );
};

function extractZodErrors(err: Error): Array<{ path: string; message: string }> {
  const message = err.message;
  if (!message || (!message.includes("Zod") && !message.includes("validation") && !message.includes("Invalid"))) {
    return [];
  }

  try {
    if (message.includes('"code":') || message.includes('"path":')) {
      const match = message.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) {
          return parsed.map((e: unknown) => ({
            path: Array.isArray((e as Record<string, unknown>).path) 
              ? ((e as Record<string, unknown>).path as string[]).join(".") 
              : String((e as Record<string, unknown>).path || "unknown"),
            message: String((e as Record<string, unknown>).message || (e as Record<string, unknown>).code || "Validation failed"),
          }));
        }
      }
    }
  } catch {
    // fallback
  }

  return [];
}
