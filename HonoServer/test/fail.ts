import { Effect, Data } from "effect";


const error1 = Effect.fail("error1 message")
const error2 = Effect.fail(new Error("error2 message"))


class HttpError extends Data.TaggedError("httpError") {}

const error3 = Effect.fail(new HttpError())


Effect.runPromise(error1).catch(console.error)


// 
Effect.runPromise(error3.pipe(
  // 只处理某个特定的错误
  Effect.catchTag(
    "httpError", 
    () => Effect.succeed("error handled")
  )
)).then(console.log)
