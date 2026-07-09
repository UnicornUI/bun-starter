import { Effect, pipe } from "effect";


const increment = (x: number) => x + 1
const double = (d: number) => d * 2
const subtractTen = (x: number) => x - 10


const program = pipe(5, increment, double, subtractTen)
console.log(program)

