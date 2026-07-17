import { Effect, pipe } from "effect";

// Replace the value 5 with the contants "new value"
const program = pipe(
  Effect.succeed(1), 
  Effect.as("new value")
)

Effect.runPromise(program).then(console.log)
