import { Effect, Result } from "effect"


// Funtion to apply a disconut safely to a transation amount
export const applyDiscount = (
  total: number,
  discountRate: number,
): Effect.Effect<number, Error> =>
  discountRate === 0
    ? Effect.fail(new Error("discount rate cannot be zero"))
    : Effect.succeed(total - (total * discountRate) / 100)


// simulated asynchoronous task to fetch a transaction amount from database
export const fetchTransactionAmount = Effect.promise(() => Promise.resolve(100))



// Result
//
export const parseNumber = (input: string): Result.Result<number, string> => 
  isNaN(parseInt(input)) 
  ? Result.fail("invalide number")
  : Result.succeed(parseInt(input))
