import process from "node:process";
import {
  applicationDefault,
  deleteApp,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { synchronizeUsage } from "./usage.mjs";

const printHelp = () => {
  console.log(`
Recalcula usage/{userId} a partir dos dados atuais do Firestore.

Uso:
  pnpm sync:usage -- --project-id <PROJECT_ID> --user-id <USER_ID>

Opções:
  --project-id     ID do projeto Firebase de destino (obrigatório)
  --user-id        UID do usuário que terá o usage sincronizado (obrigatório)
  --emulator-host  Firestore Emulator, por exemplo 127.0.0.1:8080
  --help           Exibe esta ajuda
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
    if (!argument.startsWith("--")) {
      throw new Error(`Argumento desconhecido: ${argument}`);
    }

    const value = argumentsList[index + 1];

    if (!value || value.startsWith("--")) {
      throw new Error(`Informe um valor para ${argument}.`);
    }

    options[argument.slice(2)] = value.trim();
    index += 1;
  }

  return options;
};

const requireOption = (options, name) => {
  const value = options[name];

  if (!value) throw new Error(`A opção --${name} é obrigatória.`);

  return value;
};

const syncUsage = async ({ emulatorHost, projectId, userId }) => {
  if (emulatorHost) process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;

  const app = initializeApp(
    emulatorHost
      ? { projectId }
      : { credential: applicationDefault(), projectId },
  );

  try {
    if (!emulatorHost) await getAuth(app).getUser(userId);

    const usage = await synchronizeUsage(getFirestore(app), userId);

    console.log("Usage sincronizado com sucesso.");
    console.log(`Projeto: ${projectId}`);
    console.log(`Usuário: ${userId}`);
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
    await syncUsage({
      emulatorHost: options["emulator-host"],
      projectId: requireOption(options, "project-id"),
      userId: requireOption(options, "user-id"),
    });
  }
} catch (error) {
  console.error(
    "Não foi possível sincronizar o usage:",
    error instanceof Error ? error.message : error,
  );
  console.error("Use --help para ver os argumentos disponíveis.");
  process.exitCode = 1;
}
