import { Schedule, Effect, FileSystem, Layer } from "effect"
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
  FetchHttpClient,
} from "effect/unstable/http"
import { NodeFileSystem } from "@effect/platform-node"

import { dirname } from "node:path"

const withTransientReadRetry = <E, R>(client: HttpClient.HttpClient.With<E, R>) =>
  client.pipe(
    HttpClient.retryTransient({
      retryOn: "errors-and-responses",
      times: 2,
      schedule: Schedule.exponential("200 millis").pipe(Schedule.jittered),
    }),
  )

const writeWithDirs = Effect.fn("FileSystem.writeWithDirs")(function* (
  fs: FileSystem.FileSystem,
  path: string,
  content: string | Uint8Array,
  mode?: number,
) {
  const write = typeof content === "string"
    ? fs.writeFileString(path, content)
    : fs.writeFile(path, content)

  yield* Effect.suspend(() => write).pipe(
    Effect.catchIf(
      (e) => e.reason._tag === "NotFound",
      () =>
        Effect.gen(function* () {
          yield* fs.makeDirectory(dirname(path), { recursive: true })
          yield* write
        }),
    ),
  )
  if (mode) yield* fs.chmod(path, mode)
})

const download = Effect.fn("Discovery.download")(function* (
  http: HttpClient.HttpClient,
  fs: FileSystem.FileSystem,
  url: string,
  dest: string,
) {
  if (yield* fs.exists(dest).pipe(Effect.orDie)) return true

  return yield* HttpClientRequest.get(url).pipe(
    http.execute,
    Effect.flatMap((res) => res.arrayBuffer),
    Effect.flatMap((body) => writeWithDirs(fs, dest, new Uint8Array(body))),
    Effect.as(true),
    Effect.catchCause((err) =>
      Effect.logError("failed to download", { url, error: err }).pipe(Effect.as(false))
    ),
  )
})

const MainLive = Layer.mergeAll(
  FetchHttpClient.layer,
  NodeFileSystem.layer,
)

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const http = yield* makeHttp
  yield* download(
    http,
    fs,
    "https://github.com/yusukebe/hono/releases/download/v4.12.28/hono-v4.12.28-linux-amd64",
    "hono",
  )
})

const makeMockHttpClient = (
  handler: (req: HttpClientRequest.HttpClientRequest) => Response,
): HttpClient.HttpClient =>
  HttpClient.make((req) =>
    Effect.sync(() => handler(req)).pipe(
      Effect.map((res) => HttpClientResponse.fromWeb(req, res)),
    ),
  )

const makeHttp = Effect.gen(function* () {
  return HttpClient.filterStatusOk(
    withTransientReadRetry(yield* HttpClient.HttpClient),
  )
})

const makeTestFs = (overrides: Partial<FileSystem.FileSystem> = {}) =>
  Layer.succeed(FileSystem.FileSystem, FileSystem.makeNoop(overrides))

const runDownload = (
  url: string,
  dest: string,
  live: Layer.Layer<HttpClient.HttpClient | FileSystem.FileSystem, never, never>,
) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const http = yield* makeHttp
    return yield* download(http, fs, url, dest)
  }).pipe(Effect.provide(live))

declare global {
  type BunJest = {
    describe: (name: string, fn: () => void) => void
    test: (name: string, fn: () => Promise<void> | void) => unknown
    expect: (actual: unknown) => {
      toBe: (expected: unknown) => void
      toEqual: (expected: unknown) => void
    }
  }
  const describe: BunJest["describe"]
  const test: BunJest["test"]
  const expect: BunJest["expect"]
}


function registerTests() {
  describe("download", () => {
    test("writes response body to dest on 200", async () => {
      const written: { path?: string; data?: Uint8Array } = {}

      const live = Layer.mergeAll(
        Layer.succeed(
          HttpClient.HttpClient,
          makeMockHttpClient((req) => {
            expect(req.url).toBe("https://example.com/hono")
            return new Response(new Uint8Array([1, 2, 3, 4]), {
              status: 200,
              headers: { "content-type": "application/octet-stream" },
            })
          }),
        ),
        makeTestFs({
          exists: () => Effect.succeed(false),
          writeFile: (path, data) =>
            Effect.sync(() => {
              written.path = path
              written.data = data
            }),
        }),
      )

      const ok = await Effect.runPromise(
        runDownload("https://example.com/hono", "hono", live),
      )
      expect(ok).toBe(true)
      expect(written.path).toBe("hono")
      expect(Array.from(written.data ?? new Uint8Array())).toEqual([1, 2, 3, 4])
    })

    test("skips download when destination already exists", async () => {
      let httpCalled = false
      let writeCalled = false

      const live = Layer.mergeAll(
        Layer.succeed(
          HttpClient.HttpClient,
          makeMockHttpClient(() => {
            httpCalled = true
            return new Response()
          }),
        ),
        makeTestFs({
          exists: () => Effect.succeed(true),
          writeFile: () => {
            writeCalled = true
            return Effect.void
          },
        }),
      )

      const ok = await Effect.runPromise(
        runDownload("https://example.com/hono", "hono", live),
      )
      expect(ok).toBe(true)
      expect(httpCalled).toBe(false)
      expect(writeCalled).toBe(false)
    })

    test("returns false on 4xx (filterStatusOk + catchCause)", async () => {
      const live = Layer.mergeAll(
        Layer.succeed(
          HttpClient.HttpClient,
          makeMockHttpClient(() =>
            new Response("nope", { status: 404, statusText: "Not Found" }),
          ),
        ),
        makeTestFs({
          exists: () => Effect.succeed(false),
          writeFile: () => Effect.die("writeFile should not be reached on 4xx"),
        }),
      )

      const ok = await Effect.runPromise(
        runDownload("https://example.com/missing", "hono", live),
      )
      expect(ok).toBe(false)
    })
  })
}

if (typeof describe !== "function") {
  Effect.runPromise(program.pipe(Effect.provide(MainLive))).catch(console.error)
} else {
  registerTests()
}
