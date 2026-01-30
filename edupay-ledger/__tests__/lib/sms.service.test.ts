/**
 * SMS Service Tests
 */

import {
  formatUgandanPhone,
  isValidUgandanPhone,
  detectNetwork,
  renderTemplate,
  smsService,
  sendPaymentReceiptSMS,
} from "@/lib/services/sms.service";

describe("SMS Service", () => {
  describe("formatUgandanPhone", () => {
    it("should format number starting with 0", () => {
      expect(formatUgandanPhone("0772123456")).toBe("+256772123456");
    });

    it("should format number starting with 256", () => {
      expect(formatUgandanPhone("256772123456")).toBe("+256772123456");
    });

    it("should format number starting with +256", () => {
      expect(formatUgandanPhone("+256772123456")).toBe("+256772123456");
    });

    it("should format number starting with 7", () => {
      expect(formatUgandanPhone("772123456")).toBe("+256772123456");
    });

    it("should handle numbers with spaces and dashes", () => {
      expect(formatUgandanPhone("077-212-3456")).toBe("+256772123456");
      expect(formatUgandanPhone("077 212 3456")).toBe("+256772123456");
    });

    it("should handle Airtel numbers", () => {
      expect(formatUgandanPhone("0701234567")).toBe("+256701234567");
      expect(formatUgandanPhone("0751234567")).toBe("+256751234567");
    });
  });

  describe("isValidUgandanPhone", () => {
    it("should validate MTN numbers", () => {
      expect(isValidUgandanPhone("+256772123456")).toBe(true);
      expect(isValidUgandanPhone("0772123456")).toBe(true);
      expect(isValidUgandanPhone("0782123456")).toBe(true);
    });

    it("should validate Airtel numbers", () => {
      expect(isValidUgandanPhone("+256701234567")).toBe(true);
      expect(isValidUgandanPhone("0751234567")).toBe(true);
    });

    it("should reject invalid numbers", () => {
      expect(isValidUgandanPhone("123")).toBe(false);
      expect(isValidUgandanPhone("+1234567890")).toBe(false);
      expect(isValidUgandanPhone("0812345678")).toBe(false); // Invalid prefix
    });

    it("should reject numbers that are too short", () => {
      expect(isValidUgandanPhone("077212345")).toBe(false);
    });

    it("should reject numbers that are too long", () => {
      expect(isValidUgandanPhone("07721234567")).toBe(false);
    });
  });

  describe("detectNetwork", () => {
    it("should detect MTN numbers", () => {
      expect(detectNetwork("0772123456")).toBe("MTN");
      expect(detectNetwork("0782123456")).toBe("MTN");
      expect(detectNetwork("0762123456")).toBe("MTN");
    });

    it("should detect Airtel numbers", () => {
      expect(detectNetwork("0701234567")).toBe("Airtel");
      expect(detectNetwork("0751234567")).toBe("Airtel");
      expect(detectNetwork("0741234567")).toBe("Airtel");
    });

    it("should detect Africell numbers", () => {
      expect(detectNetwork("0791234567")).toBe("Africell");
    });

    it("should return Unknown for unrecognized prefixes", () => {
      expect(detectNetwork("0812345678")).toBe("Unknown");
    });
  });

  describe("renderTemplate", () => {
    it("should render payment_receipt template", () => {
      const result = renderTemplate("payment_receipt", {
        guardianName: "John Doe",
        amount: "500,000",
        studentName: "Jane Doe",
        studentId: "STU001",
        balance: "200,000",
        receiptNumber: "RCP001",
        schoolName: "Test School",
      });

      expect(result).toContain("John Doe");
      expect(result).toContain("500,000");
      expect(result).toContain("Jane Doe");
      expect(result).toContain("STU001");
      expect(result).toContain("200,000");
      expect(result).toContain("RCP001");
      expect(result).toContain("Test School");
    });

    it("should render payment_reminder template", () => {
      const result = renderTemplate("payment_reminder", {
        guardianName: "Parent",
        studentName: "Student",
        balance: "100,000",
        dueDate: "2026-02-15",
        schoolName: "Demo School",
      });

      expect(result).toContain("Parent");
      expect(result).toContain("100,000");
      expect(result).toContain("2026-02-15");
    });

    it("should render custom template", () => {
      const result = renderTemplate("custom", {
        message: "This is a custom message",
      });

      // Custom template returns the message directly
      expect(result).toContain("This is a custom message");
    });
  });

  describe("smsService", () => {
    it("should report not configured when API key is missing", () => {
      expect(smsService.isConfigured()).toBe(false);
    });

    it("should return mock results in development without config", async () => {
      const result = await smsService.send({
        to: { phoneNumber: "0772123456", name: "Test" },
        type: "payment_receipt",
        templateData: {
          guardianName: "Test",
          amount: "100000",
          studentName: "Student",
          studentId: "STU001",
          balance: "0",
          receiptNumber: "RCP001",
          schoolName: "School",
        },
      });

      // In development without config, should return mock success
      expect(result).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe("sendPaymentReceiptSMS", () => {
    it("should send payment receipt SMS", async () => {
      const result = await sendPaymentReceiptSMS({
        guardianPhone: "0772123456",
        guardianName: "John Doe",
        studentName: "Jane Doe",
        studentId: "STU001",
        amount: 500000,
        balance: 200000,
        receiptNumber: "RCP001",
        schoolName: "Test School",
      });

      expect(result).toBeDefined();
      // In mock mode, the recipient is returned as provided
      expect(result.recipient).toBeDefined();
    });

    it("should handle invalid phone numbers", async () => {
      const result = await sendPaymentReceiptSMS({
        guardianPhone: "123",
        guardianName: "John Doe",
        studentName: "Jane Doe",
        studentId: "STU001",
        amount: 500000,
        balance: 200000,
        receiptNumber: "RCP001",
        schoolName: "Test School",
      });

      // In mock mode, invalid numbers still return a result but marked as failed
      expect(result.success).toBe(false);
    });
  });
});
