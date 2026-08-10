import { createHash } from "node:crypto";
import process from "node:process";
import {
  applicationDefault,
  deleteApp,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";

const ITEMS_PER_COLLECTION = 100;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1_000;
const MINUTE_IN_MILLISECONDS = 60 * 1_000;

const printHelp = () => {
  console.log(`
Popula o Firestore com ${ITEMS_PER_COLLECTION} conexões, ${ITEMS_PER_COLLECTION} contatos e ${ITEMS_PER_COLLECTION} mensagens.

Uso:
  pnpm seed:firestore -- --project-id <PROJECT_ID> --user-id <USER_ID>

Opções:
  --project-id     ID do projeto Firebase de destino (obrigatório)
  --user-id        UID do usuário que será dono dos dados (obrigatório)
  --emulator-host  Firestore Emulator, por exemplo 127.0.0.1:8080
  --allow-existing Permite manter dados que não pertençam ao seed
  --help           Exibe esta ajuda

Autenticação no Firebase real:
  Defina GOOGLE_APPLICATION_CREDENTIALS com o caminho de uma service account
  ou configure Application Default Credentials antes de executar o comando.

O script usa IDs determinísticos. Executá-lo novamente para o mesmo usuário
atualiza os mesmos documentos de seed em vez de criar novas duplicatas.
`);
};

const readArguments = (argumentsList) => {
  const options = {};

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];

    if (argument === "--") continue;
    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }
    if (argument === "--allow-existing") {
      options.allowExisting = true;
      continue;
    }

    if (!argument.startsWith("--")) {
      throw new Error(`Argumento desconhecido: ${argument}`);
    }

    const name = argument.slice(2);
    const value = argumentsList[index + 1];

    if (!value || value.startsWith("--")) {
      throw new Error(`Informe um valor para --${name}.`);
    }

    options[name] = value.trim();
    index += 1;
  }

  return options;
};

const requireOption = (options, name) => {
  const value = options[name];

  if (!value) {
    throw new Error(`A opção --${name} é obrigatória.`);
  }

  return value;
};

const padIndex = (index) => String(index).padStart(3, "0");

const createSeedPrefix = (userId) =>
  `seed-${createHash("sha256").update(userId).digest("hex").slice(0, 12)}`;

const createSeedDocumentId = (prefix, resource, index) =>
  `${prefix}-${resource}-${padIndex(index)}`;

const createTimestamp = (milliseconds) =>
  Timestamp.fromMillis(Math.max(milliseconds, 0));

const normalizeSearchText = (value) => value.trim().toLowerCase();

const assertSafeTarget = async (db, userId, prefix) => {
  const resources = ["connection", "contact", "message"];
  const collections = ["connections", "contacts", "messages"];
  const snapshots = await Promise.all(
    collections.map((collectionName) =>
      db
        .collection(collectionName)
        .where("userId", "==", userId)
        .select()
        .get(),
    ),
  );

  const unexpectedDocuments = snapshots.flatMap((snapshot, collectionIndex) => {
    const expectedIds = new Set(
      Array.from({ length: ITEMS_PER_COLLECTION }, (_, index) =>
        createSeedDocumentId(prefix, resources[collectionIndex], index + 1),
      ),
    );

    return snapshot.docs
      .filter((document) => !expectedIds.has(document.id))
      .map((document) => `${collections[collectionIndex]}/${document.id}`);
  });

  if (unexpectedDocuments.length > 0) {
    const examples = unexpectedDocuments.slice(0, 3).join(", ");

    throw new Error(
      `O usuário já possui dados que não pertencem a este seed ` +
        `(${examples}). Use um usuário dedicado a testes.`,
    );
  }
};

const getCurrentUsage = async (db, userId) => {
  const [connections, contacts, messages] = await Promise.all([
    db.collection("connections").where("userId", "==", userId).select().get(),
    db.collection("contacts").where("userId", "==", userId).select().get(),
    db
      .collection("messages")
      .where("userId", "==", userId)
      .select("status")
      .get(),
  ]);

  return {
    connectionsCount: connections.size,
    contactsCount: contacts.size,
    messagesCount: messages.size,
    scheduledMessagesCount: messages.docs.filter(
      (message) => message.data().status === "scheduled",
    ).length,
  };
};

const writeSeedDocuments = async (db, userId, prefix) => {
  const batch = db.batch();
  const now = Date.now();
  const contactsConnectionId = createSeedDocumentId(prefix, "connection", 1);
  const contactsConnectionName = "Conexão Seed 001";

  for (let index = 1; index <= ITEMS_PER_COLLECTION; index += 1) {
    const suffix = padIndex(index);
    const connectionId = createSeedDocumentId(prefix, "connection", index);
    const contactId = createSeedDocumentId(prefix, "contact", index);
    const messageId = createSeedDocumentId(prefix, "message", index);
    const connectionName = `Conexão Seed ${suffix}`;
    const contactName = `Contato Seed ${suffix}`;
    const createdAt = createTimestamp(now - index * MINUTE_IN_MILLISECONDS);
    const isScheduled = index % 2 === 0;

    batch.set(db.collection("connections").doc(connectionId), {
      createdAt,
      name: connectionName,
      nameNormalized: normalizeSearchText(connectionName),
      updatedAt: createdAt,
      userId,
    });

    batch.set(db.collection("contacts").doc(contactId), {
      connectionId: contactsConnectionId,
      connectionName: contactsConnectionName,
      createdAt,
      name: contactName,
      nameNormalized: normalizeSearchText(contactName),
      phone: `119${String(10_000_000 + index)}`,
      updatedAt: createdAt,
      userId,
    });

    batch.set(db.collection("messages").doc(messageId), {
      connectionId: contactsConnectionId,
      contactIds: [contactId],
      content: `Mensagem de teste ${suffix}`,
      createdAt,
      recipientsCount: 1,
      scheduledAt: isScheduled
        ? createTimestamp(
            now + 7 * DAY_IN_MILLISECONDS + index * MINUTE_IN_MILLISECONDS,
          )
        : null,
      sentAt: isScheduled ? null : createdAt,
      status: isScheduled ? "scheduled" : "sent",
      updatedAt: createdAt,
      userId,
    });
  }

  await batch.commit();
};

const updateUsage = async (db, userId) => {
  const usage = await getCurrentUsage(db, userId);
  const usageRef = db.collection("usage").doc(userId);
  const usageSnapshot = await usageRef.get();

  await usageRef.set(
    {
      ...usage,
      ...(usageSnapshot.exists
        ? {}
        : { createdAt: FieldValue.serverTimestamp() }),
      updatedAt: FieldValue.serverTimestamp(),
      userId,
    },
    { merge: true },
  );

  return usage;
};

const seedFirestore = async ({
  allowExisting,
  emulatorHost,
  projectId,
  userId,
}) => {
  if (emulatorHost) {
    process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
  }

  const app = initializeApp(
    emulatorHost
      ? { projectId }
      : { credential: applicationDefault(), projectId },
  );

  try {
    const db = getFirestore(app);
    const prefix = createSeedPrefix(userId);

    if (!emulatorHost) {
      await getAuth(app).getUser(userId);
    }

    if (!allowExisting) {
      await assertSafeTarget(db, userId, prefix);
    }
    await writeSeedDocuments(db, userId, prefix);
    const usage = await updateUsage(db, userId);

    console.log("Seed concluído com sucesso.");
    console.log(`Projeto: ${projectId}`);
    console.log(`Usuário: ${userId}`);
    console.log(
      `Destino: ${emulatorHost ? `emulador em ${emulatorHost}` : "Firebase real"}`,
    );
    console.log(`Conexões de seed: ${ITEMS_PER_COLLECTION}`);
    console.log(`Contatos de seed: ${ITEMS_PER_COLLECTION}`);
    console.log(`Mensagens de seed: ${ITEMS_PER_COLLECTION}`);
    console.log("Usage atual:", usage);
  } finally {
    await deleteApp(app);
  }
};

try {
  const options = readArguments(process.argv.slice(2));

  if (options.help) {
    printHelp();
  } else {
    await seedFirestore({
      allowExisting: options.allowExisting === true,
      emulatorHost: options["emulator-host"],
      projectId: requireOption(options, "project-id"),
      userId: requireOption(options, "user-id"),
    });
  }
} catch (error) {
  console.error(
    "Não foi possível executar o seed:",
    error instanceof Error ? error.message : error,
  );
  console.error("Use --help para ver os argumentos disponíveis.");
  process.exitCode = 1;
}
