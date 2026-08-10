import { randomUUID } from "node:crypto";
import type { QueryDocumentSnapshot } from "firebase-functions/v2/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import type {
  Callable,
  ConnectionDocument,
  ConnectionUpdateEvent,
} from "./types.ts";
import type { MutationResponse } from "@sendflow/shared";

const createTestId = (prefix: string) => `${prefix}-${randomUUID()}`;

export const createUserId = () => createTestId("test");

export const createMissingId = () => createTestId("missing");

export const createCallableRequest = <Data>(
  data: Data,
  uid?: string,
): CallableRequest<Data> =>
  ({
    auth: uid ? { uid } : undefined,
    data,
  }) as CallableRequest<Data>;

export const call = async <Data>(
  callable: Callable<Data>,
  uid: string,
  data: Data,
): Promise<MutationResponse> => callable.run(createCallableRequest(data, uid));

export const callWithInvalidData = async <Data>(
  callable: Callable<Data>,
  uid: string,
  data: unknown,
): Promise<MutationResponse> =>
  callable.run(createCallableRequest(data as Data, uid));

const createConnectionSnapshot = (
  data: ConnectionDocument,
): QueryDocumentSnapshot =>
  ({
    data: () => data,
  }) as QueryDocumentSnapshot;

export const createConnectionUpdateEvent = (
  before: ConnectionDocument,
  after: ConnectionDocument,
  connectionId: string,
): ConnectionUpdateEvent =>
  ({
    data: {
      after: createConnectionSnapshot(after),
      before: createConnectionSnapshot(before),
    },
    params: { connectionId },
  }) as ConnectionUpdateEvent;
