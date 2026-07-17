import { Effect } from "effect"
import { set } from "effect/MutableRef"
 
// Effect.all([effect1, effect2, effect3]) -> return results based on the sequence of input sequence

// simulated to read configuration from a file
const webconfig = Effect.promise(() => {
  return Promise.resolve({ dbhost: "localhsot", port: 3306 })
})


// simulated function to test database connnetion
const checkDatabaseConnectivity = Effect.promise(() => {
  return Promise.resolve("connected to database")
})


const setupChecks = Effect.all([webconfig, checkDatabaseConnectivity])

Effect.runPromise(setupChecks).then(([config, dbState ]) => {
  console.log(`Configuration: ${JSON.stringify(config, null , 2)}`)
  console.log(`dbState: ${dbState}`)
})
