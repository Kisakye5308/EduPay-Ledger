'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, StatsCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { PaymentStatusBadge, Badge } from '@/components/ui/Badge';
import { FilterChip } from '@/components/ui/Chip';
import { Table, Pagination } from '@/components/ui/Table';
import { formatUGX } from '@/lib/utils';
import type { PaymentStatus } from '@/types/student';

// Mock data
const mockStudents = [
  {
    id: '1',
    name: 'John Mukasa',
    studentId: '2024001',
    className: 'P.7',
    streamName: 'Blue',
    paymentStatus: 'fully_paid' as PaymentStatus,
    balance: 0,
    initials: 'JM',
  },
  {
    id: '2',
    name: 'Sarah Namono',
    studentId: '2024045',
    className: 'P.6',
    streamName: 'Red',
    paymentStatus: 'partial' as PaymentStatus,
    balance: 150000,
    initials: 'SN',
  },
  {
    id: '3',
    name: 'David Okello',
    studentId: '2024089',
    className: 'P.7',
    streamName: 'Blue',
    paymentStatus: 'overdue' as PaymentStatus,
    balance: 450000,
    initials: 'DO',
  },
  {
    id: '4',
    name: 'Grace Atieno',
    studentId: '2024112',
    className: 'P.5',
    streamName: 'Green',
    paymentStatus: 'fully_paid' as PaymentStatus,
    balance: 0,
    initials: 'GA',
  },
  {
    id: '5',
    name: 'Peter Ssemwanga',
    studentId: '2024205',
    className: 'P.6',
    streamName: 'Red',
    paymentStatus: 'partial' as PaymentStatus,
    balance: 75000,
    initials: 'PS',
  },
];

export default function StudentsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    class: 'All',
    stream: 'All',
    status: 'All',
  });

  const columns = [
    {
      key: 'name',
      header: 'Student Name & ID',
      render: (student: typeof mockStudents[0]) => (
        <div className="flex items-center gap-3">
          <Avatar name={student.name} size="md" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {student.name}
            </span>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-tighter">
              ID: {student.studentId}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class / Stream',
      render: (student: typeof mockStudents[0]) => (
        <div className="flex gap-2">
          <Badge variant="default">{student.className}</Badge>
          <Badge variant="default">{student.streamName}</Badge>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Payment Status',
      render: (student: typeof mockStudents[0]) => (
        <PaymentStatusBadge status={student.paymentStatus} />
      ),
    },
    {
      key: 'balance',
      header: 'Outstanding Balance',
      align: 'right' as const,
      render: (student: typeof mockStudents[0]) => (
        <span className={`font-mono text-sm font-bold ${
          student.balance > 0 && student.paymentStatus === 'overdue' 
            ? 'text-status-red' 
            : 'text-gray-900 dark:text-white'
        }`}>
          {formatUGX(student.balance)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: (student: typeof mockStudents[0]) => (
        <Link 
          href={`/students/${student.id}`}
          className="text-primary dark:text-blue-400 text-sm font-bold hover:underline"
        >
          View Details
        </Link>
      ),
    },
  ];

  return (
    <div className="p-4 lg:p-8 bg-background-light dark:bg-background-dark min-h-full">
      {/* Page Heading */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-4xl font-black text-primary dark:text-white tracking-tight">
            Student Directory
          </h1>
          <p className="text-gray-500 mt-1">
            Manage and track fee payments for 1,240 students in the system
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            icon={<span className="material-symbols-outlined text-xl">download</span>}
          >
            Export Data
          </Button>
          <Link href="/students/add">
            <Button
              variant="primary"
              icon={<span className="material-symbols-outlined text-xl">person_add</span>}
            >
              Add Student
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Section */}
      <Card padding="sm" className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="material-symbols-outlined text-gray-500">filter_list</span>
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Quick Filters
          </span>
        </div>
        <div className="flex gap-3 flex-wrap">
          <FilterChip
            label="Class"
            value={filters.class}
            onClick={() => {}}
          />
          <FilterChip
            label="Stream"
            value={filters.stream}
            onClick={() => {}}
          />
          <FilterChip
            label="Balance Status"
            value={filters.status}
            onClick={() => {}}
          />
          <div className="h-10 w-px bg-gray-200 dark:bg-gray-700 mx-2 hidden sm:block" />
          <button className="flex h-10 shrink-0 items-center justify-center px-4 rounded-lg text-primary dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
            Reset Filters
          </button>
        </div>
      </Card>

      {/* Table */}
      <Table
        columns={columns}
        data={mockStudents}
        keyExtractor={(student) => student.id}
        onRowClick={(student) => console.log('Clicked:', student)}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={25}
        totalItems={1240}
        itemsPerPage={5}
        onPageChange={setCurrentPage}
      />

      {/* Summary Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Outstanding"
          value="UGX 12,450,000"
          icon="verified_user"
          variant="primary"
        />
        <StatsCard
          title="Collected This Term"
          value="UGX 84,200,000"
          icon="payments"
          variant="success"
        />
        <StatsCard
          title="Overdue Accounts"
          value="14 Students"
          icon="warning"
          variant="danger"
        />
      </div>
    </div>
  );
}
