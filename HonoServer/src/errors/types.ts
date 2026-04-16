// 错误基类接口
export interface AppError {
  readonly name: string;
  readonly data: ErrorData;
  readonly code: string;
  readonly _tag: string;
  toResponse(): ErrorResponseData;
}

export interface ErrorData {
  id?: number;
  message?: string;
  field?: string;
  [key: string]: unknown;
}

export interface ErrorResponseData {
  code: string;
  _tag: string;
  id?: number;
  message: string;
  field?: string;
  [key: string]: unknown;
}

// 基础错误类
abstract class BaseError extends Error implements AppError {
  abstract readonly data: ErrorData;

  constructor(public readonly _tag: string) {
    super();
    this.name = _tag;
  }

  abstract get code(): string;

  toResponse(): ErrorResponseData {
    return {
      code: this.code,
      _tag: this._tag,
      ...this.data,
      message: this.data.message || this.getDefaultMessage(),
    };
  }

  protected abstract getDefaultMessage(): string;
}

// 具体错误类定义
export class SessionNotFoundError extends BaseError {
  constructor(public readonly data: { id: number; message?: string } = { id: 0 }) {
    super("SessionNotFoundError");
  }
  get code() { return "SESSION_NOT_FOUND"; }
  protected getDefaultMessage() { return `Session not found: id=${this.data.id}`; }
}

export class SessionValidationError extends BaseError {
  constructor(public readonly data: { field?: string; message: string }) {
    super("SessionValidationError");
  }
  get code() { return "SESSION_VALIDATION"; }
  protected getDefaultMessage() { return `Validation failed: ${this.data.message}`; }
}

export class MessageNotFoundError extends BaseError {
  constructor(public readonly data: { id: number; message?: string } = { id: 0 }) {
    super("MessageNotFoundError");
  }
  get code() { return "MESSAGE_NOT_FOUND"; }
  protected getDefaultMessage() { return `Message not found: id=${this.data.id}`; }
}

export class MsgPartNotFoundError extends BaseError {
  constructor(public readonly data: { id: number; message?: string } = { id: 0 }) {
    super("MsgPartNotFoundError");
  }
  get code() { return "MSGPART_NOT_FOUND"; }
  protected getDefaultMessage() { return `MsgPart not found: id=${this.data.id}`; }
}

export class ValidationError extends BaseError {
  constructor(public readonly data: { field?: string; message: string }) {
    super("ValidationError");
  }
  get code() { return "VALIDATION"; }
  protected getDefaultMessage() { return `Validation failed: ${this.data.message}`; }
}

// 错误联合类型
export type AppErrorType =
  | SessionNotFoundError
  | SessionValidationError
  | MessageNotFoundError
  | MsgPartNotFoundError
  | ValidationError;

// 类型守卫
export function isAppError(input: unknown): input is AppErrorType {
  if (!input || typeof input !== "object") return false;
  const tags = [
    "SessionNotFoundError",
    "SessionValidationError",
    "MessageNotFoundError",
    "MsgPartNotFoundError",
    "ValidationError",
  ];
  return "_tag" in (input as any) && tags.includes((input as any)._tag);
}

// 工厂函数
export const Errors = {
  sessionNotFound: (id: number, message?: string) => new SessionNotFoundError({ id, message }),
  sessionValidation: (field: string, message: string) => new SessionValidationError({ field, message }),
  messageNotFound: (id: number, message?: string) => new MessageNotFoundError({ id, message }),
  msgPartNotFound: (id: number, message?: string) => new MsgPartNotFoundError({ id, message }),
  validation: (field: string, message: string) => new ValidationError({ field, message }),
} as const;
