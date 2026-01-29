/**
 * Class Management Service
 *
 * Handles class and stream CRUD operations
 * Provides class statistics and student management by class
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db, initializeFirebase, COLLECTIONS } from "@/lib/firebase";
import type { SchoolClass, Stream } from "@/types/school";
import type { Student, PaymentStatus } from "@/types/student";

// ============================================================================
// TYPES
// ============================================================================

export interface ClassWithStats extends SchoolClass {
  totalStudents: number;
  fullyPaid: number;
  partial: number;
  overdue: number;
  noPay: number;
  totalFees: number;
  totalCollected: number;
  collectionRate: number;
}

export interface ClassStudentSummary {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  streamName?: string;
  gender: "male" | "female";
  guardianName: string;
  guardianPhone: string;
  totalFees: number;
  amountPaid: number;
  balance: number;
  paymentStatus: PaymentStatus;
  boardingStatus?: "day" | "boarding" | "half_boarding";
}

export interface AddStudentToClassData {
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: "male" | "female";
  dateOfBirth?: Date;
  classId: string;
  className: string;
  streamId?: string;
  streamName?: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  guardianRelationship?: "father" | "mother" | "guardian" | "other";
  boardingStatus?: "day" | "boarding" | "half_boarding";
  previousSchool?: string;
  religion?: string;
  specialNeeds?: string;
}

export interface ClassFormData {
  name: string;
  level: "baby" | "nursery" | "primary" | "secondary";
  order: number;
  hasStreams: boolean;
  streams?: { name: string }[];
  feeStructureId?: string;
}

// ============================================================================
// UGANDAN CLASS PRESETS
// ============================================================================

export const UGANDAN_CLASS_PRESETS = {
  nursery: [
    { name: "Baby", level: "baby" as const, order: 1 },
    { name: "Middle", level: "nursery" as const, order: 2 },
    { name: "Top", level: "nursery" as const, order: 3 },
  ],
  primary: [
    { name: "P.1", level: "primary" as const, order: 4 },
    { name: "P.2", level: "primary" as const, order: 5 },
    { name: "P.3", level: "primary" as const, order: 6 },
    { name: "P.4", level: "primary" as const, order: 7 },
    { name: "P.5", level: "primary" as const, order: 8 },
    { name: "P.6", level: "primary" as const, order: 9 },
    { name: "P.7", level: "primary" as const, order: 10 },
  ],
  secondary: [
    { name: "S.1", level: "secondary" as const, order: 11 },
    { name: "S.2", level: "secondary" as const, order: 12 },
    { name: "S.3", level: "secondary" as const, order: 13 },
    { name: "S.4", level: "secondary" as const, order: 14 },
    { name: "S.5", level: "secondary" as const, order: 15 },
    { name: "S.6", level: "secondary" as const, order: 16 },
  ],
};

export const COMMON_STREAM_NAMES = [
  "A",
  "B",
  "C",
  "D",
  "North",
  "South",
  "East",
  "West",
  "Blue",
  "Red",
  "Green",
  "Yellow",
];

// ============================================================================
// MOCK DATA FOR DEVELOPMENT
// ============================================================================

const generateMockClasses = (): ClassWithStats[] => {
  const allPresets = [
    ...UGANDAN_CLASS_PRESETS.nursery,
    ...UGANDAN_CLASS_PRESETS.primary,
  ];

  return allPresets.map((preset, index) => {
    const hasStreams = preset.order >= 4; // P.1 and above typically have streams
    const totalStudents = Math.floor(Math.random() * 60) + 20;
    const fullyPaid = Math.floor(totalStudents * (0.2 + Math.random() * 0.3));
    const partial = Math.floor((totalStudents - fullyPaid) * 0.5);
    const overdue = Math.floor((totalStudents - fullyPaid - partial) * 0.3);
    const noPay = totalStudents - fullyPaid - partial - overdue;
    const avgFee = 850000 + preset.order * 50000;
    const totalFees = totalStudents * avgFee;
    const totalCollected =
      fullyPaid * avgFee + partial * avgFee * 0.5 + overdue * avgFee * 0.2;

    return {
      id: `class-${index + 1}`,
      name: preset.name,
      level: preset.level,
      order: preset.order,
      streams: hasStreams
        ? [
            {
              id: `stream-${index}-a`,
              name: "A",
              classId: `class-${index + 1}`,
            },
            {
              id: `stream-${index}-b`,
              name: "B",
              classId: `class-${index + 1}`,
            },
          ]
        : [],
      totalStudents,
      fullyPaid,
      partial,
      overdue,
      noPay,
      totalFees,
      totalCollected,
      collectionRate: Math.round((totalCollected / totalFees) * 100),
    };
  });
};

const generateMockStudentsForClass = (
  classId: string,
  className: string,
  streams: Stream[],
): ClassStudentSummary[] => {
  const count = Math.floor(Math.random() * 40) + 20;
  const students: ClassStudentSummary[] = [];

  const firstNames = [
    "James",
    "Mary",
    "John",
    "Sarah",
    "Peter",
    "Grace",
    "David",
    "Faith",
    "Joseph",
    "Hope",
    "Moses",
    "Joy",
    "Samuel",
    "Peace",
    "Daniel",
    "Mercy",
  ];
  const lastNames = [
    "Okello",
    "Namugera",
    "Wasswa",
    "Nakato",
    "Mugisha",
    "Namatovu",
    "Kato",
    "Auma",
    "Ochieng",
    "Akello",
    "Muwanga",
    "Nakimuli",
  ];

  for (let i = 0; i < count; i++) {
    const totalFees = 850000 + Math.floor(Math.random() * 300000);
    const paidPercentage = Math.random();
    const amountPaid = Math.round(totalFees * paidPercentage);
    const balance = totalFees - amountPaid;

    let paymentStatus: PaymentStatus;
    if (balance === 0) paymentStatus = "fully_paid";
    else if (amountPaid === 0) paymentStatus = "no_payment";
    else if (Math.random() > 0.7) paymentStatus = "overdue";
    else paymentStatus = "partial";

    students.push({
      id: `student-${classId}-${i}`,
      studentId: `EDU-2026-${String(i + 1).padStart(3, "0")}-${className.replace(".", "")}`,
      firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
      lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
      streamName:
        streams.length > 0
          ? streams[Math.floor(Math.random() * streams.length)].name
          : undefined,
      gender: Math.random() > 0.5 ? "male" : "female",
      guardianName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      guardianPhone: `+256${7}${Math.floor(Math.random() * 10)}${Math.floor(
        Math.random() * 10000000,
      )
        .toString()
        .padStart(7, "0")}`,
      totalFees,
      amountPaid,
      balance,
      paymentStatus,
      boardingStatus: Math.random() > 0.7 ? "boarding" : "day",
    });
  }

  return students.sort((a, b) => a.lastName.localeCompare(b.lastName));
};

// ============================================================================
// CLASS OPERATIONS
// ============================================================================

/**
 * Get all classes with statistics for a school
 */
export async function getClassesWithStats(
  schoolId: string,
): Promise<ClassWithStats[]> {
  try {
    initializeFirebase();

    // Get school document
    const schoolRef = doc(db, COLLECTIONS.SCHOOLS, schoolId);
    const schoolSnap = await getDoc(schoolRef);

    if (!schoolSnap.exists()) {
      console.warn("School not found, returning mock data");
      return generateMockClasses();
    }

    const school = schoolSnap.data();
    const classes: SchoolClass[] = school.classes || [];

    // Get all students for this school
    const studentsRef = collection(db, COLLECTIONS.STUDENTS);
    const studentsQuery = query(studentsRef, where("schoolId", "==", schoolId));
    const studentsSnap = await getDocs(studentsQuery);

    const students = studentsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Student[];

    // Calculate stats for each class
    return classes
      .map((cls) => {
        const classStudents = students.filter(
          (s) => s.classId === cls.id && s.status === "active",
        );

        const stats = {
          totalStudents: classStudents.length,
          fullyPaid: classStudents.filter(
            (s) => s.paymentStatus === "fully_paid",
          ).length,
          partial: classStudents.filter((s) => s.paymentStatus === "partial")
            .length,
          overdue: classStudents.filter((s) => s.paymentStatus === "overdue")
            .length,
          noPay: classStudents.filter((s) => s.paymentStatus === "no_payment")
            .length,
          totalFees: classStudents.reduce((sum, s) => sum + s.totalFees, 0),
          totalCollected: classStudents.reduce(
            (sum, s) => sum + s.amountPaid,
            0,
          ),
        };

        return {
          ...cls,
          ...stats,
          collectionRate:
            stats.totalFees > 0
              ? Math.round((stats.totalCollected / stats.totalFees) * 100)
              : 0,
        };
      })
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return generateMockClasses();
  }
}

/**
 * Get mock classes for development
 */
export function getMockClassesWithStats(): ClassWithStats[] {
  return generateMockClasses();
}

/**
 * Get a single class by ID
 */
export async function getClassById(
  schoolId: string,
  classId: string,
): Promise<ClassWithStats | null> {
  const classes = await getClassesWithStats(schoolId);
  return classes.find((c) => c.id === classId) || null;
}

/**
 * Get students for a specific class
 */
export async function getStudentsForClass(
  schoolId: string,
  classId: string,
  filters?: {
    streamId?: string;
    paymentStatus?: PaymentStatus;
    search?: string;
  },
): Promise<ClassStudentSummary[]> {
  try {
    initializeFirebase();

    const studentsRef = collection(db, COLLECTIONS.STUDENTS);
    let studentsQuery = query(
      studentsRef,
      where("schoolId", "==", schoolId),
      where("classId", "==", classId),
      where("status", "==", "active"),
    );

    const studentsSnap = await getDocs(studentsQuery);

    if (studentsSnap.empty) {
      // Return mock data for development
      const classes = generateMockClasses();
      const cls = classes.find((c) => c.id === classId);
      if (cls) {
        return generateMockStudentsForClass(classId, cls.name, cls.streams);
      }
      return [];
    }

    let students = studentsSnap.docs.map((doc) => {
      const data = doc.data() as Student;
      return {
        id: doc.id,
        studentId: data.studentId,
        firstName: data.firstName,
        lastName: data.lastName,
        streamName: data.streamName,
        gender: data.gender,
        guardianName: data.guardian?.name || "",
        guardianPhone: data.guardian?.phone || "",
        totalFees: data.totalFees,
        amountPaid: data.amountPaid,
        balance: data.balance,
        paymentStatus: data.paymentStatus,
        boardingStatus: data.boardingStatus,
      } as ClassStudentSummary;
    });

    // Apply filters
    if (filters?.streamId) {
      students = students.filter((s) => s.streamName === filters.streamId);
    }
    if (filters?.paymentStatus) {
      students = students.filter(
        (s) => s.paymentStatus === filters.paymentStatus,
      );
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      students = students.filter(
        (s) =>
          s.firstName.toLowerCase().includes(searchLower) ||
          s.lastName.toLowerCase().includes(searchLower) ||
          s.studentId.toLowerCase().includes(searchLower) ||
          s.guardianPhone.includes(filters.search!),
      );
    }

    return students.sort((a, b) => a.lastName.localeCompare(b.lastName));
  } catch (error) {
    console.error("Error fetching students for class:", error);
    // Return mock data on error
    const classes = generateMockClasses();
    const cls = classes.find((c) => c.id === classId);
    if (cls) {
      return generateMockStudentsForClass(classId, cls.name, cls.streams);
    }
    return [];
  }
}

/**
 * Get mock students for a class (development)
 */
export function getMockStudentsForClass(
  classId: string,
  className: string,
  streams: Stream[],
): ClassStudentSummary[] {
  return generateMockStudentsForClass(classId, className, streams);
}

/**
 * Add a new class to the school
 */
export async function addClass(
  schoolId: string,
  data: ClassFormData,
): Promise<string> {
  try {
    initializeFirebase();

    const schoolRef = doc(db, COLLECTIONS.SCHOOLS, schoolId);
    const schoolSnap = await getDoc(schoolRef);

    if (!schoolSnap.exists()) {
      throw new Error("School not found");
    }

    const school = schoolSnap.data();
    const classes: SchoolClass[] = school.classes || [];

    const classId = `class-${Date.now()}`;
    const newClass: SchoolClass = {
      id: classId,
      name: data.name,
      level: data.level,
      order: data.order,
      streams:
        data.hasStreams && data.streams
          ? data.streams.map((s, i) => ({
              id: `stream-${classId}-${i}`,
              name: s.name,
              classId,
            }))
          : [],
      feeStructureId: data.feeStructureId,
    };

    await updateDoc(schoolRef, {
      classes: [...classes, newClass],
      updatedAt: Timestamp.now(),
    });

    return classId;
  } catch (error) {
    console.error("Error adding class:", error);
    throw error;
  }
}

/**
 * Update an existing class
 */
export async function updateClass(
  schoolId: string,
  classId: string,
  data: Partial<ClassFormData>,
): Promise<void> {
  try {
    initializeFirebase();

    const schoolRef = doc(db, COLLECTIONS.SCHOOLS, schoolId);
    const schoolSnap = await getDoc(schoolRef);

    if (!schoolSnap.exists()) {
      throw new Error("School not found");
    }

    const school = schoolSnap.data();
    const classes: SchoolClass[] = school.classes || [];

    const classIndex = classes.findIndex((c) => c.id === classId);
    if (classIndex === -1) {
      throw new Error("Class not found");
    }

    const existingClass = classes[classIndex];
    const updatedClass: SchoolClass = {
      ...existingClass,
      name: data.name ?? existingClass.name,
      level: data.level ?? existingClass.level,
      order: data.order ?? existingClass.order,
      streams:
        data.hasStreams && data.streams
          ? data.streams.map((s, i) => ({
              id: existingClass.streams[i]?.id || `stream-${classId}-${i}`,
              name: s.name,
              classId,
            }))
          : data.hasStreams === false
            ? []
            : existingClass.streams,
      feeStructureId: data.feeStructureId ?? existingClass.feeStructureId,
    };

    classes[classIndex] = updatedClass;

    await updateDoc(schoolRef, {
      classes,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating class:", error);
    throw error;
  }
}

/**
 * Add a student to a class
 */
export async function addStudentToClass(
  schoolId: string,
  data: AddStudentToClassData,
): Promise<string> {
  try {
    initializeFirebase();

    const studentId = `EDU-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}-${data.className.replace(".", "")}`;
    const docId = `student-${Date.now()}`;

    const studentRef = doc(db, COLLECTIONS.STUDENTS, docId);

    const student: Partial<Student> = {
      id: docId,
      studentId,
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth
        ? Timestamp.fromDate(data.dateOfBirth)
        : undefined,
      schoolId,
      classId: data.classId,
      className: data.className,
      streamId: data.streamId,
      streamName: data.streamName,
      academicYear: new Date().getFullYear().toString(),
      term: 1,
      enrollmentDate: Timestamp.now(),
      status: "active",
      guardian: {
        name: data.guardianName,
        phone: data.guardianPhone,
        email: data.guardianEmail,
        relationship: data.guardianRelationship || "guardian",
      },
      totalFees: 0,
      amountPaid: 0,
      balance: 0,
      paymentStatus: "no_payment",
      boardingStatus: data.boardingStatus,
      previousSchool: data.previousSchool,
      religion: data.religion,
      specialNeeds: data.specialNeeds,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(studentRef, student);

    return docId;
  } catch (error) {
    console.error("Error adding student:", error);
    throw error;
  }
}

/**
 * Update a student
 */
export async function updateStudent(
  studentId: string,
  data: Partial<AddStudentToClassData>,
): Promise<void> {
  try {
    initializeFirebase();

    const studentRef = doc(db, COLLECTIONS.STUDENTS, studentId);

    const updates: Record<string, any> = {
      updatedAt: Timestamp.now(),
    };

    if (data.firstName) updates.firstName = data.firstName;
    if (data.lastName) updates.lastName = data.lastName;
    if (data.middleName !== undefined) updates.middleName = data.middleName;
    if (data.gender) updates.gender = data.gender;
    if (data.dateOfBirth)
      updates.dateOfBirth = Timestamp.fromDate(data.dateOfBirth);
    if (data.classId) updates.classId = data.classId;
    if (data.className) updates.className = data.className;
    if (data.streamId !== undefined) updates.streamId = data.streamId;
    if (data.streamName !== undefined) updates.streamName = data.streamName;
    if (data.guardianName) updates["guardian.name"] = data.guardianName;
    if (data.guardianPhone) updates["guardian.phone"] = data.guardianPhone;
    if (data.guardianEmail !== undefined)
      updates["guardian.email"] = data.guardianEmail;
    if (data.guardianRelationship)
      updates["guardian.relationship"] = data.guardianRelationship;
    if (data.boardingStatus !== undefined)
      updates.boardingStatus = data.boardingStatus;
    if (data.previousSchool !== undefined)
      updates.previousSchool = data.previousSchool;
    if (data.religion !== undefined) updates.religion = data.religion;
    if (data.specialNeeds !== undefined)
      updates.specialNeeds = data.specialNeeds;

    await updateDoc(studentRef, updates);
  } catch (error) {
    console.error("Error updating student:", error);
    throw error;
  }
}

/**
 * Move student to a different class
 */
export async function moveStudentToClass(
  studentId: string,
  newClassId: string,
  newClassName: string,
  newStreamId?: string,
  newStreamName?: string,
): Promise<void> {
  try {
    initializeFirebase();

    const studentRef = doc(db, COLLECTIONS.STUDENTS, studentId);

    await updateDoc(studentRef, {
      classId: newClassId,
      className: newClassName,
      streamId: newStreamId || null,
      streamName: newStreamName || null,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error moving student:", error);
    throw error;
  }
}

/**
 * Initialize default Ugandan classes for a new school
 */
export async function initializeDefaultClasses(
  schoolId: string,
  schoolType: "primary" | "secondary" | "mixed",
): Promise<void> {
  try {
    initializeFirebase();

    let presets: Array<{
      name: string;
      level: "baby" | "nursery" | "primary" | "secondary";
      order: number;
    }> = [];

    if (schoolType === "primary") {
      presets = [
        ...UGANDAN_CLASS_PRESETS.nursery,
        ...UGANDAN_CLASS_PRESETS.primary,
      ];
    } else if (schoolType === "secondary") {
      presets = UGANDAN_CLASS_PRESETS.secondary;
    } else {
      presets = [
        ...UGANDAN_CLASS_PRESETS.nursery,
        ...UGANDAN_CLASS_PRESETS.primary,
        ...UGANDAN_CLASS_PRESETS.secondary,
      ];
    }

    const classes: SchoolClass[] = presets.map((preset, i) => ({
      id: `class-${schoolId}-${i}`,
      name: preset.name,
      level: preset.level,
      order: preset.order,
      streams: [],
    }));

    const schoolRef = doc(db, COLLECTIONS.SCHOOLS, schoolId);
    await updateDoc(schoolRef, {
      classes,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error initializing default classes:", error);
    throw error;
  }
}
