import { Effect, Console } from "effect"


let state = 0

// 测试程序
const program = Effect.whileLoop({
  while: () => state <= 5,
  step: s =>  { console.log(s); return state++ },
  body: () => Effect.succeed(state),
})

Effect.runPromise(program).then(console.log)


// 如果是简单的 loop 可以直接在 Effect.gen() 中使用普通的循环替代
const work = Effect.gen(function* () {
  let state = 10;
  while(state <= 15) {
    // yield 的运行成本已经足够低
    yield* Console.log(state)
    state++
  }
})

Effect.runPromise(work)

// iterate 功能被 stream 和 whileloop 替代

const result = Effect.forEach(
  [1, 2, 3, 4, 5], 
  (n, index) =>
    Console.log(`Currently at index ${index}`).pipe(Effect.as(n * 2)),
  // 默认不丢弃，可以使用 { discard: true } 丢弃值
)

Effect.runPromise(result).then(console.log)
