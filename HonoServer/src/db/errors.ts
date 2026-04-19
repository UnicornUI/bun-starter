import { AppError } from "../errors/types";
import { z } from "zod";

export const DatabaseConnectionError = AppError.create(
  "DatabaseConnectionError",
  z.object({
    message: z.string(),
  })
);

export const DatabaseQueryError = AppError.create(
  "DatabaseQueryError",
  z.object({
    message: z.string(),
    query: z.string().optional(),
  })
);

export const DatabaseTransactionError = AppError.create(
  "DatabaseTransactionError",
  z.object({
    message: z.string(),
  })
);

export type DatabaseConnectionError = z.infer<typeof DatabaseConnectionError>;
export type DatabaseQueryError = z.infer<typeof DatabaseQueryError>;
export type DatabaseTransactionError = z.infer<typeof DatabaseTransactionError>;