import { Effect  } from "effect"



// 1. zip()
const task1 = Effect.succeed(1).pipe(
  Effect.delay("200 millis"),
  Effect.tap(Effect.log("task1 done"))
)

const task2 = Effect.succeed("hello").pipe(
  Effect.delay("100 millis"),
  Effect.tap(Effect.log("task2 done"))
)

// 默认是顺序执行，如果需要并行，则使用 concurrent 参数进行修改
// const program = Effect.zip(task1, task2)
const program = Effect.zip(task1, task2, { concurrent: true })

// 
Effect.runPromise(program).then(console.log)



// 2. zipWith()
const programwith = Effect.zipWith(
  task1, 
  task2,
  (n, i) => n + "-" + i,
  { concurrent: true }
)

// 
Effect.runPromise(programwith).then(console.log)


