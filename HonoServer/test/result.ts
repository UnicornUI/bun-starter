import { Result } from "effect"


// Result
//
const parseNumber = (input: string): Result.Result<number, string> => 
  isNaN(parseInt(input)) 
  ? Result.fail("invalide number")
  : Result.succeed(parseInt(input))


Result.match(parseNumber("123"), {
  onFailure: (error) => console.log(error),
  onSuccess: (value) => console.log(value)
})
