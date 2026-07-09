import { Console, Effect } from "effect"

  // 
  // 1.let explore a practical program that preferms a series of data transformations commonly found in application logic
  //

{
  // Function to add a small service charge to a transaction amount
  const addServiceCharge = (amount: number) => amount + 1


  // Funtion to apply a disconut safely to a transation amount
  const applyDiscount = (total: number, discountRate: number) => 
    discountRate === 0 
    ? Effect.fail(new Error("discount rate cannot be zero")) 
    : Effect.succeed(total - (total * discountRate) / 100) 


  //Simulated asynchoronous task to fetch a transaction amount from a database
  const fetchTransactionAmonut = Effect.promise(()=> Promise.resolve(1000))


  // Simulated asynchoronous task to fetch a discount rate from a configuration file
  const fetchDiscountRate = Effect.promise(() => Promise.resolve(5))


  // Assmebling the program using a generator function 
  const program = Effect.gen(function* (){

    // retrieve the transation amount
    const transactionAmount = yield* fetchTransactionAmonut

    // retrieve the discount rate
    const discountRate = yield* fetchDiscountRate

    // calculate the discount amount 
    const discountAmount = yield* applyDiscount(transactionAmount, discountRate)


    // apply service charge
    const finalAmount = addServiceCharge(discountAmount)

    // return the total amount and log the result

    return `Final amount to charge: ${finalAmount}`

  }) 

  // Running the program
  Effect.runPromise(program).then(console.log)
} 

// 2. error handling
{
  const task1 = Console.log("task1...")
  const task2 = Console.log("task2...")

  const program = Effect.gen(function* () {
    // Perform some tasks
    yield* task1

    // When working with Effect.gen, it is important to understand how it handles errors. 
    // This API will stop execution at the first error it encounters and return that error.
    // Introduce an error
    yield* Effect.fail("Something went wrong!")

    // 将不会执行，因为前面已经出错
    yield* task2
  })

  Effect.runPromise(program).then(console.log, console.error)
}

// 3. return 短路操作

type User = {
  readonly name: string
}

// Imagine this function checks a database or an external service
declare function getUserById(id: string): Effect.Effect<User | undefined>

function greetUser(id: string) {
  return Effect.gen(function* () {
    const user = yield* getUserById(id)
    if (user === undefined) {

      // Even though we fail here ,Typescript still thinks 
      // `user` might be undefined later
      //
      // yield* Effect.fail(`User with id : ${id} not found`)
      // ------------------------------------------------------
      // 如果显示地 return 了，则下方 user 就一定不是 undefined
      return yield* Effect.fail(`User with id : ${id} not found`)
    }
    // 这里 User 还是有 undefined 可能性
    return `Hello, ${user.name}`
  })
}

// 4. this 传递

{
  class Olass {
    readonly local = 1
    compute = Effect.gen({ self: this }, function* () {
      const n = this.local + 1

      yield* Effect.log(`computed value: ${n}`)

      return n
    })
  }

  Effect.runPromise(new Olass().compute).then(console.log)
}

