import { afterEach, describe, expect, it, vi } from "vitest";

const { dbMock } = vi.hoisted(() => ({
  dbMock: {
    collection: vi.fn(),
    getAll: vi.fn(),
  },
}));

vi.mock("firebase-admin/firestore", () => {
  class TestTimestamp {
    constructor(private readonly date: Date) {}

    static fromDate(date: Date) {
      return new TestTimestamp(date);
    }

    toDate() {
      return this.date;
    }
  }

  return {
    FieldValue: {
      serverTimestamp: vi.fn(() => ({ type: "serverTimestamp" })),
    },
    Timestamp: TestTimestamp,
  };
});

vi.mock("firebase-functions/v2/https", () => ({
  HttpsError: class TestHttpsError extends Error {
    constructor(
      public readonly code: string,
      message: string,
    ) {
      super(message);
    }
  },
}));

vi.mock("./firebase", () => ({ db: dbMock }));

import {
  getAuthenticatedUserId,
  getMessageScheduleFields,
  getOwnedConnection,
  getStringField,
  normalizeSearchText,
  sanitizePhone,
  validateContactIds,
} from "./utils.ts";

type ConnectionData = {
  name?: string;
  userId?: string;
};

const mockConnectionLookup = (data: ConnectionData) => {
  const getConnection = vi.fn().mockResolvedValue({
    data: () => data,
    exists: true,
    id: "connection-1",
  });

  dbMock.collection.mockReturnValue({
    doc: vi.fn().mockReturnValue({ get: getConnection }),
  });
};

const mockContactCollection = () => {
  dbMock.collection.mockReturnValue({
    doc: vi.fn((id: string) => ({ id })),
  });
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("normalizeSearchText", () => {
  it("trims whitespace and normalizes the text to lowercase", () => {
    const value = "  Minha Conexão  ";

    const result = normalizeSearchText(value);

    expect(result).toBe("minha conexão");
  });
});

describe("sanitizePhone", () => {
  it("removes formatting characters from the phone number", () => {
    const value = "+55 (11) 99999-9999";

    const result = sanitizePhone(value);

    expect(result).toBe("5511999999999");
  });
});

describe("getStringField", () => {
  it("returns trimmed strings", () => {
    const value = "  valor  ";

    const result = getStringField(value);

    expect(result).toBe("valor");
  });

  it("returns an empty string for non-string values", () => {
    const values = [undefined, 123];

    const results = values.map((value) => getStringField(value));

    expect(results).toEqual(["", ""]);
  });
});

describe("getAuthenticatedUserId", () => {
  it("returns the authenticated user id", () => {
    const userId = "user-1";

    const result = getAuthenticatedUserId(userId);

    expect(result).toBe(userId);
  });

  it("rejects unauthenticated requests", () => {
    const act = () => getAuthenticatedUserId();

    expect(act).toThrowError("Faça login para continuar.");
  });
});

describe("getMessageScheduleFields", () => {
  it("creates sent fields for an immediately sent message", () => {
    const status = "sent";

    const result = getMessageScheduleFields(status, undefined);

    expect(result).toMatchObject({
      scheduledAt: null,
      status: "sent",
    });
    expect(result.sentAt).toBeDefined();
  });

  it("creates scheduled fields for a future date", () => {
    const scheduledAt = new Date(Date.now() + 60_000);

    const result = getMessageScheduleFields(
      "scheduled",
      scheduledAt.toISOString(),
    );

    expect(result.status).toBe("scheduled");
    expect(result.sentAt).toBeNull();
    expect(result.scheduledAt?.toDate()).toEqual(scheduledAt);
  });

  it.each([
    ["an invalid status", "invalid", undefined],
    ["an invalid date", "scheduled", "not-a-date"],
    ["a missing date", "scheduled", undefined],
  ])("rejects %s", (_description, status, scheduledAt) => {
    const act = () => getMessageScheduleFields(status, scheduledAt);

    expect(act).toThrowError(/inválido|válida/);
  });

  it("rejects a date that is not in the future", () => {
    const scheduledAt = new Date().toISOString();
    const act = () => getMessageScheduleFields("scheduled", scheduledAt);

    expect(act).toThrowError("Agende a mensagem para uma data futura.");
  });
});

describe("getOwnedConnection", () => {
  it("returns the connection when it belongs to the user", async () => {
    mockConnectionLookup({ name: "Principal", userId: "user-1" });

    const result = getOwnedConnection("connection-1", "user-1");

    await expect(result).resolves.toEqual({
      id: "connection-1",
      name: "Principal",
    });
  });

  it("rejects a foreign connection", async () => {
    mockConnectionLookup({ name: "Outra conta", userId: "user-2" });

    const result = getOwnedConnection("connection-1", "user-1");

    await expect(result).rejects.toMatchObject({
      code: "permission-denied",
      message: "Conexão inválida.",
    });
  });

  it("uses an empty name when the connection has no name", async () => {
    mockConnectionLookup({ userId: "user-1" });

    const result = getOwnedConnection("connection-1", "user-1");

    await expect(result).resolves.toEqual({
      id: "connection-1",
      name: "",
    });
  });
});

describe("validateContactIds", () => {
  it("returns unique valid contact ids", async () => {
    const contactIds = ["contact-1", "contact-2"];

    mockContactCollection();
    dbMock.getAll.mockResolvedValue(
      contactIds.map((id) => ({
        data: () => ({
          connectionId: "connection-1",
          userId: "user-1",
        }),
        exists: true,
        id,
      })),
    );

    const result = validateContactIds({
      connectionId: "connection-1",
      contactIds,
      userId: "user-1",
    });

    await expect(result).resolves.toEqual(contactIds);
  });

  it.each([
    ["an empty list", []],
    ["a non-array value", "contact-1"],
    ["a list with a non-string id", ["contact-1", 2]],
  ])(
    "rejects %s before querying Firestore",
    async (_description, contactIds) => {
      const result = validateContactIds({
        connectionId: "connection-1",
        contactIds,
        userId: "user-1",
      });

      await expect(result).rejects.toMatchObject({ code: "invalid-argument" });
      expect(dbMock.getAll).not.toHaveBeenCalled();
    },
  );

  it("rejects duplicate contact ids", async () => {
    const contactIds = ["contact-1", "contact-1"];

    const result = validateContactIds({
      connectionId: "connection-1",
      contactIds,
      userId: "user-1",
    });

    await expect(result).rejects.toMatchObject({
      code: "invalid-argument",
      message: "Existem contatos duplicados.",
    });
  });

  it("rejects a contact from another user or connection", async () => {
    mockContactCollection();
    dbMock.getAll.mockResolvedValue([
      {
        data: () => ({
          connectionId: "another-connection",
          userId: "another-user",
        }),
        exists: true,
        id: "contact-1",
      },
    ]);

    const result = validateContactIds({
      connectionId: "connection-1",
      contactIds: ["contact-1"],
      userId: "user-1",
    });

    await expect(result).rejects.toMatchObject({
      code: "permission-denied",
      message: "A mensagem possui contatos inválidos.",
    });
  });
});
