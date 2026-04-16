import { z } from "zod";

// 错误类定义与创建接口
export abstract class AppError extends Error {

  abstract scheme(): z.core.$ZodType; 
  abstract toResponse(): { name: string, data: any };

  static create<Name extends string, Data extends z.core.$ZodType>(name: Name, data: Data){
    const scheme = z.object({
      name: z.literal(name),
      data
    }).meta({ ref: name });
  
    const result = class extends AppError {
      public static readonly Scheme = scheme;
      public override readonly name: Name = name as Name
      
      constructor(public readonly data: z.input<Data>, errorOpt?: ErrorOptions) {
        super(name, errorOpt)
        this.name = name
      }

      static isInstance(input: any): input is InstanceType<typeof result> {
        return typeof input === "object" && "name" in input && input.name === name
      }
      
      override scheme() {
        return scheme;
      }

      override toResponse(): { name: string; data: any; } {
         return {
           name,
           data: this.data
         }
      }
    }
    Object.defineProperty(result, "name", { value:  name })
    return result;
  }
}

// 具体错误类定义
export const SessionNotFoundError = AppError.create(
  "SessionNotFoundError",
  z.object({
    id: z.number(),
    message: z.string().optional()
  })
);
export type SessionNotFoundError = z.infer<typeof SessionNotFoundError>

export const SessionValidationError = AppError.create(
  "SessionValidationError",
  z.object({
    message: z.string(),
    field: z.string().optional(),
  })
);

export type SessionValidationError = z.infer<typeof SessionValidationError>

export const MessageNotFoundError = AppError.create(
  "MessageNotFoundError",
  z.object({
    id: z.number(),
    message: z.string().optional()
  })
); 

export type MessageNotFoundError = z.infer<typeof MessageNotFoundError>

export const MsgPartNotFoundError = AppError.create(
  "MsgPartNotFoundError",
  z.object({
    id: z.number(),
    message: z.string().optional()
  })
) 

export type MsgPartNotFoundError = z.infer<typeof MsgPartNotFoundError>

export const ValidationError = AppError.create(
  "ValidationError",
  z.object({
    message: z.string(),
    field: z.string().optional()
  })
) 

export type ValidationError = z.infer<typeof ValidationError>
