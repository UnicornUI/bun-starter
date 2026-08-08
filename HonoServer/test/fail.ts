import { Effect, Random, Result, Option } from "effect";
import { HttpError, ValidationError } from "./mockApi";

const error1 = Effect.fail("error1 message")

// 不关心实际异常类型, 只获取错误信息
const error2 = Effect.fail(new Error("error2 message"))
// 自定义异常类型
const error3 = Effect.fail(new HttpError())


Effect.runPromise(error1).catch(console.error)

// 
Effect.runPromise(error2.pipe(
  Effect.catchCause((cause) => {
    return Effect.fail(cause)
  })
))

// 
Effect.runPromise(error3.pipe(
  // 只处理某个特定的错误
  Effect.catchTag(
    "HttpError", 
    () => Effect.succeed("error handled")
  )
)).then(console.log)


Effect.runPromise(error2.pipe(
  // 选择性处理
  Effect.catchIf(
    (err) => err.name === "HttpError",
    () => Effect.succeed("error handled")
  )
))

// In Effect, if a program can fail with multiple types of errors, 
// they are automatically tracked as a union of those error types. 
// This allows you to know exactly what errors can occur during execution, 
// making error handling more precise and predictable.
//
// Effect automatically keeps track of the possible errors that can occur during the execution of the program as a union:
//
//      ┌─── Effect<string, HttpError | ValidationError, never>
//      ▼
const program = Effect.gen(function* () {
  // Generate two random numbers between 0 and 1
  const n1 = yield* Random.next
  const n2 = yield* Random.next

  // Simulate an HTTP error
  if (n1 < 0.5) {
    return yield* Effect.fail(new HttpError())
  }
  // Simulate a validation error
  if (n2 < 0.5) {
    return yield* Effect.fail(new ValidationError())
  }

  return "some result"
})


// catchtags 可以同时处理多个异常类型，使用 tag 作为 key, value 是处理函数
Effect.runPromise(program.pipe(
  Effect.catchTags({
    ValidationError: (_validationError) => Effect.succeed("handled validation error"),
    HttpError: (_httpError) => Effect.succeed("handled http error")
  })
))


// 2. 使用 Effect.result 来封装 Effect 结果
const result = Effect.gen(function* () {

  const value = yield* Effect.result(program)

  Result.match(value, { 
    onFailure: (error) => console.log(error),
    onSuccess: (value) => console.log(value)
  })
})

// 3. 使用 Effect.option 来封装 Effect 结果
const option = Effect.gen(function* () {

  const value = yield* Effect.option(program)

  Option.match(value, {
    onSome: (v) => console.log(v),
    onNone: () => console.log("none")
  })
})


// 如果出现 defect 的 fatal 错误，则会返回错误，既不是 none 也不是 Some
//
const value = Effect.option(Effect.die(("fatal errro")))
Effect.runPromiseExit(value).then(console.log)
