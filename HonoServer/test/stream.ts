import { Stream, Effect } from "effect";


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
//
//
