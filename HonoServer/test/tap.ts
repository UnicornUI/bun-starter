import { Effect, pipe, Console } from "effect"
import {
  applyDiscount,
  fetchTransactionAmount
} from "./mockApi"

// use Effect.tap when you want to perform a side effect,like logging or tracking, without 
// modifying the main value, It's useful when you want to observe or record an action but 
// want the original value to be passed to the next step.

const program = pipe(
  fetchTransactionAmount,
  // log the transaction amount but without alter the value
  Effect.tap((amount) => Console.log(`Apply an discount to: ${amount}.`)),
  // amount is still awailable, (not effect by Effect.tap)
  Effect.flatMap((amount) => applyDiscount(amount, 5)),
)

Effect.runPromise(program).then(console.log)
