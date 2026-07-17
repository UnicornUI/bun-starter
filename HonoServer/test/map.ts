import { Effect, pipe } from "effect"

// Function to add a small service charg to transation amount
const addServiceCharg = (amount: number)  => amount + 1

// Simulated asynchoronous task to fetch a transaction amount from database
const fetchTransactionAmount = Effect.promise(() => Promise.resolve(100))

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
