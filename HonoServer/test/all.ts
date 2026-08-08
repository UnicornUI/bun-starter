import { Console, Effect } from "effect"
 
// Effect.all([effect1, effect2, effect3]) -> return results based on the sequence of input sequence

// simulated to read configuration from a file
const webconfig = Effect.promise(() => {
  return Promise.resolve({ dbhost: "localhsot", port: 3306 })
})


// simulated function to test database connnetion
const checkDatabaseConnectivity = Effect.promise(() => {
  return Promise.resolve("connected to database")
})

// 1. tuple 作为 all 的参数

const setupChecks = Effect.all([webconfig, checkDatabaseConnectivity] as const)

Effect.runPromise(setupChecks).then(([config, dbState ]) => {
  console.log(`Configuration: ${JSON.stringify(config, null , 2)}`)
  console.log(`dbState: ${dbState}`)
})


// 2. Iterable 作为 all 的参数

const list = [1,2,3].map(
  n => Effect.succeed(n * 2).pipe(Effect.tap(Console.log))
)

const iterEffect = Effect.all(list)

Effect.runPromise(iterEffect).then(console.log)


// 3. Struct 作为 all 的参数
//
const struct = {
  age: Effect.succeed(20).pipe(Effect.tap(Console.log)),
  name: Effect.succeed("Alex").pipe(Effect.tap(Console.log))
}

const structEffect = Effect.all(struct)

Effect.runPromise(structEffect).then(console.log)


// 4. mode 控制协程行为，当多个协程在 all 中执行时 
//
//    > 默认的是 short-circuit(短路) 就是碰到第一个失败的，就停止执行，返回失败
//    > 如果 mode 为 result ，那么就会等待所有协程执行完毕，使用Result作为单个协程的结果

const arr = Effect.all([
  Effect.succeed("task1").pipe(Effect.tap(Console.log)),
  Effect.fail("task2 oh no").pipe(Effect.tap(Console.log)),
  Effect.succeed("task3").pipe(Effect.tap(Console.log)),
],
  {
    mode: "default"
  }
)

Effect.runPromise(arr).then(console.log)

