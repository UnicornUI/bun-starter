import { Effect, pipe } from "effect"
import {
  fetchTransactionAmount
} from "./mockApi"

// Function to add a small service charg to transation amount
const addServiceCharg = (amount: number)  => amount + 1

// apply service charg to the transaction amount

// ---- 写法1
const finalAmount1 = pipe(
  fetchTransactionAmount, 
  Effect.map(addServiceCharg)
)

// ---- 写法2
const finalAmount2 = fetchTransactionAmount.pipe(
  Effect.map(addServiceCharg)
)

// ---- 写法3
const finalAmount3 = Effect.map(
  fetchTransactionAmount, 
  addServiceCharg
)

Effect.runPromise(finalAmount1).then(console.log)
Effect.runPromise(finalAmount2).then(console.log)
Effect.runPromise(finalAmount3).then(console.log)
