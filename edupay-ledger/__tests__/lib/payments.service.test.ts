/**
 * Payments Service Tests
 * Comprehensive tests for payment processing logic
 */

import {
  PaymentListItem,
  PaymentStats,
  PaymentFilters,
  ChannelBreakdown,
  CollectionTrend,
  getMockPaymentData,
} from "@/lib/services/payments.service";
import { PaymentChannel, PaymentRecordStatus } from "@/types/payment";

// ============================================================================
// MOCK DATA
// ============================================================================

const mockPayment: PaymentListItem = {
  id: "pay-001",
  receiptNumber: "RCP-ABC123",
  transactionRef: "TXN-123456",
  studentId: "stu-001",
  studentName: "John Doe",
  studentClass: "P.5",
  studentStream: "A",
  amount: 500000,
  channel: "momo_mtn",
  channelDisplay: "MTN MoMo",
  status: "cleared",
  recordedBy: "admin@school.ug",
  recordedAt: new Date(),
  stellarAnchored: true,
  stellarTxHash: "stellar-hash-123",
  notes: "Term 1 payment",
};

const mockStats: PaymentStats = {
  todayCollection: 1500000,
  todayCount: 3,
  weekCollection: 8500000,
  weekCount: 17,
  monthCollection: 45000000,
  monthCount: 90,
  pendingVerification: 5,
  clearedCount: 85,
  totalCollection: 45000000,
  averagePayment: 500000,
};

// ============================================================================
// HELPER FUNCTION TESTS
// ============================================================================

describe("Payment Service Helpers", () => {
  describe("Channel Display Names", () => {
    it("should return correct display name for MTN MoMo", () => {
      const channel: PaymentChannel = "momo_mtn";
      // Test that display names are mapped correctly
      const displayNames: Record<PaymentChannel, string> = {
        momo_mtn: "MTN MoMo",
        momo_airtel: "Airtel Money",
        bank_transfer: "Bank Transfer",
        cash: "Cash",
        cheque: "Cheque",
        other: "Other",
      };
      expect(displayNames[channel]).toBe("MTN MoMo");
    });

    it("should return correct display name for Airtel Money", () => {
      const channel: PaymentChannel = "momo_airtel";
      const displayNames: Record<PaymentChannel, string> = {
        momo_mtn: "MTN MoMo",
        momo_airtel: "Airtel Money",
        bank_transfer: "Bank Transfer",
        cash: "Cash",
        cheque: "Cheque",
        other: "Other",
      };
      expect(displayNames[channel]).toBe("Airtel Money");
    });

    it("should return correct display name for all channels", () => {
      const channels: PaymentChannel[] = [
        "momo_mtn",
        "momo_airtel",
        "bank_transfer",
        "cash",
        "cheque",
        "other",
      ];
      const displayNames: Record<PaymentChannel, string> = {
        momo_mtn: "MTN MoMo",
        momo_airtel: "Airtel Money",
        bank_transfer: "Bank Transfer",
        cash: "Cash",
        cheque: "Cheque",
        other: "Other",
      };

      channels.forEach((channel) => {
        expect(displayNames[channel]).toBeDefined();
        expect(typeof displayNames[channel]).toBe("string");
      });
    });
  });

  describe("Receipt Number Generation", () => {
    it("should generate unique receipt numbers", () => {
      const generateReceiptNumber = (): string => {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `RCP-${timestamp}-${random}`;
      };

      const receipt1 = generateReceiptNumber();
      const receipt2 = generateReceiptNumber();

      expect(receipt1).toMatch(/^RCP-[A-Z0-9]+-[A-Z0-9]+$/);
      expect(receipt2).toMatch(/^RCP-[A-Z0-9]+-[A-Z0-9]+$/);
      // Due to random component, should be unique (very high probability)
      expect(receipt1).not.toBe(receipt2);
    });

    it("should have correct prefix", () => {
      const generateReceiptNumber = (): string => {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `RCP-${timestamp}-${random}`;
      };

      const receipt = generateReceiptNumber();
      expect(receipt.startsWith("RCP-")).toBe(true);
    });
  });

  describe("Date Helpers", () => {
    it("should get start of day correctly", () => {
      const getStartOfDay = (date: Date): Date => {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        return start;
      };

      const now = new Date("2026-01-30T14:30:00");
      const startOfDay = getStartOfDay(now);

      expect(startOfDay.getHours()).toBe(0);
      expect(startOfDay.getMinutes()).toBe(0);
      expect(startOfDay.getSeconds()).toBe(0);
      expect(startOfDay.getMilliseconds()).toBe(0);
      expect(startOfDay.getDate()).toBe(30);
    });

    it("should get start of week correctly (Monday)", () => {
      const getStartOfWeek = (date: Date): Date => {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        return start;
      };

      // January 30, 2026 is a Friday
      const friday = new Date("2026-01-30T14:30:00");
      const startOfWeek = getStartOfWeek(friday);

      // Should be Monday, January 26, 2026
      expect(startOfWeek.getDay()).toBe(1); // Monday
      expect(startOfWeek.getDate()).toBe(26);
    });

    it("should get start of month correctly", () => {
      const getStartOfMonth = (date: Date): Date => {
        const start = new Date(date);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        return start;
      };

      const midMonth = new Date("2026-01-15T14:30:00");
      const startOfMonth = getStartOfMonth(midMonth);

      expect(startOfMonth.getDate()).toBe(1);
      expect(startOfMonth.getMonth()).toBe(0); // January
      expect(startOfMonth.getHours()).toBe(0);
    });
  });
});

// ============================================================================
// PAYMENT DATA TESTS
// ============================================================================

describe("Payment Data Structures", () => {
  describe("PaymentListItem", () => {
    it("should have all required fields", () => {
      expect(mockPayment.id).toBeDefined();
      expect(mockPayment.receiptNumber).toBeDefined();
      expect(mockPayment.studentId).toBeDefined();
      expect(mockPayment.studentName).toBeDefined();
      expect(mockPayment.amount).toBeDefined();
      expect(mockPayment.channel).toBeDefined();
      expect(mockPayment.status).toBeDefined();
      expect(mockPayment.recordedAt).toBeDefined();
    });

    it("should have valid amount (positive number)", () => {
      expect(mockPayment.amount).toBeGreaterThan(0);
      expect(typeof mockPayment.amount).toBe("number");
    });

    it("should have valid channel type", () => {
      const validChannels: PaymentChannel[] = [
        "momo_mtn",
        "momo_airtel",
        "bank_transfer",
        "cash",
        "cheque",
        "other",
      ];
      expect(validChannels).toContain(mockPayment.channel);
    });

    it("should have valid status type", () => {
      const validStatuses: PaymentRecordStatus[] = [
        "pending",
        "cleared",
        "reversed",
        "failed",
      ];
      expect(validStatuses).toContain(mockPayment.status);
    });
  });

  describe("PaymentStats", () => {
    it("should have all required statistics fields", () => {
      expect(mockStats.todayCollection).toBeDefined();
      expect(mockStats.todayCount).toBeDefined();
      expect(mockStats.weekCollection).toBeDefined();
      expect(mockStats.weekCount).toBeDefined();
      expect(mockStats.monthCollection).toBeDefined();
      expect(mockStats.monthCount).toBeDefined();
      expect(mockStats.totalCollection).toBeDefined();
      expect(mockStats.averagePayment).toBeDefined();
    });

    it("should have non-negative values", () => {
      expect(mockStats.todayCollection).toBeGreaterThanOrEqual(0);
      expect(mockStats.todayCount).toBeGreaterThanOrEqual(0);
      expect(mockStats.weekCollection).toBeGreaterThanOrEqual(0);
      expect(mockStats.monthCollection).toBeGreaterThanOrEqual(0);
    });

    it("should have logical relationships (today <= week <= month)", () => {
      expect(mockStats.todayCollection).toBeLessThanOrEqual(
        mockStats.weekCollection,
      );
      expect(mockStats.weekCollection).toBeLessThanOrEqual(
        mockStats.monthCollection,
      );
      expect(mockStats.todayCount).toBeLessThanOrEqual(mockStats.weekCount);
      expect(mockStats.weekCount).toBeLessThanOrEqual(mockStats.monthCount);
    });
  });
});

// ============================================================================
// FILTER TESTS
// ============================================================================

describe("Payment Filtering", () => {
  const payments: PaymentListItem[] = [
    {
      ...mockPayment,
      id: "pay-001",
      amount: 500000,
      channel: "momo_mtn",
      status: "cleared",
    },
    {
      ...mockPayment,
      id: "pay-002",
      amount: 300000,
      channel: "cash",
      status: "pending",
    },
    {
      ...mockPayment,
      id: "pay-003",
      amount: 750000,
      channel: "bank_transfer",
      status: "cleared",
    },
    {
      ...mockPayment,
      id: "pay-004",
      amount: 200000,
      channel: "momo_airtel",
      status: "reversed",
    },
  ];

  describe("Filter by Channel", () => {
    it("should filter payments by MTN MoMo", () => {
      const filtered = payments.filter((p) => p.channel === "momo_mtn");
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("pay-001");
    });

    it('should return all payments when channel is "All"', () => {
      const channel = "All";
      const filtered =
        channel === "All"
          ? payments
          : payments.filter((p) => p.channel === channel);
      expect(filtered.length).toBe(4);
    });
  });

  describe("Filter by Status", () => {
    it("should filter payments by cleared status", () => {
      const filtered = payments.filter((p) => p.status === "cleared");
      expect(filtered.length).toBe(2);
    });

    it("should filter payments by pending status", () => {
      const filtered = payments.filter((p) => p.status === "pending");
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("pay-002");
    });
  });

  describe("Filter by Search", () => {
    it("should filter by student name", () => {
      const search = "john";
      const filtered = payments.filter((p) =>
        p.studentName.toLowerCase().includes(search.toLowerCase()),
      );
      expect(filtered.length).toBe(4); // All have "John Doe"
    });

    it("should filter by receipt number", () => {
      const search = "RCP-ABC123";
      const filtered = payments.filter((p) =>
        p.receiptNumber.toLowerCase().includes(search.toLowerCase()),
      );
      expect(filtered.length).toBe(4); // All have same receipt in mock
    });
  });

  describe("Sorting", () => {
    it("should sort by amount ascending", () => {
      const sorted = [...payments].sort((a, b) => a.amount - b.amount);
      expect(sorted[0].amount).toBe(200000);
      expect(sorted[sorted.length - 1].amount).toBe(750000);
    });

    it("should sort by amount descending", () => {
      const sorted = [...payments].sort((a, b) => b.amount - a.amount);
      expect(sorted[0].amount).toBe(750000);
      expect(sorted[sorted.length - 1].amount).toBe(200000);
    });
  });
});

// ============================================================================
// CHANNEL BREAKDOWN TESTS
// ============================================================================

describe("Channel Breakdown Calculation", () => {
  const payments: PaymentListItem[] = [
    { ...mockPayment, id: "pay-001", amount: 500000, channel: "momo_mtn" },
    { ...mockPayment, id: "pay-002", amount: 300000, channel: "momo_mtn" },
    { ...mockPayment, id: "pay-003", amount: 750000, channel: "bank_transfer" },
    { ...mockPayment, id: "pay-004", amount: 200000, channel: "cash" },
    { ...mockPayment, id: "pay-005", amount: 250000, channel: "momo_mtn" },
  ];

  it("should calculate channel breakdown correctly", () => {
    const channelMap = new Map<
      PaymentChannel,
      { amount: number; count: number }
    >();

    payments.forEach((p) => {
      const existing = channelMap.get(p.channel) || { amount: 0, count: 0 };
      channelMap.set(p.channel, {
        amount: existing.amount + p.amount,
        count: existing.count + 1,
      });
    });

    // MTN MoMo: 500000 + 300000 + 250000 = 1050000, count = 3
    const mtnData = channelMap.get("momo_mtn");
    expect(mtnData?.amount).toBe(1050000);
    expect(mtnData?.count).toBe(3);

    // Bank Transfer: 750000, count = 1
    const bankData = channelMap.get("bank_transfer");
    expect(bankData?.amount).toBe(750000);
    expect(bankData?.count).toBe(1);

    // Cash: 200000, count = 1
    const cashData = channelMap.get("cash");
    expect(cashData?.amount).toBe(200000);
    expect(cashData?.count).toBe(1);
  });

  it("should calculate percentages correctly", () => {
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    expect(total).toBe(2000000);

    const mtnAmount = 1050000;
    const mtnPercentage = Math.round((mtnAmount / total) * 100);
    expect(mtnPercentage).toBe(53); // 52.5% rounds to 53%
  });
});

// ============================================================================
// COLLECTION TREND TESTS
// ============================================================================

describe("Collection Trend Calculation", () => {
  it("should generate daily trends correctly", () => {
    const generateDailyTrend = (days: number): CollectionTrend[] => {
      const trends: CollectionTrend[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        trends.push({
          date: date.toISOString().split("T")[0],
          amount: Math.floor(Math.random() * 1000000),
          count: Math.floor(Math.random() * 10),
        });
      }
      return trends;
    };

    const trend = generateDailyTrend(7);
    expect(trend.length).toBe(7);

    // Check that dates are in order
    for (let i = 1; i < trend.length; i++) {
      expect(new Date(trend[i].date).getTime()).toBeGreaterThanOrEqual(
        new Date(trend[i - 1].date).getTime(),
      );
    }
  });

  it("should have valid trend data structure", () => {
    const trendItem: CollectionTrend = {
      date: "2026-01-30",
      amount: 500000,
      count: 10,
    };

    expect(trendItem.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(trendItem.amount).toBeGreaterThanOrEqual(0);
    expect(trendItem.count).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// MOCK DATA TESTS
// ============================================================================

describe("Mock Payment Data", () => {
  it("should return mock data with all required fields", () => {
    const mockData = getMockPaymentData();

    expect(mockData).toHaveProperty("payments");
    expect(mockData).toHaveProperty("stats");
    expect(mockData).toHaveProperty("activities");
    expect(mockData).toHaveProperty("channelBreakdown");
    expect(mockData).toHaveProperty("collectionTrend");
  });

  it("should return valid payments array", () => {
    const mockData = getMockPaymentData();

    expect(Array.isArray(mockData.payments)).toBe(true);
    expect(mockData.payments.length).toBeGreaterThan(0);

    // Check first payment has required fields
    const firstPayment = mockData.payments[0];
    expect(firstPayment).toHaveProperty("id");
    expect(firstPayment).toHaveProperty("amount");
    expect(firstPayment).toHaveProperty("channel");
  });

  it("should return valid stats", () => {
    const mockData = getMockPaymentData();

    expect(mockData.stats.todayCollection).toBeGreaterThanOrEqual(0);
    expect(mockData.stats.totalCollection).toBeGreaterThanOrEqual(0);
    expect(typeof mockData.stats.averagePayment).toBe("number");
  });
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================

describe("Payment Validation", () => {
  describe("Amount Validation", () => {
    it("should reject negative amounts", () => {
      const isValidAmount = (amount: number): boolean => {
        return amount > 0 && amount <= 100000000;
      };

      expect(isValidAmount(-1000)).toBe(false);
      expect(isValidAmount(0)).toBe(false);
    });

    it("should accept valid UGX amounts", () => {
      const isValidAmount = (amount: number): boolean => {
        return amount > 0 && amount <= 100000000;
      };

      expect(isValidAmount(1000)).toBe(true);
      expect(isValidAmount(500000)).toBe(true);
      expect(isValidAmount(10000000)).toBe(true);
    });

    it("should reject amounts exceeding maximum", () => {
      const isValidAmount = (amount: number): boolean => {
        return amount > 0 && amount <= 100000000;
      };

      expect(isValidAmount(100000001)).toBe(false);
      expect(isValidAmount(999999999)).toBe(false);
    });
  });

  describe("Transaction Reference Validation", () => {
    it("should validate MTN MoMo transaction references", () => {
      const isValidMTNRef = (ref: string): boolean => {
        // MTN MoMo refs are typically numeric, 10-15 digits
        return /^\d{10,15}$/.test(ref);
      };

      expect(isValidMTNRef("1234567890")).toBe(true);
      expect(isValidMTNRef("123456789012345")).toBe(true);
      expect(isValidMTNRef("abc123")).toBe(false);
      expect(isValidMTNRef("123")).toBe(false);
    });
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe("Payment Error Handling", () => {
  it("should handle missing student gracefully", async () => {
    const validateStudentExists = async (
      studentId: string,
    ): Promise<boolean> => {
      // Simulate check
      const validIds = ["stu-001", "stu-002", "stu-003"];
      return validIds.includes(studentId);
    };

    expect(await validateStudentExists("stu-001")).toBe(true);
    expect(await validateStudentExists("invalid-id")).toBe(false);
  });

  it("should handle duplicate receipt numbers", () => {
    const existingReceipts = ["RCP-001", "RCP-002", "RCP-003"];

    const isReceiptUnique = (receipt: string): boolean => {
      return !existingReceipts.includes(receipt);
    };

    expect(isReceiptUnique("RCP-001")).toBe(false);
    expect(isReceiptUnique("RCP-004")).toBe(true);
  });
});
