import { isAppError, type AppErrorType } from "./types";

const StatusMap: Record<string, number> = {
  SessionNotFoundError: 404,
  SessionValidationError: 400,
  MessageNotFoundError: 404,
  MsgPartNotFoundError: 404,
  ValidationError: 400,
};

export function getStatus(error: AppErrorType | unknown): number {
  if (isAppError(error)) {
    return StatusMap[error._tag] ?? 500;
  }
  if (error && typeof error === "object" && "_tag" in error) {
    return StatusMap[(error as any)._tag] ?? 500;
  }
  return 500;
}

export function extractEffectError(err: unknown): AppErrorType | undefined {
  const cause = (err as any)?.cause;
  if (!cause) return undefined;

  if (cause._tag === "Failure") {
    return cause.error as AppErrorType;
  }

  return undefined;
}

export function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? `${error.name}: ${error.message}`;
  }
  if (typeof error === "object" && error !== null) {
    try {
      return JSON.stringify(error, null, 2);
    } catch {
      return "Unexpected error (unserializable)";
    }
  }
  return String(error);
}

export function isAppErrorByTag(input: unknown, tag: string): boolean {
  return isAppError(input) && input._tag === tag;
}