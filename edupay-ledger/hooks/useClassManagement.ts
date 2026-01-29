/**
 * useClassManagement Hook
 *
 * Manages class data, student lists, and CRUD operations
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useFirebaseAuth } from "@/contexts/AuthContext";
import {
  getClassesWithStats,
  getMockClassesWithStats,
  getStudentsForClass,
  getMockStudentsForClass,
  addClass,
  updateClass,
  addStudentToClass,
  updateStudent,
  moveStudentToClass,
  ClassWithStats,
  ClassStudentSummary,
  ClassFormData,
  AddStudentToClassData,
  UGANDAN_CLASS_PRESETS,
  COMMON_STREAM_NAMES,
} from "@/lib/services/class.service";
import type { PaymentStatus } from "@/types/student";
import type { Stream } from "@/types/school";

// Re-export for convenience
export { UGANDAN_CLASS_PRESETS, COMMON_STREAM_NAMES };
export type {
  ClassWithStats,
  ClassStudentSummary,
  ClassFormData,
  AddStudentToClassData,
};

interface UseClassManagementOptions {
  useMockData?: boolean;
}

interface UseClassManagementReturn {
  // Data
  classes: ClassWithStats[];
  selectedClass: ClassWithStats | null;
  students: ClassStudentSummary[];
  studentsByClass: Record<string, ClassStudentSummary[]>;

  // Loading states
  isLoading: boolean;
  isLoadingStudents: boolean;
  isSaving: boolean;

  // Error
  error: string | null;

  // Actions
  selectClass: (classId: string | null) => void;
  refreshClasses: () => Promise<void>;
  refreshStudents: () => Promise<void>;
  loadStudentsForClass: (classId: string) => Promise<void>;

  // Class CRUD
  createClass: (data: ClassFormData) => Promise<string>;
  updateClassData: (
    classId: string,
    data: Partial<ClassFormData>,
  ) => Promise<void>;

  // Student CRUD
  addStudent: (data: AddStudentToClassData) => Promise<string>;
  updateStudentData: (
    studentId: string,
    data: Partial<AddStudentToClassData>,
  ) => Promise<void>;
  moveStudent: (
    studentId: string,
    newClassId: string,
    newClassName: string,
    newStreamId?: string,
    newStreamName?: string,
  ) => Promise<void>;

  // Filters
  filterStudents: (filters: StudentFilters) => void;
  clearFilters: () => void;
  filters: StudentFilters;

  // Statistics
  getClassStats: (classId: string) => ClassWithStats | undefined;
  getClassById: (classId: string) => ClassWithStats | undefined;
  getTotalStats: () => TotalStats;
}

interface StudentFilters {
  streamId?: string;
  paymentStatus?: PaymentStatus;
  search?: string;
}

interface TotalStats {
  totalClasses: number;
  totalStudents: number;
  totalFees: number;
  totalCollected: number;
  overallCollectionRate: number;
}

export function useClassManagement(
  options: UseClassManagementOptions = {},
): UseClassManagementReturn {
  const { useMockData = true } = options;
  const { user } = useFirebaseAuth();

  const [classes, setClasses] = useState<ClassWithStats[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassWithStats | null>(
    null,
  );
  const [students, setStudents] = useState<ClassStudentSummary[]>([]);
  const [studentsByClass, setStudentsByClass] = useState<
    Record<string, ClassStudentSummary[]>
  >({});
  const [filters, setFilters] = useState<StudentFilters>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load classes
  const loadClasses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let data: ClassWithStats[];

      if (useMockData || !user?.schoolId) {
        data = getMockClassesWithStats();
      } else {
        data = await getClassesWithStats(user.schoolId);
      }

      setClasses(data);
    } catch (err) {
      console.error("Error loading classes:", err);
      setError("Failed to load classes");
      // Fallback to mock data
      setClasses(getMockClassesWithStats());
    } finally {
      setIsLoading(false);
    }
  }, [useMockData, user?.schoolId]);

  // Load students for selected class
  const loadStudents = useCallback(async () => {
    if (!selectedClass) {
      setStudents([]);
      return;
    }

    setIsLoadingStudents(true);
    setError(null);

    try {
      let data: ClassStudentSummary[];

      if (useMockData || !user?.schoolId) {
        data = getMockStudentsForClass(
          selectedClass.id,
          selectedClass.name,
          selectedClass.streams,
        );

        // Apply filters locally for mock data
        if (filters.streamId) {
          data = data.filter((s) => s.streamName === filters.streamId);
        }
        if (filters.paymentStatus) {
          data = data.filter((s) => s.paymentStatus === filters.paymentStatus);
        }
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          data = data.filter(
            (s) =>
              s.firstName.toLowerCase().includes(searchLower) ||
              s.lastName.toLowerCase().includes(searchLower) ||
              s.studentId.toLowerCase().includes(searchLower) ||
              s.guardianPhone.includes(filters.search!),
          );
        }
      } else {
        data = await getStudentsForClass(
          user.schoolId,
          selectedClass.id,
          filters,
        );
      }

      setStudents(data);
    } catch (err) {
      console.error("Error loading students:", err);
      setError("Failed to load students");
      setStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  }, [selectedClass, filters, useMockData, user?.schoolId]);

  // Initial load
  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  // Load students when class or filters change
  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Select a class
  const selectClass = useCallback(
    (classId: string | null) => {
      if (classId === null) {
        setSelectedClass(null);
        setStudents([]);
        return;
      }

      const cls = classes.find((c) => c.id === classId);
      setSelectedClass(cls || null);
      setFilters({});
    },
    [classes],
  );

  // Filter students
  const filterStudents = useCallback((newFilters: StudentFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Create class
  const createClass = useCallback(
    async (data: ClassFormData): Promise<string> => {
      if (!user?.schoolId && !useMockData) {
        throw new Error("No school ID");
      }

      setIsSaving(true);
      setError(null);

      try {
        if (useMockData) {
          // Simulate creation for mock data
          const newId = `class-${Date.now()}`;
          const newClass: ClassWithStats = {
            id: newId,
            name: data.name,
            level: data.level,
            order: data.order,
            streams:
              data.hasStreams && data.streams
                ? data.streams.map((s, i) => ({
                    id: `stream-${newId}-${i}`,
                    name: s.name,
                    classId: newId,
                  }))
                : [],
            totalStudents: 0,
            fullyPaid: 0,
            partial: 0,
            overdue: 0,
            noPay: 0,
            totalFees: 0,
            totalCollected: 0,
            collectionRate: 0,
          };
          setClasses((prev) =>
            [...prev, newClass].sort((a, b) => a.order - b.order),
          );
          return newId;
        }

        const classId = await addClass(user!.schoolId, data);
        await loadClasses();
        return classId;
      } catch (err) {
        console.error("Error creating class:", err);
        setError("Failed to create class");
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [user?.schoolId, useMockData, loadClasses],
  );

  // Update class
  const updateClassData = useCallback(
    async (classId: string, data: Partial<ClassFormData>): Promise<void> => {
      if (!user?.schoolId && !useMockData) {
        throw new Error("No school ID");
      }

      setIsSaving(true);
      setError(null);

      try {
        if (useMockData) {
          // Update locally for mock data
          setClasses((prev) =>
            prev
              .map((c) => {
                if (c.id !== classId) return c;
                return {
                  ...c,
                  name: data.name ?? c.name,
                  level: data.level ?? c.level,
                  order: data.order ?? c.order,
                  streams:
                    data.hasStreams && data.streams
                      ? data.streams.map((s, i) => ({
                          id: `stream-${classId}-${i}`,
                          name: s.name,
                          classId,
                        }))
                      : data.hasStreams === false
                        ? []
                        : c.streams,
                };
              })
              .sort((a, b) => a.order - b.order),
          );

          if (selectedClass?.id === classId) {
            setSelectedClass((prev) =>
              prev
                ? {
                    ...prev,
                    name: data.name ?? prev.name,
                    level: data.level ?? prev.level,
                    order: data.order ?? prev.order,
                    streams:
                      data.hasStreams && data.streams
                        ? data.streams.map((s, i) => ({
                            id: `stream-${classId}-${i}`,
                            name: s.name,
                            classId,
                          }))
                        : data.hasStreams === false
                          ? []
                          : prev.streams,
                  }
                : null,
            );
          }
          return;
        }

        await updateClass(user!.schoolId, classId, data);
        await loadClasses();
      } catch (err) {
        console.error("Error updating class:", err);
        setError("Failed to update class");
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [user?.schoolId, useMockData, loadClasses, selectedClass],
  );

  // Add student
  const addStudent = useCallback(
    async (data: AddStudentToClassData): Promise<string> => {
      if (!user?.schoolId && !useMockData) {
        throw new Error("No school ID");
      }

      setIsSaving(true);
      setError(null);

      try {
        if (useMockData) {
          // Add locally for mock data
          const newId = `student-${Date.now()}`;
          const newStudent: ClassStudentSummary = {
            id: newId,
            studentId: `EDU-2026-${String(Date.now()).slice(-4)}-${data.className.replace(".", "")}`,
            firstName: data.firstName,
            lastName: data.lastName,
            streamName: data.streamName,
            gender: data.gender,
            guardianName: data.guardianName,
            guardianPhone: data.guardianPhone,
            totalFees: 0,
            amountPaid: 0,
            balance: 0,
            paymentStatus: "no_payment",
            boardingStatus: data.boardingStatus,
          };

          if (selectedClass?.id === data.classId) {
            setStudents((prev) =>
              [...prev, newStudent].sort((a, b) =>
                a.lastName.localeCompare(b.lastName),
              ),
            );
          }

          // Update class stats
          setClasses((prev) =>
            prev.map((c) => {
              if (c.id !== data.classId) return c;
              return {
                ...c,
                totalStudents: c.totalStudents + 1,
                noPay: c.noPay + 1,
              };
            }),
          );

          return newId;
        }

        const studentId = await addStudentToClass(user!.schoolId, data);
        await loadStudents();
        await loadClasses();
        return studentId;
      } catch (err) {
        console.error("Error adding student:", err);
        setError("Failed to add student");
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [user?.schoolId, useMockData, loadStudents, loadClasses, selectedClass],
  );

  // Update student
  const updateStudentData = useCallback(
    async (
      studentId: string,
      data: Partial<AddStudentToClassData>,
    ): Promise<void> => {
      setIsSaving(true);
      setError(null);

      try {
        if (useMockData) {
          // Update locally for mock data
          setStudents((prev) =>
            prev
              .map((s) => {
                if (s.id !== studentId) return s;
                return {
                  ...s,
                  firstName: data.firstName ?? s.firstName,
                  lastName: data.lastName ?? s.lastName,
                  streamName: data.streamName ?? s.streamName,
                  gender: data.gender ?? s.gender,
                  guardianName: data.guardianName ?? s.guardianName,
                  guardianPhone: data.guardianPhone ?? s.guardianPhone,
                  boardingStatus: data.boardingStatus ?? s.boardingStatus,
                };
              })
              .sort((a, b) => a.lastName.localeCompare(b.lastName)),
          );
          return;
        }

        await updateStudent(studentId, data);
        await loadStudents();
      } catch (err) {
        console.error("Error updating student:", err);
        setError("Failed to update student");
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [useMockData, loadStudents],
  );

  // Move student to different class
  const moveStudent = useCallback(
    async (
      studentId: string,
      newClassId: string,
      newClassName: string,
      newStreamId?: string,
      newStreamName?: string,
    ): Promise<void> => {
      setIsSaving(true);
      setError(null);

      try {
        if (useMockData) {
          // Remove from current class view
          setStudents((prev) => prev.filter((s) => s.id !== studentId));
          // Update class stats (simplified)
          await loadClasses();
          return;
        }

        await moveStudentToClass(
          studentId,
          newClassId,
          newClassName,
          newStreamId,
          newStreamName,
        );
        await loadStudents();
        await loadClasses();
      } catch (err) {
        console.error("Error moving student:", err);
        setError("Failed to move student");
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [useMockData, loadStudents, loadClasses],
  );

  // Get stats for a specific class
  const getClassStats = useCallback(
    (classId: string): ClassWithStats | undefined => {
      return classes.find((c) => c.id === classId);
    },
    [classes],
  );

  // Get class by ID (alias for getClassStats)
  const getClassById = useCallback(
    (classId: string): ClassWithStats | undefined => {
      return classes.find((c) => c.id === classId);
    },
    [classes],
  );

  // Load students for a specific class (by classId)
  const loadStudentsForClass = useCallback(
    async (classId: string): Promise<void> => {
      const cls = classes.find((c) => c.id === classId);
      if (!cls) return;

      setIsLoadingStudents(true);
      setError(null);

      try {
        let data: ClassStudentSummary[];

        if (useMockData || !user?.schoolId) {
          data = getMockStudentsForClass(classId, cls.name, cls.streams);
        } else {
          data = await getStudentsForClass(user.schoolId, classId, {});
        }

        setStudentsByClass((prev) => ({ ...prev, [classId]: data }));
        setStudents(data);
        setSelectedClass(cls);
      } catch (err) {
        console.error("Error loading students for class:", err);
        setError("Failed to load students");
      } finally {
        setIsLoadingStudents(false);
      }
    },
    [classes, useMockData, user?.schoolId],
  );

  // Get total stats across all classes
  const getTotalStats = useCallback((): TotalStats => {
    const totalStudents = classes.reduce((sum, c) => sum + c.totalStudents, 0);
    const totalFees = classes.reduce((sum, c) => sum + c.totalFees, 0);
    const totalCollected = classes.reduce(
      (sum, c) => sum + c.totalCollected,
      0,
    );

    return {
      totalClasses: classes.length,
      totalStudents,
      totalFees,
      totalCollected,
      overallCollectionRate:
        totalFees > 0 ? Math.round((totalCollected / totalFees) * 100) : 0,
    };
  }, [classes]);

  return {
    classes,
    selectedClass,
    students,
    studentsByClass,
    isLoading,
    isLoadingStudents,
    isSaving,
    error,
    selectClass,
    refreshClasses: loadClasses,
    refreshStudents: loadStudents,
    loadStudentsForClass,
    createClass,
    updateClassData,
    addStudent,
    updateStudentData,
    moveStudent,
    filterStudents,
    clearFilters,
    filters,
    getClassStats,
    getClassById,
    getTotalStats,
  };
}

export default useClassManagement;
