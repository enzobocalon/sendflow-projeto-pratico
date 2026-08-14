import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  MAX_CONNECTIONS_PER_USER,
  MAX_MESSAGE_CONTACTS,
  MESSAGE_CONTENT_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PHONE_MAX_LENGTH,
} from "@sendflow/shared";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  setLogLevel,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const PROJECT_ID = "sendflow-dev-prova";
const OWNER_ID = "rules-owner";
const OTHER_USER_ID = "rules-other-user";
const CONNECTION_ID = "connection-1";
const CONTACT_ID = "contact-1";
const MESSAGE_ID = "message-1";
const NOW = Timestamp.fromMillis(Date.now());
const FUTURE = Timestamp.fromMillis(NOW.toMillis() + 24 * 60 * 60 * 1_000);

let testEnvironment: RulesTestEnvironment;

const assertDenied = async (operation: Promise<unknown>) => {
  setLogLevel("silent");

  try {
    await assertFails(operation);
  } finally {
    setLogLevel("error");
  }
};

const connectionData = (overrides: Record<string, unknown> = {}) => ({
  archivedAt: null,
  createdAt: NOW,
  name: "Conexão principal",
  nameNormalized: "conexão principal",
  status: "active",
  updatedAt: NOW,
  userId: OWNER_ID,
  ...overrides,
});

const contactData = (overrides: Record<string, unknown> = {}) => ({
  connectionId: CONNECTION_ID,
  createdAt: NOW,
  name: "Contato principal",
  nameNormalized: "contato principal",
  phone: "11999999999",
  updatedAt: NOW,
  userId: OWNER_ID,
  ...overrides,
});

const messageData = (overrides: Record<string, unknown> = {}) => ({
  connectionId: CONNECTION_ID,
  contactIds: [CONTACT_ID],
  content: "Mensagem de teste",
  createdAt: NOW,
  recipientsCount: 1,
  scheduledAt: FUTURE,
  sentAt: null,
  status: "scheduled",
  updatedAt: NOW,
  userId: OWNER_ID,
  ...overrides,
});

const usageData = (overrides: Record<string, unknown> = {}) => ({
  connectionsCount: 1,
  contactsCount: 1,
  createdAt: NOW,
  messagesCount: 1,
  scheduledMessagesCount: 1,
  updatedAt: NOW,
  userId: OWNER_ID,
  ...overrides,
});

const createConnectionData = (overrides: Record<string, unknown> = {}) => ({
  ...connectionData(),
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
});

const createContactData = (overrides: Record<string, unknown> = {}) => ({
  ...contactData(),
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
});

const createMessageData = (
  status: "scheduled" | "sent",
  overrides: Record<string, unknown> = {},
) => ({
  ...messageData(),
  createdAt: serverTimestamp(),
  scheduledAt: status === "scheduled" ? FUTURE : null,
  sentAt: status === "sent" ? serverTimestamp() : null,
  status,
  updatedAt: serverTimestamp(),
  ...overrides,
});

const ownerFirestore = () =>
  testEnvironment.authenticatedContext(OWNER_ID).firestore();

const otherUserFirestore = () =>
  testEnvironment.authenticatedContext(OTHER_USER_ID).firestore();

const seedDocuments = () =>
  testEnvironment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();

    await Promise.all([
      setDoc(doc(firestore, "connections", CONNECTION_ID), connectionData()),
      setDoc(doc(firestore, "contacts", CONTACT_ID), contactData()),
      setDoc(doc(firestore, "messages", MESSAGE_ID), messageData()),
      setDoc(doc(firestore, "usage", OWNER_ID), usageData()),
    ]);
  });

beforeAll(async () => {
  testEnvironment = await initializeTestEnvironment({
    firestore: {
      rules: readFileSync(resolve(process.cwd(), "../firestore.rules"), "utf8"),
    },
    projectId: PROJECT_ID,
  });
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
  await seedDocuments();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe("Firestore read rules", () => {
  it("allows users to read and aggregate their own resources", async () => {
    const firestore = ownerFirestore();

    await Promise.all([
      assertSucceeds(getDoc(doc(firestore, "connections", CONNECTION_ID))),
      assertSucceeds(getDoc(doc(firestore, "contacts", CONTACT_ID))),
      assertSucceeds(getDoc(doc(firestore, "messages", MESSAGE_ID))),
      assertSucceeds(getDoc(doc(firestore, "usage", OWNER_ID))),
      assertSucceeds(
        getCountFromServer(
          query(
            collection(firestore, "messages"),
            where("userId", "==", OWNER_ID),
          ),
        ),
      ),
      assertSucceeds(
        getDocs(
          query(
            collection(firestore, "messages"),
            where("userId", "==", OWNER_ID),
            where("status", "==", "scheduled"),
          ),
        ),
      ),
    ]);
  });

  it("rejects unauthenticated, foreign and unconstrained reads", async () => {
    const unauthenticated = testEnvironment
      .unauthenticatedContext()
      .firestore();

    await assertDenied(
      getDoc(doc(unauthenticated, "connections", CONNECTION_ID)),
    );
    await assertDenied(
      getDoc(doc(otherUserFirestore(), "contacts", CONTACT_ID)),
    );
    await assertDenied(getDocs(collection(ownerFirestore(), "messages")));
  });

  it("updates the usage listener after an external write", async () => {
    const usageRef = doc(ownerFirestore(), "usage", OWNER_ID);
    let rejectInitialSnapshot!: (reason?: unknown) => void;
    let rejectUpdatedSnapshot!: (reason?: unknown) => void;
    let resolveInitialSnapshot!: () => void;
    let resolveUpdatedSnapshot!: () => void;
    const initialSnapshot = new Promise<void>((resolve, reject) => {
      rejectInitialSnapshot = reject;
      resolveInitialSnapshot = resolve;
    });
    const updatedSnapshot = new Promise<void>((resolve, reject) => {
      rejectUpdatedSnapshot = reject;
      resolveUpdatedSnapshot = resolve;
    });
    const unsubscribe = onSnapshot(
      usageRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.metadata.fromCache) return;
        if (snapshot.data()?.scheduledMessagesCount === 1) {
          resolveInitialSnapshot();
        }
        if (snapshot.data()?.scheduledMessagesCount === 0) {
          resolveUpdatedSnapshot();
        }
      },
      (error) => {
        rejectInitialSnapshot(error);
        rejectUpdatedSnapshot(error);
      },
    );

    try {
      await initialSnapshot;
      await testEnvironment.withSecurityRulesDisabled((context) =>
        updateDoc(doc(context.firestore(), "usage", OWNER_ID), {
          scheduledMessagesCount: 0,
          updatedAt: NOW,
        }),
      );
      await updatedSnapshot;
    } finally {
      unsubscribe();
    }
  });
});

describe("Connection rules", () => {
  it("allows a valid connection lifecycle through archive", async () => {
    const firestore = ownerFirestore();
    const connectionRef = doc(firestore, "connections", "new-connection");

    await assertSucceeds(setDoc(connectionRef, createConnectionData()));
    await assertSucceeds(
      updateDoc(connectionRef, {
        name: "Nome atualizado",
        nameNormalized: "nome atualizado",
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      updateDoc(connectionRef, {
        archivedAt: serverTimestamp(),
        status: "archived",
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      updateDoc(connectionRef, {
        archivedAt: null,
        status: "active",
        updatedAt: serverTimestamp(),
      }),
    );
    await assertDenied(deleteDoc(connectionRef));
  });

  it("rejects invalid ownership, fields, names and timestamps", async () => {
    const firestore = ownerFirestore();

    await assertDenied(
      setDoc(
        doc(firestore, "connections", "foreign"),
        createConnectionData({ userId: OTHER_USER_ID }),
      ),
    );
    await assertDenied(
      setDoc(
        doc(firestore, "connections", "short-name"),
        createConnectionData({ name: "A", nameNormalized: "a" }),
      ),
    );
    await assertDenied(
      setDoc(
        doc(firestore, "connections", "blank-name"),
        createConnectionData({ name: "  ", nameNormalized: "  " }),
      ),
    );
    await assertDenied(
      setDoc(
        doc(firestore, "connections", "long-name"),
        createConnectionData({
          name: "A".repeat(NAME_MAX_LENGTH + 1),
          nameNormalized: "a".repeat(NAME_MAX_LENGTH + 1),
        }),
      ),
    );
    await assertDenied(
      setDoc(
        doc(firestore, "connections", "extra-field"),
        createConnectionData({ admin: true }),
      ),
    );
    await assertDenied(
      setDoc(doc(firestore, "connections", "client-time"), connectionData()),
    );
  });
});

describe("Contact rules", () => {
  const createContact = (
    firestore: ReturnType<typeof ownerFirestore>,
    id: string,
    overrides: Record<string, unknown> = {},
  ) => setDoc(doc(firestore, "contacts", id), createContactData(overrides));

  it("allows valid Brazilian and international contacts", async () => {
    const firestore = ownerFirestore();

    await assertSucceeds(createContact(firestore, "brazilian"));
    await assertSucceeds(
      createContact(firestore, "international", {
        phone: "+442079460958",
      }),
    );
  });

  it("allows owners to update and delete contacts", async () => {
    const firestore = ownerFirestore();
    const contactRef = doc(firestore, "contacts", CONTACT_ID);

    await assertSucceeds(
      updateDoc(contactRef, {
        name: "Contato atualizado",
        nameNormalized: "contato atualizado",
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(deleteDoc(contactRef));
  });

  it("rejects foreign, archived and invalid connection references", async () => {
    const firestore = ownerFirestore();

    await assertDenied(
      createContact(firestore, "foreign-owner", { userId: OTHER_USER_ID }),
    );
    await assertDenied(
      createContact(firestore, "missing-connection", {
        connectionId: "missing",
      }),
    );

    await testEnvironment.withSecurityRulesDisabled((context) =>
      setDoc(
        doc(context.firestore(), "connections", "archived"),
        connectionData({ archivedAt: NOW, status: "archived" }),
      ),
    );
    await assertDenied(
      createContact(firestore, "archived-connection", {
        connectionId: "archived",
      }),
    );
  });

  it("rejects invalid phone models and unexpected fields", async () => {
    const firestore = ownerFirestore();

    await assertDenied(
      createContact(firestore, "short-phone", { phone: "123456789" }),
    );
    await assertDenied(
      createContact(firestore, "long-phone", {
        phone: `+${"1".repeat(PHONE_MAX_LENGTH + 1)}`,
      }),
    );
    await assertDenied(
      createContact(firestore, "ambiguous-phone", {
        phone: "5511999999999",
      }),
    );
    await assertDenied(
      createContact(firestore, "denormalized-name", {
        connectionName: "Não permitido",
      }),
    );
  });
});

describe("Message rules", () => {
  const createMessage = (
    firestore: ReturnType<typeof ownerFirestore>,
    id: string,
    status: "scheduled" | "sent" = "scheduled",
    overrides: Record<string, unknown> = {},
  ) =>
    setDoc(
      doc(firestore, "messages", id),
      createMessageData(status, overrides),
    );

  it("allows valid scheduled and immediately sent messages", async () => {
    const firestore = ownerFirestore();

    await assertSucceeds(createMessage(firestore, "scheduled"));
    await assertSucceeds(createMessage(firestore, "sent", "sent"));
  });

  it("allows editing scheduled messages, sending them and deleting messages", async () => {
    const firestore = ownerFirestore();
    const messageRef = doc(firestore, "messages", MESSAGE_ID);

    await assertSucceeds(
      updateDoc(messageRef, {
        content: "Conteúdo atualizado",
        scheduledAt: Timestamp.fromMillis(FUTURE.toMillis() + 60_000),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      updateDoc(messageRef, {
        scheduledAt: null,
        sentAt: serverTimestamp(),
        status: "sent",
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(deleteDoc(messageRef));
  });

  it("rejects edits to sent messages", async () => {
    await testEnvironment.withSecurityRulesDisabled((context) =>
      setDoc(
        doc(context.firestore(), "messages", "sent-message"),
        messageData({ scheduledAt: null, sentAt: NOW, status: "sent" }),
      ),
    );

    await assertDenied(
      updateDoc(doc(ownerFirestore(), "messages", "sent-message"), {
        content: "Tentativa de edição",
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("rejects invalid content, contacts and schedules", async () => {
    const firestore = ownerFirestore();

    await assertDenied(
      createMessage(firestore, "short-content", "scheduled", {
        content: "A",
      }),
    );
    await assertDenied(
      createMessage(firestore, "blank-content", "scheduled", {
        content: "  ",
      }),
    );
    await assertDenied(
      createMessage(firestore, "long-content", "scheduled", {
        content: "A".repeat(MESSAGE_CONTENT_MAX_LENGTH + 1),
      }),
    );
    await assertDenied(
      createMessage(firestore, "empty-contacts", "scheduled", {
        contactIds: [],
        recipientsCount: 0,
      }),
    );
    await assertDenied(
      createMessage(firestore, "duplicate-contacts", "scheduled", {
        contactIds: [CONTACT_ID, CONTACT_ID],
        recipientsCount: 2,
      }),
    );
    await assertDenied(
      createMessage(firestore, "too-many-contacts", "scheduled", {
        contactIds: Array.from(
          { length: MAX_MESSAGE_CONTACTS + 1 },
          (_, index) => `contact-${index}`,
        ),
        recipientsCount: MAX_MESSAGE_CONTACTS + 1,
      }),
    );
    await assertDenied(
      createMessage(firestore, "past-schedule", "scheduled", {
        scheduledAt: Timestamp.fromMillis(1),
      }),
    );
  });

  it("rejects foreign owners, connections and server-controlled timestamps", async () => {
    const firestore = ownerFirestore();

    await assertDenied(
      createMessage(firestore, "foreign-owner", "scheduled", {
        userId: OTHER_USER_ID,
      }),
    );
    await assertDenied(
      createMessage(firestore, "missing-connection", "scheduled", {
        connectionId: "missing",
      }),
    );
    await assertDenied(
      createMessage(firestore, "fake-sent-at", "sent", { sentAt: NOW }),
    );
  });
});

describe("Usage rules", () => {
  it("allows owners to create and update valid usage counters", async () => {
    const newOwnerId = "new-usage-owner";
    const newOwnerFirestore = testEnvironment
      .authenticatedContext(newOwnerId)
      .firestore();
    const newUsageRef = doc(newOwnerFirestore, "usage", newOwnerId);

    await assertSucceeds(
      setDoc(
        newUsageRef,
        usageData({
          connectionsCount: 0,
          contactsCount: 0,
          createdAt: serverTimestamp(),
          messagesCount: 1,
          scheduledMessagesCount: 1,
          updatedAt: serverTimestamp(),
          userId: newOwnerId,
        }),
      ),
    );

    const usageRef = doc(ownerFirestore(), "usage", OWNER_ID);
    await assertSucceeds(
      updateDoc(usageRef, {
        scheduledMessagesCount: 0,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("rejects connection counters above the per-user limit", async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), "usage", OWNER_ID), {
        connectionsCount: MAX_CONNECTIONS_PER_USER - 1,
      });
    });

    const usageRef = doc(ownerFirestore(), "usage", OWNER_ID);

    await assertSucceeds(
      updateDoc(usageRef, {
        connectionsCount: MAX_CONNECTIONS_PER_USER,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertDenied(
      updateDoc(usageRef, {
        connectionsCount: MAX_CONNECTIONS_PER_USER + 1,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("rejects foreign access, invalid counter changes and deletes", async () => {
    const usageRef = doc(ownerFirestore(), "usage", OWNER_ID);

    await assertDenied(getDoc(doc(otherUserFirestore(), "usage", OWNER_ID)));
    await assertDenied(
      updateDoc(usageRef, {
        messagesCount: 3,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertDenied(
      updateDoc(usageRef, {
        scheduledMessagesCount: -1,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertDenied(deleteDoc(usageRef));
  });
});
