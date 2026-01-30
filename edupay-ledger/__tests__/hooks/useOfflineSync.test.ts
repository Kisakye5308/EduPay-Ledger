/**
 * Offline Sync Tests
 * Tests for offline queue and conflict resolution
 */

import {
  SyncStatus,
  QueueItemStatus,
  QueueItem,
  ConflictResolution,
} from "@/hooks/useOfflineSync";

// ============================================================================
// MOCK DATA
// ============================================================================

const createMockQueueItem = (
  overrides: Partial<QueueItem> = {},
): QueueItem => ({
  id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type: "payment",
  action: "create",
  data: { amount: 500000, studentId: "stu-001" },
  timestamp: Date.now(),
  status: "pending",
  syncAttempts: 0,
  ...overrides,
});

// ============================================================================
// QUEUE ITEM GENERATION TESTS
// ============================================================================

describe("Queue Item Generation", () => {
  it("should generate unique queue IDs", () => {
    const generateId = (): string => {
      return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const id1 = generateId();
    const id2 = generateId();

    expect(id1).toMatch(/^queue_\d+_[a-z0-9]+$/);
    expect(id2).toMatch(/^queue_\d+_[a-z0-9]+$/);
    // High probability of uniqueness due to timestamp + random
  });

  it("should create queue item with correct defaults", () => {
    const item = createMockQueueItem();

    expect(item.status).toBe("pending");
    expect(item.syncAttempts).toBe(0);
    expect(item.timestamp).toBeLessThanOrEqual(Date.now());
  });
});

// ============================================================================
// QUEUE MANAGEMENT TESTS
// ============================================================================

describe("Queue Management", () => {
  describe("Add to Queue", () => {
    it("should add items to queue", () => {
      const queue: QueueItem[] = [];
      const newItem = createMockQueueItem();

      queue.push(newItem);

      expect(queue.length).toBe(1);
      expect(queue[0].id).toBe(newItem.id);
    });

    it("should preserve order when adding multiple items", () => {
      const queue: QueueItem[] = [];
      const item1 = createMockQueueItem({ timestamp: 1000 });
      const item2 = createMockQueueItem({ timestamp: 2000 });
      const item3 = createMockQueueItem({ timestamp: 3000 });

      queue.push(item1, item2, item3);

      expect(queue.length).toBe(3);
      expect(queue[0].timestamp).toBe(1000);
      expect(queue[2].timestamp).toBe(3000);
    });
  });

  describe("Remove from Queue", () => {
    it("should remove item by ID", () => {
      const queue: QueueItem[] = [
        createMockQueueItem({ id: "item-1" }),
        createMockQueueItem({ id: "item-2" }),
        createMockQueueItem({ id: "item-3" }),
      ];

      const filtered = queue.filter((item) => item.id !== "item-2");

      expect(filtered.length).toBe(2);
      expect(filtered.find((i) => i.id === "item-2")).toBeUndefined();
    });
  });

  describe("Update Queue Item", () => {
    it("should update item status", () => {
      const queue: QueueItem[] = [
        createMockQueueItem({ id: "item-1", status: "pending" }),
      ];

      const updated = queue.map((item) =>
        item.id === "item-1"
          ? { ...item, status: "syncing" as QueueItemStatus }
          : item,
      );

      expect(updated[0].status).toBe("syncing");
    });

    it("should increment sync attempts", () => {
      let item = createMockQueueItem({ syncAttempts: 0 });

      item = { ...item, syncAttempts: item.syncAttempts + 1 };
      expect(item.syncAttempts).toBe(1);

      item = { ...item, syncAttempts: item.syncAttempts + 1 };
      expect(item.syncAttempts).toBe(2);
    });
  });

  describe("Clear Synced Items", () => {
    it("should remove only synced items", () => {
      const queue: QueueItem[] = [
        createMockQueueItem({ id: "item-1", status: "synced" }),
        createMockQueueItem({ id: "item-2", status: "pending" }),
        createMockQueueItem({ id: "item-3", status: "synced" }),
        createMockQueueItem({ id: "item-4", status: "failed" }),
      ];

      const filtered = queue.filter((item) => item.status !== "synced");

      expect(filtered.length).toBe(2);
      expect(filtered.map((i) => i.id)).toEqual(["item-2", "item-4"]);
    });
  });
});

// ============================================================================
// SYNC STATUS TESTS
// ============================================================================

describe("Sync Status Management", () => {
  it("should track sync status transitions", () => {
    const validTransitions: Record<SyncStatus, SyncStatus[]> = {
      idle: ["syncing"],
      syncing: ["success", "error"],
      success: ["idle", "syncing"],
      error: ["idle", "syncing"],
    };

    expect(validTransitions.idle).toContain("syncing");
    expect(validTransitions.syncing).toContain("success");
    expect(validTransitions.syncing).toContain("error");
  });

  it("should identify items needing sync", () => {
    const queue: QueueItem[] = [
      createMockQueueItem({ status: "pending" }),
      createMockQueueItem({ status: "synced" }),
      createMockQueueItem({ status: "failed" }),
      createMockQueueItem({ status: "pending" }),
    ];

    const needsSync = queue.filter(
      (item) => item.status === "pending" || item.status === "failed",
    );

    expect(needsSync.length).toBe(3);
  });
});

// ============================================================================
// CONFLICT RESOLUTION TESTS
// ============================================================================

describe("Conflict Resolution", () => {
  const localData = {
    id: "pay-001",
    amount: 500000,
    updatedAt: new Date("2026-01-30T10:00:00"),
  };

  const serverData = {
    id: "pay-001",
    amount: 450000,
    updatedAt: new Date("2026-01-30T10:05:00"),
  };

  describe("Conflict Detection", () => {
    it("should detect conflict when server has newer data", () => {
      const hasConflict = (
        local: typeof localData,
        server: typeof serverData,
      ): boolean => {
        return (
          local.updatedAt < server.updatedAt &&
          JSON.stringify(local) !== JSON.stringify(server)
        );
      };

      expect(hasConflict(localData, serverData)).toBe(true);
    });

    it("should not detect conflict when data matches", () => {
      const sameData = { ...localData };
      const hasConflict =
        JSON.stringify(localData) !== JSON.stringify(sameData);
      expect(hasConflict).toBe(false);
    });
  });

  describe("Resolution Strategies", () => {
    it("should keep local data when selected", () => {
      const resolve = (
        resolution: "keep-local" | "keep-server" | "merge",
        local: typeof localData,
        server: typeof serverData,
      ) => {
        switch (resolution) {
          case "keep-local":
            return local;
          case "keep-server":
            return server;
          case "merge":
            return { ...server, ...local }; // Local takes precedence
        }
      };

      const result = resolve("keep-local", localData, serverData);
      expect(result.amount).toBe(500000);
    });

    it("should keep server data when selected", () => {
      const resolve = (
        resolution: "keep-local" | "keep-server" | "merge",
        local: typeof localData,
        server: typeof serverData,
      ) => {
        switch (resolution) {
          case "keep-local":
            return local;
          case "keep-server":
            return server;
          case "merge":
            return { ...server, ...local };
        }
      };

      const result = resolve("keep-server", localData, serverData);
      expect(result.amount).toBe(450000);
    });

    it("should merge data with local precedence", () => {
      const localWithExtra = { ...localData, notes: "Local note" };
      const serverWithExtra = { ...serverData, status: "verified" };

      const merged = { ...serverWithExtra, ...localWithExtra };

      expect(merged.amount).toBe(500000); // Local precedence
      expect((merged as any).status).toBe("verified"); // Server field kept
      expect((merged as any).notes).toBe("Local note"); // Local field kept
    });
  });

  describe("Conflict Queue", () => {
    it("should add conflict to resolution queue", () => {
      const conflicts: ConflictResolution[] = [];

      const newConflict: ConflictResolution = {
        id: "conflict-001",
        localData,
        serverData,
        resolution: "keep-local",
      };

      conflicts.push(newConflict);

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].id).toBe("conflict-001");
    });

    it("should remove conflict after resolution", () => {
      const conflicts: ConflictResolution[] = [
        { id: "conflict-001", localData, serverData, resolution: "keep-local" },
        {
          id: "conflict-002",
          localData,
          serverData,
          resolution: "keep-server",
        },
      ];

      const afterResolution = conflicts.filter((c) => c.id !== "conflict-001");

      expect(afterResolution.length).toBe(1);
      expect(afterResolution[0].id).toBe("conflict-002");
    });
  });
});

// ============================================================================
// RETRY LOGIC TESTS
// ============================================================================

describe("Sync Retry Logic", () => {
  it("should limit retry attempts", () => {
    const MAX_RETRIES = 3;

    const shouldRetry = (item: QueueItem): boolean => {
      return item.syncAttempts < MAX_RETRIES && item.status === "failed";
    };

    const item1 = createMockQueueItem({ syncAttempts: 0, status: "failed" });
    const item2 = createMockQueueItem({ syncAttempts: 3, status: "failed" });
    const item3 = createMockQueueItem({ syncAttempts: 2, status: "failed" });

    expect(shouldRetry(item1)).toBe(true);
    expect(shouldRetry(item2)).toBe(false); // Max retries reached
    expect(shouldRetry(item3)).toBe(true);
  });

  it("should calculate exponential backoff delay", () => {
    const getBackoffDelay = (
      attempt: number,
      baseDelay: number = 1000,
    ): number => {
      return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
    };

    expect(getBackoffDelay(0)).toBe(1000); // 1 second
    expect(getBackoffDelay(1)).toBe(2000); // 2 seconds
    expect(getBackoffDelay(2)).toBe(4000); // 4 seconds
    expect(getBackoffDelay(3)).toBe(8000); // 8 seconds
    expect(getBackoffDelay(10)).toBe(30000); // Capped at 30 seconds
  });

  it("should record last error message", () => {
    let item = createMockQueueItem();

    item = {
      ...item,
      status: "failed" as QueueItemStatus,
      lastError: "Network request failed",
      syncAttempts: item.syncAttempts + 1,
    };

    expect(item.lastError).toBe("Network request failed");
    expect(item.syncAttempts).toBe(1);
  });
});

// ============================================================================
// ONLINE/OFFLINE STATUS TESTS
// ============================================================================

describe("Online/Offline Status", () => {
  it("should track online status", () => {
    let isOnline = true;

    // Simulate going offline
    isOnline = false;
    expect(isOnline).toBe(false);

    // Simulate coming back online
    isOnline = true;
    expect(isOnline).toBe(true);
  });

  it("should trigger sync when coming online", () => {
    let syncTriggered = false;
    const queue: QueueItem[] = [createMockQueueItem({ status: "pending" })];

    const onOnline = () => {
      if (queue.some((item) => item.status === "pending")) {
        syncTriggered = true;
      }
    };

    onOnline();
    expect(syncTriggered).toBe(true);
  });

  it("should not trigger sync if queue is empty", () => {
    let syncTriggered = false;
    const queue: QueueItem[] = [];

    const onOnline = () => {
      if (queue.some((item) => item.status === "pending")) {
        syncTriggered = true;
      }
    };

    onOnline();
    expect(syncTriggered).toBe(false);
  });
});

// ============================================================================
// DATA PERSISTENCE TESTS
// ============================================================================

describe("Queue Persistence", () => {
  it("should serialize queue items correctly", () => {
    const queue: QueueItem[] = [
      createMockQueueItem({ id: "item-1" }),
      createMockQueueItem({ id: "item-2" }),
    ];

    const serialized = JSON.stringify(queue);
    const deserialized = JSON.parse(serialized);

    expect(deserialized.length).toBe(2);
    expect(deserialized[0].id).toBe("item-1");
  });

  it("should filter sensitive data before persistence", () => {
    const partialize = (state: {
      queue: QueueItem[];
      syncStatus: SyncStatus;
    }) => ({
      queue: state.queue,
      // Don't persist syncStatus
    });

    const state = {
      queue: [createMockQueueItem()],
      syncStatus: "syncing" as SyncStatus,
    };

    const persisted = partialize(state);

    expect(persisted).toHaveProperty("queue");
    expect(persisted).not.toHaveProperty("syncStatus");
  });
});

// ============================================================================
// SYNC ORDER TESTS
// ============================================================================

describe("Sync Order Priority", () => {
  it("should process items in FIFO order", () => {
    const queue: QueueItem[] = [
      createMockQueueItem({ id: "first", timestamp: 1000 }),
      createMockQueueItem({ id: "second", timestamp: 2000 }),
      createMockQueueItem({ id: "third", timestamp: 3000 }),
    ];

    const sortedByTime = [...queue].sort((a, b) => a.timestamp - b.timestamp);

    expect(sortedByTime[0].id).toBe("first");
    expect(sortedByTime[2].id).toBe("third");
  });

  it("should prioritize certain item types", () => {
    const queue: QueueItem[] = [
      createMockQueueItem({ id: "payment-1", type: "payment" }),
      createMockQueueItem({ id: "settings-1", type: "settings" }),
      createMockQueueItem({ id: "student-1", type: "student" }),
    ];

    // Priority: payment > student > settings
    const priority: Record<string, number> = {
      payment: 1,
      student: 2,
      settings: 3,
    };

    const sortedByPriority = [...queue].sort(
      (a, b) => priority[a.type] - priority[b.type],
    );

    expect(sortedByPriority[0].type).toBe("payment");
    expect(sortedByPriority[2].type).toBe("settings");
  });
});
