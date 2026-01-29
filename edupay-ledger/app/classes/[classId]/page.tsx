"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { formatUGX } from "@/lib/utils";
import {
  useClassManagement,
  type ClassStudentSummary,
  type AddStudentToClassData,
} from "@/hooks/useClassManagement";
import type { PaymentStatus } from "@/types/student";

// ============================================================================
// STUDENT TABLE ROW COMPONENT
// ============================================================================

interface StudentRowProps {
  student: ClassStudentSummary;
  onEdit: (student: ClassStudentSummary) => void;
  onViewPayments: (student: ClassStudentSummary) => void;
}

function StudentRow({ student, onEdit, onViewPayments }: StudentRowProps) {
  const getStatusBadge = (status: PaymentStatus) => {
    const styles: Record<PaymentStatus, string> = {
      fully_paid:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      partial:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      no_payment:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
    };
    const labels: Record<PaymentStatus, string> = {
      fully_paid: "Paid",
      partial: "Partial",
      overdue: "Overdue",
      no_payment: "No Payment",
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold text-sm">
              {student.firstName[0]}
              {student.lastName[0]}
            </span>
          </div>
          <div>
            <p className="font-medium text-slate-800 dark:text-white">
              {student.firstName} {student.lastName}
            </p>
            <p className="text-xs text-slate-500">{student.studentId}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <span className="text-slate-600 dark:text-slate-400">
          {student.streamName || "—"}
        </span>
      </td>
      <td className="py-4 px-4">{getStatusBadge(student.paymentStatus)}</td>
      <td className="py-4 px-4">
        <span className="font-medium text-slate-800 dark:text-white">
          {formatUGX(student.totalFees)}
        </span>
      </td>
      <td className="py-4 px-4">
        <span className="text-emerald-600 font-medium">
          {formatUGX(student.amountPaid)}
        </span>
      </td>
      <td className="py-4 px-4">
        <span
          className={`font-medium ${student.balance > 0 ? "text-red-600" : "text-emerald-600"}`}
        >
          {formatUGX(student.balance)}
        </span>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(student)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-primary transition-colors"
            title="Edit Student"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <button
            onClick={() => onViewPayments(student)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-primary transition-colors"
            title="View Payments"
          >
            <span className="material-symbols-outlined text-lg">
              receipt_long
            </span>
          </button>
          <Link
            href={`/students/${student.id}`}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-primary transition-colors"
            title="View Profile"
          >
            <span className="material-symbols-outlined text-lg">person</span>
          </Link>
        </div>
      </td>
    </tr>
  );
}

// ============================================================================
// STATS CARD COMPONENT
// ============================================================================

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconBg: string;
  iconColor: string;
}

function StatsCard({ title, value, icon, iconBg, iconColor }: StatsCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-xl font-bold text-primary dark:text-white mt-1">
            {value}
          </p>
        </div>
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <span className={`material-symbols-outlined text-lg ${iconColor}`}>
            {icon}
          </span>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// EDIT STUDENT MODAL
// ============================================================================

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: ClassStudentSummary | null;
  classStreams: string[];
  onSave: (updates: Partial<AddStudentToClassData>) => Promise<void>;
  isSaving: boolean;
}

function EditStudentModal({
  isOpen,
  onClose,
  student,
  classStreams,
  onSave,
  isSaving,
}: EditStudentModalProps) {
  const [formData, setFormData] = useState<Partial<AddStudentToClassData>>({});

  React.useEffect(() => {
    if (student) {
      setFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        gender: student.gender,
        streamName: student.streamName,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        boardingStatus: student.boardingStatus,
      });
    }
  }, [student]);

  if (!student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Student Details"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={formData.firstName || ""}
            onChange={(e) =>
              setFormData((prev: Partial<AddStudentToClassData>) => ({
                ...prev,
                firstName: e.target.value,
              }))
            }
            required
          />
          <Input
            label="Last Name"
            value={formData.lastName || ""}
            onChange={(e) =>
              setFormData((prev: Partial<AddStudentToClassData>) => ({
                ...prev,
                lastName: e.target.value,
              }))
            }
            required
          />
          <Select
            label="Gender"
            value={formData.gender || ""}
            onChange={(e) =>
              setFormData((prev: Partial<AddStudentToClassData>) => ({
                ...prev,
                gender: e.target.value as "male" | "female",
              }))
            }
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />
          {classStreams.length > 0 && (
            <Select
              label="Stream (Optional)"
              value={formData.streamName || ""}
              onChange={(e) =>
                setFormData((prev: Partial<AddStudentToClassData>) => ({
                  ...prev,
                  streamName: e.target.value || undefined,
                }))
              }
              options={[
                { value: "", label: "No Stream" },
                ...classStreams.map((s) => ({ value: s, label: s })),
              ]}
            />
          )}
          <Input
            label="Guardian Name"
            value={formData.guardianName || ""}
            onChange={(e) =>
              setFormData((prev: Partial<AddStudentToClassData>) => ({
                ...prev,
                guardianName: e.target.value,
              }))
            }
          />
          <Input
            label="Guardian Contact"
            value={formData.guardianPhone || ""}
            onChange={(e) =>
              setFormData((prev: Partial<AddStudentToClassData>) => ({
                ...prev,
                guardianPhone: e.target.value,
              }))
            }
          />
          <Select
            label="Boarding Status"
            value={formData.boardingStatus || ""}
            onChange={(e) =>
              setFormData((prev: Partial<AddStudentToClassData>) => ({
                ...prev,
                boardingStatus: (e.target.value || undefined) as
                  | "day"
                  | "boarding"
                  | "half_boarding"
                  | undefined,
              }))
            }
            options={[
              { value: "", label: "Not Specified" },
              { value: "day", label: "Day Scholar" },
              { value: "boarding", label: "Boarding" },
              { value: "half_boarding", label: "Half Boarding" },
            ]}
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================================
// ADD STUDENT MODAL
// ============================================================================

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  classStreams: string[];
  onAdd: (data: AddStudentToClassData) => Promise<void>;
  isSaving: boolean;
}

function AddStudentModal({
  isOpen,
  onClose,
  classId,
  className,
  classStreams,
  onAdd,
  isSaving,
}: AddStudentModalProps) {
  const [formData, setFormData] = useState<Partial<AddStudentToClassData>>({
    firstName: "",
    lastName: "",
    gender: "male",
    guardianName: "",
    guardianPhone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAdd({
      ...formData,
      classId,
      className,
      firstName: formData.firstName || "",
      lastName: formData.lastName || "",
      gender: formData.gender || "male",
      guardianName: formData.guardianName || "",
      guardianPhone: formData.guardianPhone || "",
    } as AddStudentToClassData);
    setFormData({
      firstName: "",
      lastName: "",
      gender: "male",
      guardianName: "",
      guardianPhone: "",
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Student to ${className}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={formData.firstName || ""}
            onChange={(e) =>
              setFormData((prev: Partial<AddStudentToClassData>) => ({
                ...prev,
                firstName: e.target.value,
              }))
            }
            required
          />
          <Input
            label="Last Name"
            value={formData.lastName || ""}
            onChange={(e) =>
              setFormData((prev: Partial<AddStudentToClassData>) => ({
                ...prev,
                lastName: e.target.value,
              }))
            }
            required
          />
          <Select
            label="Gender"
            value={formData.gender || "male"}
            onChange={(e) =>
              setFormData((prev: Partial<AddStudentToClassData>) => ({
                ...prev,
                gender: e.target.value as "male" | "female",
              }))
            }
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />
          {classStreams.length > 0 && (
            <Select
              label="Stream (Optional)"
              value={formData.streamName || ""}
              onChange={(e) =>
                setFormData((prev: Partial<AddStudentToClassData>) => ({
                  ...prev,
                  streamName: e.target.value || undefined,
                }))
              }
              options={[
                { value: "", label: "No Stream" },
                ...classStreams.map((s) => ({ value: s, label: s })),
              ]}
            />
          )}
          <Input
            label="Guardian Name"
            value={formData.guardianName || ""}
            onChange={(e) =>
              setFormData((prev: Partial<AddStudentToClassData>) => ({
                ...prev,
                guardianName: e.target.value,
              }))
            }
            required
          />
          <Input
            label="Guardian Contact"
            value={formData.guardianPhone || ""}
            onChange={(e) =>
              setFormData((prev: Partial<AddStudentToClassData>) => ({
                ...prev,
                guardianPhone: e.target.value,
              }))
            }
            required
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              !formData.firstName ||
              !formData.lastName ||
              !formData.guardianName ||
              !formData.guardianPhone ||
              isSaving
            }
          >
            {isSaving ? "Adding..." : "Add Student"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ClassDetailPage({
  params,
}: {
  params: { classId: string };
}) {
  const classId = params.classId;

  const {
    classes,
    students,
    isLoading,
    isSaving,
    error,
    loadStudentsForClass,
    addStudent,
    updateStudentData,
    getClassById,
  } = useClassManagement({ useMockData: true });

  const [editingStudent, setEditingStudent] =
    useState<ClassStudentSummary | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [streamFilter, setStreamFilter] = useState<string>("all");

  React.useEffect(() => {
    if (classId && classes.length > 0) {
      loadStudentsForClass(classId);
    }
  }, [classId, classes.length, loadStudentsForClass]);

  const classData = getClassById(classId);

  const filteredStudents = useMemo(() => {
    return students.filter((student: ClassStudentSummary) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        student.firstName.toLowerCase().includes(searchLower) ||
        student.lastName.toLowerCase().includes(searchLower) ||
        student.studentId.toLowerCase().includes(searchLower);
      const matchesStatus =
        statusFilter === "all" || student.paymentStatus === statusFilter;
      const matchesStream =
        streamFilter === "all" ||
        (streamFilter === "none" && !student.streamName) ||
        student.streamName === streamFilter;
      return matchesSearch && matchesStatus && matchesStream;
    });
  }, [students, searchQuery, statusFilter, streamFilter]);

  const stats = useMemo(() => {
    const totalStudents = students.length;
    const totalFees = students.reduce(
      (sum: number, s: ClassStudentSummary) => sum + s.totalFees,
      0,
    );
    const totalPaid = students.reduce(
      (sum: number, s: ClassStudentSummary) => sum + s.amountPaid,
      0,
    );
    const totalBalance = totalFees - totalPaid;
    const collectionRate =
      totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0;
    return {
      totalStudents,
      totalFees,
      totalPaid,
      totalBalance,
      collectionRate,
    };
  }, [students]);

  const handleSaveStudent = async (updates: Partial<AddStudentToClassData>) => {
    if (editingStudent) {
      await updateStudentData(editingStudent.id, updates);
      setEditingStudent(null);
    }
  };

  const handleAddStudent = async (data: AddStudentToClassData) => {
    await addStudent(data);
  };

  const handleViewPayments = (student: ClassStudentSummary) => {
    window.location.href = `/students/${student.id}?tab=payments`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl"
                />
              ))}
            </div>
            <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">
              error
            </span>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">
              Class not found
            </h3>
            <p className="text-slate-500 mt-2 mb-4">
              The class you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link href="/classes">
              <Button>Back to Classes</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const classStreams = classData.streams.map((s: { name: string }) => s.name);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/classes"
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined text-slate-500">
                arrow_back
              </span>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-primary dark:text-white flex items-center gap-3">
                {classData.name}
                <Badge className="bg-primary/10 text-primary">
                  {classData.level}
                </Badge>
              </h1>
              <p className="text-slate-500 mt-1">
                {classStreams.length > 0
                  ? `Streams: ${classStreams.join(", ")}`
                  : "No streams configured"}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => loadStudentsForClass(classId)}
            >
              <span className="material-symbols-outlined text-sm mr-1">
                refresh
              </span>
              Refresh
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <span className="material-symbols-outlined text-sm mr-1">
                person_add
              </span>
              Add Student
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">
              error
            </span>
            <span className="text-red-700 dark:text-red-400">{error}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Total Students"
            value={stats.totalStudents}
            icon="groups"
            iconBg="bg-blue-100 dark:bg-blue-900/30"
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Total Fees"
            value={formatUGX(stats.totalFees)}
            icon="account_balance"
            iconBg="bg-amber-100 dark:bg-amber-900/30"
            iconColor="text-amber-600"
          />
          <StatsCard
            title="Collected"
            value={formatUGX(stats.totalPaid)}
            icon="payments"
            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            iconColor="text-emerald-600"
          />
          <StatsCard
            title="Balance"
            value={formatUGX(stats.totalBalance)}
            icon="account_balance_wallet"
            iconBg="bg-red-100 dark:bg-red-900/30"
            iconColor="text-red-600"
          />
          <StatsCard
            title="Collection Rate"
            value={`${stats.collectionRate}%`}
            icon="trending_up"
            iconBg="bg-purple-100 dark:bg-purple-900/30"
            iconColor="text-purple-600"
          />
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search by name or student ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "fully_paid", label: "Fully Paid" },
                { value: "partial", label: "Partial Payment" },
                { value: "overdue", label: "Overdue" },
                { value: "no_payment", label: "No Payment" },
              ]}
              className="w-full sm:w-48"
            />
            {classStreams.length > 0 && (
              <Select
                value={streamFilter}
                onChange={(e) => setStreamFilter(e.target.value)}
                options={[
                  { value: "all", label: "All Streams" },
                  { value: "none", label: "No Stream" },
                  ...classStreams.map((s: string) => ({
                    value: s,
                    label: `Stream ${s}`,
                  })),
                ]}
                className="w-full sm:w-40"
              />
            )}
          </div>
        </Card>

        {/* Students Table */}
        <Card className="overflow-hidden">
          <CardTitle className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-0">
            Students ({filteredStudents.length})
          </CardTitle>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">
                person_search
              </span>
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">
                {students.length === 0
                  ? "No students in this class"
                  : "No students match your filters"}
              </h3>
              <p className="text-slate-500 mt-2 mb-4">
                {students.length === 0
                  ? "Add students to get started"
                  : "Try adjusting your search or filter criteria"}
              </p>
              {students.length === 0 && (
                <Button onClick={() => setShowAddModal(true)}>
                  Add Student
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Stream
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Total Fees
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Paid
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student: ClassStudentSummary) => (
                    <StudentRow
                      key={student.id}
                      student={student}
                      onEdit={setEditingStudent}
                      onViewPayments={handleViewPayments}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <EditStudentModal
          isOpen={editingStudent !== null}
          onClose={() => setEditingStudent(null)}
          student={editingStudent}
          classStreams={classStreams}
          onSave={handleSaveStudent}
          isSaving={isSaving}
        />

        <AddStudentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          classId={classId}
          className={classData.name}
          classStreams={classStreams}
          onAdd={handleAddStudent}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
