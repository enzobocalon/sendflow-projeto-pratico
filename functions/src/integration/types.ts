import type {
  Change,
  FirestoreEvent,
  QueryDocumentSnapshot,
} from "firebase-functions/v2/firestore";
import type { CallableFunction } from "firebase-functions/v2/https";
import type { MutationResponse } from "../types.ts";

export type Callable<Data> = CallableFunction<Data, Promise<MutationResponse>>;

export type ConnectionDocument = {
  name?: string;
  userId?: string;
};

export type ConnectionUpdateEvent = FirestoreEvent<
  Change<QueryDocumentSnapshot>,
  { connectionId: string }
>;

export type FirestoreTrigger = {
  run(event: ConnectionUpdateEvent): Promise<void>;
};
