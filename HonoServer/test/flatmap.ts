import { Effect, pipe } from "effect"
import { 
  applyDiscount, 
  fetchTransactionAmount
} from "./mockApi"

// It similar to `flatmap` used with arrays but works specially with effects instance
// allowing you to avoid deeply nested effects structures.


// chain  multiple effect, ensure each step produce a new effect


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


