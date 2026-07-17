import { Effect, pipe } from "effect"


// It similar to `flatmap` used with arrays but works specially with effects instance
// allowing you to avoid deeply nested effects structures.


// chain  multiple effect, ensure each step produce a new effect
//
const applyDiscount = (
  total: number,
  discountRate: number,
) : Effect.Effect<number, Error> => 
  discountRate  == 0 
  ? Effect.fail(new Error("discount rate cannot be zero")) 
  : Effect.succeed(total - (total * discountRate) / 100)


// simulated asynchoronous task to fetch a transaction amount from database
const fetchTransactionAmount = Effect.promise(() => Promise.resolve(100))


// 注意，flatmap 中如果存在某个 effect 与最终计算的结果不相关，
// 它将会被忽略
const program = Effect.flatMap((amount: number) => {
  // this could be ignored
  Effect.sync(() => console.log(`apply discount to ${amount}`))
  return applyDiscount(amount, 5)
})

// chaining the fetch and discount application using flatmap
const finalAmount = pipe(
  fetchTransactionAmount, 
  program
)

// 运行
Effect.runPromise(finalAmount).then(console.log)


