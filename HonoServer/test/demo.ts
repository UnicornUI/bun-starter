import { Console, Effect, pipe } from "effect"
import { 
  fetchTransactionAmount,
  fetchDiscountRate,
  applyDiscount,
  addServiceCharge
} from "./mockApi"



const program = pipe(

  // Combind both fetch effects to get the trasaction amount and discount rate
  Effect.all([fetchTransactionAmount, fetchDiscountRate]),

  // Apply the discount to the transaction amount 
  Effect.andThen(([transactionAmount, discountRate]) => applyDiscount(transactionAmount, discountRate)),

  // Add the service charge to the discount amount
  Effect.andThen(addServiceCharge),

  // Format the final result to display
  Effect.andThen((finalAmount) => Effect.succeed(`Final amount to charge: ${finalAmount}`)),

)

Effect.runPromise(program).then(console.log)
