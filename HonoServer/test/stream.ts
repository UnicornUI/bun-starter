import { Stream, Effect, Schedule, Console, Fiber } from "effect";
import * as fs from "node:fs";

// 
// runSync
// 
try {
  Effect.runSync(Effect.fail("error message"))
} catch(e) {
  console.error(e)
}


//
// runPromise
//
const stream = Stream.make(1, 2, 3, 4, 5);
Effect.runPromise(Stream.runCollect(stream)).then(console.log);

Effect.runPromise(  Math.random() > 0.5 ? Effect.succeed("success") : Effect.fail("error"))
  .then(console.log)
  .catch(console.error);


// 
// runFork (可以运行在后台, 使用 fiber 可以控制流程，阻断后台执行的任务)
//
const fiber = Effect.runFork(Effect.repeat(
  Console.log("loop"),
  Schedule.spaced("200 millis")
))

setTimeout(() => {
  Effect.runFork(Fiber.interrupt(fiber))
}, 5000)


// async

const readFile = Effect.effectify(fs.readFile)
const program = readFile("./package.json", "utf-8");
Effect.runPromise(program).then(console.log)

