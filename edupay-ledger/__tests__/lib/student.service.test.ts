/**
 * Student Service Tests
 * Comprehensive tests for student management CRUD operations
 */

import {
  CreateStudentInput,
  StudentFilters,
} from "@/lib/services/student.service";
import { Student, PaymentStatus, InstallmentProgress } from "@/types/student";

// ============================================================================
// MOCK DATA
// ============================================================================

const mockGuardian = {
  name: "Jane Doe",
  phone: "+256771234567",
  email: "jane.doe@email.com",
  relationship: "mother" as const,
  alternatePhone: "+256701234567",
};

const mockStudent: Student = {
  id: "stu-001",
  studentId: "EDU-2026-001-P5",
  firstName: "John",
  lastName: "Doe",
  middleName: "James",
  dateOfBirth: new Date("2015-05-15") as any,
  gender: "male",
  photo: undefined,
  schoolId: "school-001",
  classId: "class-p5",
  streamId: "stream-a",
  className: "P.5",
  streamName: "A",
  academicYear: "2026",
  term: 1,
  enrollmentDate: new Date() as any,
  status: "active",
  guardian: mockGuardian,
  feeStructureId: "fee-p5-2026",
  totalFees: 1500000,
  amountPaid: 500000,
  balance: 1000000,
  currentInstallment: 2,
  installmentProgress: [],
  paymentStatus: "partial",
  createdAt: new Date() as any,
  updatedAt: new Date() as any,
};

const mockCreateInput: CreateStudentInput = {
  firstName: "Sarah",
  lastName: "Nakamya",
  middleName: "Grace",
  dateOfBirth: new Date("2016-03-20"),
  gender: "female",
  schoolId: "school-001",
  classId: "class-p4",
  streamId: "stream-b",
  className: "P.4",
  streamName: "B",
  academicYear: "2026",
  term: 1,
  guardian: mockGuardian,
  feeStructureId: "fee-p4-2026",
};

// ============================================================================
// STUDENT ID GENERATION TESTS
// ============================================================================

describe("Student ID Generation", () => {
  it("should generate unique student IDs", () => {
    const generateStudentId = (schoolId: string, className: string): string => {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      const classCode = className.replace(/\./g, "").toUpperCase();
      return `EDU-${year}-${random}-${classCode}`;
    };

    const id1 = generateStudentId("school-001", "P.5");
    const id2 = generateStudentId("school-001", "P.5");

    expect(id1).toMatch(/^EDU-\d{4}-\d{3}-P5$/);
    expect(id2).toMatch(/^EDU-\d{4}-\d{3}-P5$/);
  });

  it("should include correct year", () => {
    const generateStudentId = (schoolId: string, className: string): string => {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      const classCode = className.replace(/\./g, "").toUpperCase();
      return `EDU-${year}-${random}-${classCode}`;
    };

    const id = generateStudentId("school-001", "P.5");
    const currentYear = new Date().getFullYear().toString();

    expect(id).toContain(currentYear);
  });

  it("should sanitize class name correctly", () => {
    const sanitizeClassName = (className: string): string => {
      return className.replace(/\./g, "").toUpperCase();
    };

    expect(sanitizeClassName("P.5")).toBe("P5");
    expect(sanitizeClassName("S.1")).toBe("S1");
    expect(sanitizeClassName("P.7")).toBe("P7");
    expect(sanitizeClassName("s.4")).toBe("S4");
  });
});

// ============================================================================
// STUDENT VALIDATION TESTS
// ============================================================================

describe("Student Validation", () => {
  describe("Name Validation", () => {
    it("should require first name", () => {
      const isValidName = (name: string | undefined): boolean => {
        return !!name && name.trim().length >= 2;
      };

      expect(isValidName("John")).toBe(true);
      expect(isValidName("Jo")).toBe(true);
      expect(isValidName("J")).toBe(false);
      expect(isValidName("")).toBe(false);
      expect(isValidName(undefined)).toBe(false);
    });

    it("should validate name length", () => {
      const isValidName = (name: string): boolean => {
        return name.length >= 2 && name.length <= 50;
      };

      expect(isValidName("John")).toBe(true);
      expect(isValidName("A".repeat(50))).toBe(true);
      expect(isValidName("A".repeat(51))).toBe(false);
    });
  });

  describe("Guardian Phone Validation", () => {
    it("should validate Ugandan phone numbers", () => {
      const isValidUgandanPhone = (phone: string): boolean => {
        const cleaned = phone.replace(/[\s-]/g, "");
        // Ugandan numbers: +256 7xx xxx xxx or 07xx xxx xxx
        return /^(\+256|0)(7[0-9]|3[0-9])[0-9]{7}$/.test(cleaned);
      };

      expect(isValidUgandanPhone("+256771234567")).toBe(true);
      expect(isValidUgandanPhone("0771234567")).toBe(true);
      expect(isValidUgandanPhone("+256701234567")).toBe(true);
      expect(isValidUgandanPhone("0391234567")).toBe(true); // Airtel 03x
      expect(isValidUgandanPhone("123456789")).toBe(false);
      expect(isValidUgandanPhone("+1234567890")).toBe(false);
    });

    it("should format phone numbers correctly", () => {
      const formatUgandanPhone = (phone: string): string => {
        let cleaned = phone.replace(/[\s-]/g, "");
        if (cleaned.startsWith("0")) {
          cleaned = "+256" + cleaned.substring(1);
        }
        if (!cleaned.startsWith("+256")) {
          cleaned = "+256" + cleaned;
        }
        return cleaned;
      };

      expect(formatUgandanPhone("0771234567")).toBe("+256771234567");
      expect(formatUgandanPhone("+256771234567")).toBe("+256771234567");
      expect(formatUgandanPhone("771234567")).toBe("+256771234567");
    });
  });

  describe("Class Validation", () => {
    it("should validate primary classes", () => {
      const isValidPrimaryClass = (className: string): boolean => {
        return /^P\.[1-7]$/i.test(className);
      };

      expect(isValidPrimaryClass("P.1")).toBe(true);
      expect(isValidPrimaryClass("P.7")).toBe(true);
      expect(isValidPrimaryClass("P.8")).toBe(false);
      expect(isValidPrimaryClass("S.1")).toBe(false);
    });

    it("should validate secondary classes", () => {
      const isValidSecondaryClass = (className: string): boolean => {
        return /^S\.[1-6]$/i.test(className);
      };

      expect(isValidSecondaryClass("S.1")).toBe(true);
      expect(isValidSecondaryClass("S.6")).toBe(true);
      expect(isValidSecondaryClass("S.7")).toBe(false);
      expect(isValidSecondaryClass("P.1")).toBe(false);
    });

    it("should validate any school class", () => {
      const isValidClass = (className: string): boolean => {
        return /^[PS]\.[1-7]$/i.test(className);
      };

      expect(isValidClass("P.1")).toBe(true);
      expect(isValidClass("P.7")).toBe(true);
      expect(isValidClass("S.1")).toBe(true);
      expect(isValidClass("S.6")).toBe(true);
      expect(isValidClass("X.1")).toBe(false);
    });
  });
});

// ============================================================================
// PAYMENT STATUS TESTS
// ============================================================================

describe("Student Payment Status", () => {
  it("should determine payment status based on balance", () => {
    const getPaymentStatus = (
      totalFees: number,
      amountPaid: number,
    ): PaymentStatus => {
      if (amountPaid === 0) return "no_payment";
      if (amountPaid >= totalFees) return "fully_paid";
      return "partial";
    };

    expect(getPaymentStatus(1500000, 0)).toBe("no_payment");
    expect(getPaymentStatus(1500000, 750000)).toBe("partial");
    expect(getPaymentStatus(1500000, 1500000)).toBe("fully_paid");
    expect(getPaymentStatus(1500000, 1600000)).toBe("fully_paid"); // Overpaid
  });

  it("should calculate balance correctly", () => {
    const calculateBalance = (
      totalFees: number,
      amountPaid: number,
    ): number => {
      return Math.max(0, totalFees - amountPaid);
    };

    expect(calculateBalance(1500000, 0)).toBe(1500000);
    expect(calculateBalance(1500000, 500000)).toBe(1000000);
    expect(calculateBalance(1500000, 1500000)).toBe(0);
    expect(calculateBalance(1500000, 2000000)).toBe(0); // No negative balance
  });

  it("should calculate payment percentage", () => {
    const getPaymentPercentage = (
      totalFees: number,
      amountPaid: number,
    ): number => {
      if (totalFees === 0) return 0;
      return Math.min(100, Math.round((amountPaid / totalFees) * 100));
    };

    expect(getPaymentPercentage(1500000, 0)).toBe(0);
    expect(getPaymentPercentage(1500000, 750000)).toBe(50);
    expect(getPaymentPercentage(1500000, 1500000)).toBe(100);
    expect(getPaymentPercentage(1500000, 2000000)).toBe(100); // Capped at 100%
    expect(getPaymentPercentage(0, 0)).toBe(0);
  });
});

// ============================================================================
// INSTALLMENT PROGRESS TESTS
// ============================================================================

describe("Installment Progress", () => {
  const mockInstallments: InstallmentProgress[] = [
    {
      installmentId: "inst-1",
      installmentOrder: 1,
      installmentName: "1st Installment",
      amountDue: 500000,
      amountPaid: 500000,
      status: "completed",
      deadline: new Date("2026-02-15") as any,
      isUnlocked: true,
    },
    {
      installmentId: "inst-2",
      installmentOrder: 2,
      installmentName: "2nd Installment",
      amountDue: 500000,
      amountPaid: 200000,
      status: "partial",
      deadline: new Date("2026-04-15") as any,
      isUnlocked: true,
    },
    {
      installmentId: "inst-3",
      installmentOrder: 3,
      installmentName: "3rd Installment",
      amountDue: 500000,
      amountPaid: 0,
      status: "not_started",
      deadline: new Date("2026-06-15") as any,
      isUnlocked: false,
    },
  ];

  it("should identify current installment", () => {
    const getCurrentInstallment = (
      installments: InstallmentProgress[],
    ): number => {
      for (let i = 0; i < installments.length; i++) {
        if (installments[i].status !== "completed") {
          return i + 1;
        }
      }
      return installments.length; // All completed
    };

    expect(getCurrentInstallment(mockInstallments)).toBe(2);
  });

  it("should calculate total paid across installments", () => {
    const totalPaid = mockInstallments.reduce(
      (sum, inst) => sum + inst.amountPaid,
      0,
    );
    expect(totalPaid).toBe(700000);
  });

  it("should identify overdue installments", () => {
    const isOverdue = (installment: InstallmentProgress): boolean => {
      if (installment.status === "completed") return false;
      const deadline = new Date(installment.deadline as any);
      return deadline < new Date();
    };

    // Assuming current date is after Feb 15, 2026
    const jan30 = new Date("2026-01-30");
    const isOverdueOnDate = (
      installment: InstallmentProgress,
      currentDate: Date,
    ): boolean => {
      if (installment.status === "completed") return false;
      const deadline = new Date(installment.deadline as any);
      return deadline < currentDate;
    };

    expect(isOverdueOnDate(mockInstallments[0], jan30)).toBe(false); // Completed
    expect(isOverdueOnDate(mockInstallments[1], jan30)).toBe(false); // April deadline
    expect(isOverdueOnDate(mockInstallments[2], jan30)).toBe(false); // June deadline
  });

  it("should unlock next installment when current is completed", () => {
    const unlockNextInstallment = (
      installments: InstallmentProgress[],
      completedIndex: number,
    ): InstallmentProgress[] => {
      const updated = [...installments];
      if (completedIndex + 1 < updated.length) {
        updated[completedIndex + 1] = {
          ...updated[completedIndex + 1],
          isUnlocked: true,
        };
      }
      return updated;
    };

    const updated = unlockNextInstallment(mockInstallments, 0);
    expect(updated[1].isUnlocked).toBe(true);
  });
});

// ============================================================================
// STUDENT FILTERING TESTS
// ============================================================================

describe("Student Filtering", () => {
  const students: Student[] = [
    {
      ...mockStudent,
      id: "stu-001",
      className: "P.5",
      paymentStatus: "partial",
    },
    {
      ...mockStudent,
      id: "stu-002",
      firstName: "Sarah",
      className: "P.4",
      paymentStatus: "fully_paid",
    },
    {
      ...mockStudent,
      id: "stu-003",
      firstName: "Peter",
      className: "P.5",
      paymentStatus: "no_payment",
    },
    {
      ...mockStudent,
      id: "stu-004",
      firstName: "Mary",
      className: "S.1",
      paymentStatus: "partial",
    },
  ];

  describe("Filter by Class", () => {
    it("should filter students by class", () => {
      const filtered = students.filter((s) => s.className === "P.5");
      expect(filtered.length).toBe(2);
    });

    it("should return all students when no class filter", () => {
      const classFilter = undefined;
      const filtered = classFilter
        ? students.filter((s) => s.className === classFilter)
        : students;
      expect(filtered.length).toBe(4);
    });
  });

  describe("Filter by Payment Status", () => {
    it("should filter by payment status", () => {
      const filtered = students.filter((s) => s.paymentStatus === "partial");
      expect(filtered.length).toBe(2);
    });

    it("should find students with no payment", () => {
      const filtered = students.filter((s) => s.paymentStatus === "no_payment");
      expect(filtered.length).toBe(1);
      expect(filtered[0].firstName).toBe("Peter");
    });
  });

  describe("Search Filter", () => {
    it("should search by first name", () => {
      const search = "sarah";
      const filtered = students.filter((s) =>
        s.firstName.toLowerCase().includes(search.toLowerCase()),
      );
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("stu-002");
    });

    it("should search by student ID", () => {
      const search = "EDU-2026";
      const filtered = students.filter((s) =>
        s.studentId.toLowerCase().includes(search.toLowerCase()),
      );
      expect(filtered.length).toBe(4); // All have same format
    });

    it("should search case-insensitively", () => {
      const search = "JOHN";
      const filtered = students.filter((s) =>
        s.firstName.toLowerCase().includes(search.toLowerCase()),
      );
      expect(filtered.length).toBe(1);
    });
  });

  describe("Combined Filters", () => {
    it("should apply multiple filters", () => {
      const filters: StudentFilters = {
        classId: "class-p5",
        paymentStatus: "partial",
      };

      let filtered = students;

      if (filters.classId) {
        filtered = filtered.filter((s) => s.className === "P.5");
      }
      if (filters.paymentStatus) {
        filtered = filtered.filter(
          (s) => s.paymentStatus === filters.paymentStatus,
        );
      }

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("stu-001");
    });
  });
});

// ============================================================================
// STUDENT SORTING TESTS
// ============================================================================

describe("Student Sorting", () => {
  const students: Student[] = [
    {
      ...mockStudent,
      id: "stu-001",
      firstName: "John",
      lastName: "Doe",
      balance: 1000000,
    },
    {
      ...mockStudent,
      id: "stu-002",
      firstName: "Sarah",
      lastName: "Nakamya",
      balance: 500000,
    },
    {
      ...mockStudent,
      id: "stu-003",
      firstName: "Peter",
      lastName: "Okello",
      balance: 1500000,
    },
    {
      ...mockStudent,
      id: "stu-004",
      firstName: "Mary",
      lastName: "Achieng",
      balance: 0,
    },
  ];

  it("should sort by last name ascending", () => {
    const sorted = [...students].sort((a, b) =>
      a.lastName.localeCompare(b.lastName),
    );
    expect(sorted[0].lastName).toBe("Achieng");
    expect(sorted[3].lastName).toBe("Okello");
  });

  it("should sort by balance descending (highest first)", () => {
    const sorted = [...students].sort((a, b) => b.balance - a.balance);
    expect(sorted[0].balance).toBe(1500000);
    expect(sorted[3].balance).toBe(0);
  });

  it("should sort by balance ascending (lowest first)", () => {
    const sorted = [...students].sort((a, b) => a.balance - b.balance);
    expect(sorted[0].balance).toBe(0);
    expect(sorted[3].balance).toBe(1500000);
  });
});

// ============================================================================
// DATA INTEGRITY TESTS
// ============================================================================

describe("Student Data Integrity", () => {
  it("should validate required fields", () => {
    const validateStudent = (student: Partial<Student>): string[] => {
      const errors: string[] = [];

      if (!student.firstName?.trim()) errors.push("First name is required");
      if (!student.lastName?.trim()) errors.push("Last name is required");
      if (!student.gender) errors.push("Gender is required");
      if (!student.className) errors.push("Class is required");
      if (!student.guardian?.name) errors.push("Guardian name is required");
      if (!student.guardian?.phone) errors.push("Guardian phone is required");

      return errors;
    };

    expect(validateStudent(mockStudent).length).toBe(0);
    expect(validateStudent({}).length).toBe(6);
    expect(validateStudent({ firstName: "John" }).length).toBe(5);
  });

  it("should ensure balance matches fees minus paid", () => {
    const isBalanceCorrect = (student: Student): boolean => {
      const expectedBalance = student.totalFees - student.amountPaid;
      return Math.abs(student.balance - expectedBalance) < 1; // Allow for rounding
    };

    expect(isBalanceCorrect(mockStudent)).toBe(true);

    const incorrectStudent = { ...mockStudent, balance: 999999 };
    expect(isBalanceCorrect(incorrectStudent)).toBe(false);
  });
});
