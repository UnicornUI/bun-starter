import { Result } from "effect"
import { parseNumber } from "./mockApi"


Result.match(parseNumber("123"), {
  onFailure: (error) => console.log(error),
  onSuccess: (value) => console.log(value)
})
