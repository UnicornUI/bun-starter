import type { Context, ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { AppError } from "../errors/types";
import { errorResponse } from "../utils/response";

export const errorMiddleware: ErrorHandler = async (err: Error, c: Context) => {

  console.error("error: ", { error: err });

  // 1. 直接是 AppError 实例
  if (err instanceof AppError) {
    const status = getStatus(err) as 400 | 404 | 500;
    const response = errorResponse(err);
    return c.json(response, status);
  }

  // 2. HTTPException 直接透传
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  // 3. Zod 验证错误 (hono-openapi/zod-validator)
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

  // 4. Effect 错误 (从 err.cause 提取)
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


function extractEffectError(err: unknown): AppError | undefined {
  const cause = (err as any)?.cause;
  if (!cause) return undefined;

  if (cause._tag === "Failure") {
    return cause.error as AppError;
  }

  return undefined;
}

const StatusMap: Record<string, number> = {
  SessionNotFoundError: 404,
  SessionValidationError: 400,
  MessageNotFoundError: 404,
  MsgPartNotFoundError: 404,
  ValidationError: 400,
};

function getStatus(error: AppError | unknown): number {
  if (error instanceof AppError) {
    return StatusMap[error.name] ?? 500;
  }
  if (error && typeof error === "object" && "name" in error) {
    return StatusMap[(error as any).name] ?? 500;
  }
  return 500;
}

