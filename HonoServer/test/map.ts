import { Effect, pipe } from "effect"
import {
  fetchTransactionAmount,
  addServiceCharge
} from "./mockApi"


// apply service charg to the transaction amount

// ---- 写法1
const finalAmount1 = pipe(
  fetchTransactionAmount, 
  Effect.map(addServiceCharge)
)

// ---- 写法2
const finalAmount2 = fetchTransactionAmount.pipe(
  Effect.map(addServiceCharge)
)

// ---- 写法3
const finalAmount3 = Effect.map(
  fetchTransactionAmount, 
  addServiceCharge
)

Effect.runPromise(finalAmount1).then(console.log)
Effect.runPromise(finalAmount2).then(console.log)
Effect.runPromise(finalAmount3).then(console.log)
