import type { AppError } from "../errors/types";

function successResponse<T>(data: T) {
  return {
    data,
    success: true as const,
    timestamp: new Date().toISOString(),
  };
}

export function errorResponse(error: AppError) {
  return {
    error: error.toResponse(),
    success: false as const,
    timestamp: new Date().toISOString(),
  };
}

export function createdResponse<T>(data: T) {
  return successResponse(data);
}

