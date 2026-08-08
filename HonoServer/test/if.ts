
import { Effect, Random } from 'effect'


// Effect.if 被移除，现在直接在 gen 中使用普通的 if 语句
const program = Effect.gen(function*(){
  if (Random.nextBoolean) {
    return Effect.succeed(1)
  }else {
    return Effect.fail("random fail")
  }
})

Effect.runPromise(program).then(console.log)
