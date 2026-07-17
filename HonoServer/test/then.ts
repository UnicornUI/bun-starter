import { Effect, pipe, Option, Result } from "effect"

import { 
  applyDiscount,
  fetchTransactionAmount
} from "./mockApi" 


// ⚠️ effect@4.x 中 `Effect.andThen` 回调必须返回 `Effect`；直接返回值会触发
//    `Fiber.runLoop: Not a valid effect: <value>` 错误（v3 没这个限制）。
const finalAmount1 = pipe(
  fetchTransactionAmount,
  Effect.map((amount) => amount * 2),
  Effect.flatMap((amount) => applyDiscount(amount, 5)),
)

const finalAmount2 = pipe(
  fetchTransactionAmount,
  Effect.andThen((amount) => Effect.succeed(amount * 2)),
  Effect.andThen((amount) => applyDiscount(amount, 5)),
)

Effect.runPromise(finalAmount1).then(console.log, console.error)
Effect.runPromise(finalAmount2).then(console.log, console.error)

const fetchNumberValue = Effect.tryPromise(() => Promise.resolve(100))

const result = pipe(
  fetchNumberValue,
  // 同样需要包一层 Effect.succeed，否则 v4 也会把 Option.some(x) 当 effect 跑
  Effect.andThen((x) => Effect.succeed(x > 0 ? Option.some(x) : Option.none())),
)

Effect.runPromise(result).then(
  (x) => {
    // Option 的处理
    // Option.match{x, { onSome: (x) => , onNone: () => }}
    // Option.getOrElse()
    // Option.getOrNull() / Option.getOrUndefined()
    // Option.getOrThrow() / Option.getOrThrowWith()
    // Option.map() / Option.flatMap() / Option.tap()
    Option.match(x, {
      onNone: () => console.log("none"),
      onSome: (x) => console.log(x) 
    })
  },
  console.error
)
