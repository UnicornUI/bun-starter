import { Effect } from "effect"

// 
// Effect.fn automatically creates spans. The spans capture information about the function execution, including metadata and error details.
// 
const pan= Effect.fn("mypan")(function* <N extends number>(n: N){

  yield* Effect.annotateCurrentSpan("n", n) // attach metadata to the span

  console.log(`handler: ${n}`)

  yield* Effect.fail(new Error("Boom!")) // simulated fail

})

Effect.runFork(pan(100).pipe(
  Effect.catch(Effect.logError)
))


