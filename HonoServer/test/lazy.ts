import { Effect } from "effect";

let i = 0

// 如果 bad 被执行了一次，后续不会再执行，直接反馈出结果
const bad = Effect.succeed(i++)

// suspend 传入的是一次性执行的函数，每次调用的时候都会执行
const good = Effect.suspend(() => { 
  console.log(`start:${i}`)
  return Effect.succeed(i++)
})

console.log(Effect.runSync(bad)) // Output: 0
console.log(Effect.runSync(bad)) // Output: 0
console.log(Effect.runSync(bad)) // Output: 0
console.log(Effect.runSync(bad)) // Output: 0

console.log(Effect.runSync(good)) // Output: 1
console.log(Effect.runSync(good)) // Output: 2



// 处理循环依赖的问题
//
//
// 处理递归层数过深的问题
// 
// 传统写法
const blowsUp = (n: number): Effect.Effect<number> =>
  n < 2
    ? Effect.succeed(1)
    : Effect.zipWith(
        blowsUp(n - 1), 
        blowsUp(n - 2), 
        (a, b) => a + b
    )

// console.log(Effect.runSync(blowsUp(32)))
// crash: JavaScript heap out of memory



// suspend 写法
const allGood = (n: number): Effect.Effect<number> =>
  n < 2
    ? Effect.succeed(1)
    : Effect.zipWith(
        Effect.suspend(() => allGood(n - 1)),
        Effect.suspend(() => allGood(n - 2)),
        (a, b) => a + b
    )

console.log(Effect.runSync(allGood(32))) // Output: 3524578
