import type {
  CreateConnectionRequest,
  CreateContactRequest,
  CreateMessageRequest,
  DeleteConnectionRequest,
  DeleteContactRequest,
  DeleteMessageRequest,
  MutationResponse,
  UpdateConnectionRequest,
  UpdateContactRequest,
  UpdateMessageRequest,
} from "@sendflow/shared";
import { call } from "./test-helpers.ts";
import type {
  Callable,
  ConnectionDocument,
  FirestoreTrigger,
} from "./types.ts";

process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.GCLOUD_PROJECT ??= "sendflow-dev-prova";

export let db: (typeof import("../firebase.ts"))["db"];
export let createConnection: Callable<CreateConnectionRequest>;
export let deleteConnection: Callable<DeleteConnectionRequest>;
export let syncConnectionNameInContacts: FirestoreTrigger;
export let updateConnection: Callable<UpdateConnectionRequest>;
export let createContact: Callable<CreateContactRequest>;
export let deleteContact: Callable<DeleteContactRequest>;
export let updateContact: Callable<UpdateContactRequest>;
export let createMessage: Callable<CreateMessageRequest>;
export let deleteMessage: Callable<DeleteMessageRequest>;
export let updateMessage: Callable<UpdateMessageRequest>;

export const initializeIntegrationContext = async () => {
  ({ db } = await import("../firebase.ts"));
  ({
    createConnection,
    deleteConnection,
    syncConnectionNameInContacts,
    updateConnection,
  } = await import("../connections.ts"));
  ({ createContact, deleteContact, updateContact } =
    await import("../contacts.ts"));
  ({ createMessage, deleteMessage, updateMessage } =
    await import("../messages.ts"));
};

export const terminateIntegrationContext = async () => {
  await db?.terminate();
};

const DEFAULT_PHONE = "11999999999";
const SCHEDULE_OFFSET_MS = 24 * 60 * 60 * 1_000;

type ContactFixtureOptions = Partial<
  Pick<CreateContactRequest, "name" | "phone">
>;
type MessageFixtureOptions = Partial<
  Pick<CreateMessageRequest, "content" | "scheduledAt" | "status">
>;

export const createConnectionFixture = (
  userId: string,
  name: string,
): Promise<MutationResponse> => call(createConnection, userId, { name });

export const createContactFixture = (
  userId: string,
  connectionId: string,
  options: ContactFixtureOptions = {},
): Promise<MutationResponse> =>
  call(createContact, userId, {
    connectionId,
    name: "Contato de teste",
    phone: DEFAULT_PHONE,
    ...options,
  });

export const createMessageFixture = (
  userId: string,
  connectionId: string,
  contactIds: string[],
  options: MessageFixtureOptions = {},
): Promise<MutationResponse> =>
  call(createMessage, userId, {
    connectionId,
    contactIds,
    content: "Mensagem de teste",
    status: "sent",
    ...options,
  });

export const createFutureDate = () =>
  new Date(Date.now() + SCHEDULE_OFFSET_MS).toISOString();

export const getConnectionDocument = async (
  connectionId: string,
): Promise<ConnectionDocument> => {
  const snapshot = await db.collection("connections").doc(connectionId).get();
  const data = snapshot.data();

  if (!snapshot.exists || !data) {
    throw new Error(`A conexão ${connectionId} não foi encontrada.`);
  }

  return {
    name: data.name,
    userId: data.userId,
  };
};
