import { Effect } from "effect"

// use Effect.tap when you want to perform a side effect,like logging or tracking, without 
// modifying the main value, It's useful when you want to observe or record an action but 
// want the original value to be passed to the next step.

Effect.tap()
