import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const PROJECT_ID = "sendflow-dev-prova";
const OWNER_ID = "rules-owner";
const OTHER_USER_ID = "rules-other-user";
const RESOURCE_COLLECTIONS = ["connections", "contacts", "messages"];

let testEnvironment: RulesTestEnvironment;

const seedOwnedResources = () =>
  testEnvironment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();

    await Promise.all([
      ...RESOURCE_COLLECTIONS.map((collectionName) =>
        setDoc(doc(firestore, collectionName, "owned-resource"), {
          userId: OWNER_ID,
        }),
      ),
      setDoc(doc(firestore, "usage", OWNER_ID), { userId: OWNER_ID }),
    ]);
  });

const assertResourceReads = async (
  context: RulesTestContext,
  assertion: typeof assertFails | typeof assertSucceeds,
) => {
  for (const collectionName of RESOURCE_COLLECTIONS) {
    await assertion(
      getDoc(doc(context.firestore(), collectionName, "owned-resource")),
    );
  }
};

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
  await seedOwnedResources();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe("Firestore rules", () => {
  it("allows users to read their own resources", async () => {
    const ownerContext = testEnvironment.authenticatedContext(OWNER_ID);

    await assertResourceReads(ownerContext, assertSucceeds);
    await assertSucceeds(
      getDoc(doc(ownerContext.firestore(), "usage", OWNER_ID)),
    );
  });

  it("rejects unauthenticated and foreign resource reads", async () => {
    await assertResourceReads(
      testEnvironment.unauthenticatedContext(),
      assertFails,
    );
    await assertResourceReads(
      testEnvironment.authenticatedContext(OTHER_USER_ID),
      assertFails,
    );
  });

  it("rejects direct writes to application resources", async () => {
    const firestore = testEnvironment
      .authenticatedContext(OWNER_ID)
      .firestore();

    for (const collectionName of RESOURCE_COLLECTIONS) {
      await assertFails(
        setDoc(doc(firestore, collectionName, "new-resource"), {
          userId: OWNER_ID,
        }),
      );
      await assertFails(
        setDoc(doc(firestore, collectionName, "owned-resource"), {
          userId: OWNER_ID,
        }),
      );
      await assertFails(
        deleteDoc(doc(firestore, collectionName, "owned-resource")),
      );
    }
  });

  it("isolates usage reads and rejects direct usage writes", async () => {
    const ownerFirestore = testEnvironment
      .authenticatedContext(OWNER_ID)
      .firestore();
    const foreignFirestore = testEnvironment
      .authenticatedContext(OTHER_USER_ID)
      .firestore();

    await assertFails(getDoc(doc(foreignFirestore, "usage", OWNER_ID)));
    await assertFails(
      setDoc(doc(ownerFirestore, "usage", OWNER_ID), { userId: OWNER_ID }),
    );
  });
});
