import { Layer, ManagedRuntime } from "effect";
import { SessionServiceLive } from "../services/session.service";
import { MessageServiceLive } from "../services/message.service";
import { MsgPartServiceLive } from "../services/msg-part.service";
import { DatabaseLive } from "../db/service";

const memoMap = Layer.makeMemoMapUnsafe()

const AppLayer = Layer.mergeAll(
  SessionServiceLive,
  MessageServiceLive,
  MsgPartServiceLive,
).pipe(Layer.provide(DatabaseLive))

export const Runtime = ManagedRuntime.make(AppLayer, { memoMap })
