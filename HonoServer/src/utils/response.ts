import type { AppErrorType } from "../errors/types";

export function successResponse<T>(data: T) {
  return {
    data,
    success: true as const,
    timestamp: new Date().toISOString(),
  };
}

export function errorResponse(error: AppErrorType) {
  return {
    error: error.toResponse(),
    success: false as const,
    timestamp: new Date().toISOString(),
  };
}

export function toResponse<T>(data: T) {
  return successResponse(data);
}

export function createdResponse<T>(data: T) {
  return successResponse(data);
}

export function deletedResponse() {
  return successResponse({ success: true });
}

export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    _tag: string;
    message: string;
    [key: string]: unknown;
  };
  success: boolean;
  timestamp: string;
}
