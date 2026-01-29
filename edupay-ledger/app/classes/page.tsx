"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/Progress";
import { formatUGX } from "@/lib/utils";
import {
  useClassManagement,
  UGANDAN_CLASS_PRESETS,
  COMMON_STREAM_NAMES,
  type ClassWithStats,
  type ClassFormData,
} from "@/hooks/useClassManagement";

// ============================================================================
// SUB-COMPONENTS
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
          <p className="text-2xl font-bold text-primary dark:text-white mt-1">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${iconBg}`}>
          <span className={`material-symbols-outlined text-xl ${iconColor}`}>
            {icon}
          </span>
        </div>
      </div>
    </Card>
  );
}

interface ClassCardProps {
  classData: ClassWithStats;
  onClick: () => void;
}

function ClassCard({ classData, onClick }: ClassCardProps) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case "baby":
      case "nursery":
        return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400";
      case "primary":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "secondary":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  const getCollectionColor = (rate: number) => {
    if (rate >= 80) return "text-emerald-600";
    if (rate >= 50) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200 group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-primary dark:text-white group-hover:text-primary">
            {classData.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={getLevelColor(classData.level)}>
              {classData.level.charAt(0).toUpperCase() +
                classData.level.slice(1)}
            </Badge>
            {classData.streams.length > 0 && (
              <span className="text-xs text-slate-500">
                {classData.streams.length} stream
                {classData.streams.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <span className="material-symbols-outlined text-2xl text-primary">
            school
          </span>
        </div>
      </div>

      {/* Student Count */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-500">Total Students</span>
        <span className="text-lg font-bold text-slate-800 dark:text-white">
          {classData.totalStudents}
        </span>
      </div>

      {/* Payment Status Breakdown */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <p className="text-lg font-bold text-emerald-600">
            {classData.fullyPaid}
          </p>
          <p className="text-xs text-emerald-600">Paid</p>
        </div>
        <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <p className="text-lg font-bold text-amber-600">
            {classData.partial}
          </p>
          <p className="text-xs text-amber-600">Partial</p>
        </div>
        <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-lg font-bold text-red-600">{classData.overdue}</p>
          <p className="text-xs text-red-600">Overdue</p>
        </div>
        <div className="text-center p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <p className="text-lg font-bold text-slate-600 dark:text-slate-400">
            {classData.noPay}
          </p>
          <p className="text-xs text-slate-500">No Pay</p>
        </div>
      </div>

      {/* Collection Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Collection Rate</span>
          <span
            className={`font-bold ${getCollectionColor(classData.collectionRate)}`}
          >
            {classData.collectionRate}%
          </span>
        </div>
        <ProgressBar value={classData.collectionRate} size="sm" />
        <div className="flex justify-between text-xs text-slate-500">
          <span>{formatUGX(classData.totalCollected)}</span>
          <span>{formatUGX(classData.totalFees)}</span>
        </div>
      </div>

      {/* View Details Arrow */}
      <div className="flex items-center justify-end mt-4 text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        <span>View Details</span>
        <span className="material-symbols-outlined text-sm ml-1">
          arrow_forward
        </span>
      </div>
    </Card>
  );
}

// ============================================================================
// ADD CLASS MODAL
// ============================================================================

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClassFormData) => Promise<void>;
  isSaving: boolean;
}

function AddClassModal({
  isOpen,
  onClose,
  onSubmit,
  isSaving,
}: AddClassModalProps) {
  const [formData, setFormData] = useState<ClassFormData>({
    name: "",
    level: "primary",
    order: 1,
    hasStreams: false,
    streams: [],
  });
  const [streamInput, setStreamInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({
      name: "",
      level: "primary",
      order: 1,
      hasStreams: false,
      streams: [],
    });
    setStreamInput("");
    onClose();
  };

  const addStream = (streamName: string) => {
    if (streamName && !formData.streams?.find((s) => s.name === streamName)) {
      setFormData((prev) => ({
        ...prev,
        streams: [...(prev.streams || []), { name: streamName }],
      }));
      setStreamInput("");
    }
  };

  const removeStream = (streamName: string) => {
    setFormData((prev) => ({
      ...prev,
      streams: prev.streams?.filter((s) => s.name !== streamName) || [],
    }));
  };

  const usePreset = (preset: {
    name: string;
    level: "baby" | "nursery" | "primary" | "secondary";
    order: number;
  }) => {
    setFormData((prev) => ({
      ...prev,
      name: preset.name,
      level: preset.level,
      order: preset.order,
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Class" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quick Presets */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Quick Select (Ugandan Classes)
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              ...UGANDAN_CLASS_PRESETS.nursery,
              ...UGANDAN_CLASS_PRESETS.primary,
            ].map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => usePreset(preset)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  formData.name === preset.name
                    ? "bg-primary text-white border-primary"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary"
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Class Name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g., P.1, Baby, S.1"
            required
          />
          <Select
            label="Level"
            value={formData.level}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                level: e.target.value as ClassFormData["level"],
              }))
            }
            options={[
              { value: "baby", label: "Baby Class" },
              { value: "nursery", label: "Nursery" },
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
            ]}
          />
        </div>

        <Input
          label="Display Order"
          type="number"
          value={formData.order}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              order: parseInt(e.target.value) || 1,
            }))
          }
          min={1}
        />

        {/* Streams Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Streams (Optional)
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasStreams}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    hasStreams: e.target.checked,
                    streams: e.target.checked ? prev.streams : [],
                  }))
                }
                className="rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                This class has streams
              </span>
            </label>
          </div>

          {formData.hasStreams && (
            <div className="space-y-3">
              {/* Quick Stream Presets */}
              <div className="flex flex-wrap gap-2">
                {COMMON_STREAM_NAMES.slice(0, 8).map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => addStream(name)}
                    disabled={
                      formData.streams?.find((s) => s.name === name) !==
                      undefined
                    }
                    className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + {name}
                  </button>
                ))}
              </div>

              {/* Custom Stream Input */}
              <div className="flex gap-2">
                <Input
                  value={streamInput}
                  onChange={(e) => setStreamInput(e.target.value)}
                  placeholder="Custom stream name"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => addStream(streamInput)}
                  disabled={!streamInput}
                >
                  Add
                </Button>
              </div>

              {/* Selected Streams */}
              {formData.streams && formData.streams.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  {formData.streams.map((stream) => (
                    <span
                      key={stream.name}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-slate-700 rounded-full text-sm border"
                    >
                      {stream.name}
                      <button
                        type="button"
                        onClick={() => removeStream(stream.name)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <span className="material-symbols-outlined text-sm">
                          close
                        </span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!formData.name || isSaving}>
            {isSaving ? "Adding..." : "Add Class"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ClassesPage() {
  const {
    classes,
    isLoading,
    isSaving,
    error,
    createClass,
    getTotalStats,
    refreshClasses,
  } = useClassManagement({ useMockData: true });

  const [showAddModal, setShowAddModal] = useState(false);
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const stats = getTotalStats();

  const filteredClasses =
    levelFilter === "all"
      ? classes
      : classes.filter((c) => c.level === levelFilter);

  const handleAddClass = async (data: ClassFormData) => {
    await createClass(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary dark:text-white">
              Class Management
            </h1>
            <p className="text-slate-500 mt-1">
              Manage students by class and stream
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={refreshClasses}>
              <span className="material-symbols-outlined text-sm mr-1">
                refresh
              </span>
              Refresh
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <span className="material-symbols-outlined text-sm mr-1">
                add
              </span>
              Add Class
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">
              error
            </span>
            <span className="text-red-700 dark:text-red-400">{error}</span>
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Classes"
            value={stats.totalClasses}
            icon="school"
            iconBg="bg-blue-100 dark:bg-blue-900/30"
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Total Students"
            value={stats.totalStudents.toLocaleString()}
            icon="groups"
            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            iconColor="text-emerald-600"
          />
          <StatsCard
            title="Total Fees"
            value={formatUGX(stats.totalFees)}
            icon="account_balance"
            iconBg="bg-amber-100 dark:bg-amber-900/30"
            iconColor="text-amber-600"
          />
          <StatsCard
            title="Collection Rate"
            value={`${stats.overallCollectionRate}%`}
            icon="trending_up"
            iconBg="bg-purple-100 dark:bg-purple-900/30"
            iconColor="text-purple-600"
          />
        </div>

        {/* Level Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-500 mr-2">Filter by level:</span>
          {["all", "nursery", "primary", "secondary"].map((level) => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                levelFilter === level
                  ? "bg-primary text-white"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {level === "all"
                ? "All Levels"
                : level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>

        {/* Classes Grid */}
        {filteredClasses.length === 0 ? (
          <Card className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">
              school
            </span>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">
              No classes found
            </h3>
            <p className="text-slate-500 mt-2 mb-4">
              {levelFilter === "all"
                ? "Get started by adding your first class"
                : `No ${levelFilter} classes found`}
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <span className="material-symbols-outlined text-sm mr-1">
                add
              </span>
              Add Class
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((classData) => (
              <Link key={classData.id} href={`/classes/${classData.id}`}>
                <ClassCard classData={classData} onClick={() => {}} />
              </Link>
            ))}
          </div>
        )}

        {/* Add Class Modal */}
        <AddClassModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddClass}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
