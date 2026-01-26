/**
 * useStudents Hook
 * 
 * Custom hook for managing students data, filtering, and pagination
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { PaymentStatus } from '@/types/student';

// Student type for the hook (simplified for frontend use)
export interface StudentListItem {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  photo?: string;
  className: string;
  streamName?: string;
  paymentStatus: PaymentStatus;
  totalFees: number;
  amountPaid: number;
  balance: number;
  guardianName: string;
  guardianPhone: string;
  lastPaymentDate?: Date;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
}

export interface StudentFilters {
  search: string;
  className: string;
  streamName: string;
  paymentStatus: string;
  sortBy: 'name' | 'balance' | 'className' | 'lastPayment';
  sortOrder: 'asc' | 'desc';
}

export interface StudentStats {
  totalStudents: number;
  activeStudents: number;
  totalOutstanding: number;
  totalCollected: number;
  fullyPaidCount: number;
  partialCount: number;
  overdueCount: number;
  noPaymentCount: number;
}

interface UseStudentsOptions {
  pageSize?: number;
  useMockData?: boolean;
  schoolId?: string;
}

interface UseStudentsReturn {
  students: StudentListItem[];
  stats: StudentStats;
  filters: StudentFilters;
  setFilters: (filters: Partial<StudentFilters>) => void;
  resetFilters: () => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  setCurrentPage: (page: number) => void;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  availableClasses: string[];
  availableStreams: string[];
}

// Mock data for development
const mockStudentsData: StudentListItem[] = [
  {
    id: '1',
    studentId: 'EDU-2024-001-SM',
    firstName: 'John',
    lastName: 'Mukasa',
    className: 'P.7',
    streamName: 'Blue',
    paymentStatus: 'fully_paid',
    totalFees: 1450000,
    amountPaid: 1450000,
    balance: 0,
    guardianName: 'Mr. Peter Mukasa',
    guardianPhone: '+256772123456',
    lastPaymentDate: new Date('2024-09-10'),
    status: 'active',
  },
  {
    id: '2',
    studentId: 'EDU-2024-045-SM',
    firstName: 'Sarah',
    lastName: 'Namono',
    className: 'P.6',
    streamName: 'Red',
    paymentStatus: 'partial',
    totalFees: 1450000,
    amountPaid: 1300000,
    balance: 150000,
    guardianName: 'Mrs. Grace Namono',
    guardianPhone: '+256782234567',
    lastPaymentDate: new Date('2024-09-05'),
    status: 'active',
  },
  {
    id: '3',
    studentId: 'EDU-2024-089-SM',
    firstName: 'David',
    lastName: 'Okello',
    className: 'P.7',
    streamName: 'Blue',
    paymentStatus: 'overdue',
    totalFees: 1450000,
    amountPaid: 1000000,
    balance: 450000,
    guardianName: 'Mr. James Okello',
    guardianPhone: '+256752345678',
    lastPaymentDate: new Date('2024-07-15'),
    status: 'active',
  },
  {
    id: '4',
    studentId: 'EDU-2024-112-SM',
    firstName: 'Grace',
    lastName: 'Atieno',
    className: 'P.5',
    streamName: 'Green',
    paymentStatus: 'fully_paid',
    totalFees: 1350000,
    amountPaid: 1350000,
    balance: 0,
    guardianName: 'Mrs. Mary Atieno',
    guardianPhone: '+256762456789',
    lastPaymentDate: new Date('2024-09-12'),
    status: 'active',
  },
  {
    id: '5',
    studentId: 'EDU-2024-205-SM',
    firstName: 'Peter',
    lastName: 'Ssemwanga',
    className: 'P.6',
    streamName: 'Red',
    paymentStatus: 'partial',
    totalFees: 1450000,
    amountPaid: 1375000,
    balance: 75000,
    guardianName: 'Mr. Robert Ssemwanga',
    guardianPhone: '+256702567890',
    lastPaymentDate: new Date('2024-09-08'),
    status: 'active',
  },
  {
    id: '6',
    studentId: 'EDU-2024-156-SM',
    firstName: 'Faith',
    lastName: 'Nakamya',
    className: 'P.4',
    streamName: 'Yellow',
    paymentStatus: 'no_payment',
    totalFees: 1250000,
    amountPaid: 0,
    balance: 1250000,
    guardianName: 'Mrs. Rose Nakamya',
    guardianPhone: '+256712678901',
    status: 'active',
  },
  {
    id: '7',
    studentId: 'EDU-2024-178-SM',
    firstName: 'Kevin',
    lastName: 'Ochieng',
    className: 'P.3',
    streamName: 'Green',
    paymentStatus: 'partial',
    totalFees: 1150000,
    amountPaid: 800000,
    balance: 350000,
    guardianName: 'Mr. Daniel Ochieng',
    guardianPhone: '+256722789012',
    lastPaymentDate: new Date('2024-08-20'),
    status: 'active',
  },
  {
    id: '8',
    studentId: 'EDU-2024-234-SM',
    firstName: 'Amelia',
    lastName: 'Namutebi',
    className: 'P.2',
    streamName: 'Blue',
    paymentStatus: 'fully_paid',
    totalFees: 1050000,
    amountPaid: 1050000,
    balance: 0,
    guardianName: 'Mrs. Jane Namutebi',
    guardianPhone: '+256732890123',
    lastPaymentDate: new Date('2024-09-01'),
    status: 'active',
  },
  {
    id: '9',
    studentId: 'EDU-2024-267-SM',
    firstName: 'Michael',
    lastName: 'Wasswa',
    className: 'P.1',
    streamName: 'Red',
    paymentStatus: 'overdue',
    totalFees: 950000,
    amountPaid: 500000,
    balance: 450000,
    guardianName: 'Mr. Joseph Wasswa',
    guardianPhone: '+256742901234',
    lastPaymentDate: new Date('2024-06-30'),
    status: 'active',
  },
  {
    id: '10',
    studentId: 'EDU-2024-301-SM',
    firstName: 'Diana',
    lastName: 'Kizza',
    className: 'P.5',
    streamName: 'Yellow',
    paymentStatus: 'partial',
    totalFees: 1350000,
    amountPaid: 1100000,
    balance: 250000,
    guardianName: 'Mrs. Susan Kizza',
    guardianPhone: '+256752012345',
    lastPaymentDate: new Date('2024-08-28'),
    status: 'active',
  },
  {
    id: '11',
    studentId: 'EDU-2024-345-SM',
    firstName: 'Brian',
    lastName: 'Mugisha',
    photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0CnWYOn8jgUsEOhUTX7qeTe9V1C0bEWnzP9LGgDmV9isuZqckxogBtA06czEVBCXtb4FHQFSCIxjsRJ0oDLM_1gbq8L72FBxdMZJqnY12IBgQxEk9qy6mT1EynTF8w-DYpnctJon298ne5QMe1UEuPIlOdD__r6bx71PWNeAV5rbJVe1wPGSTAvxKyJXhlGqJMCEHpuszOMeLCAPlz72rPiGcga82FNaeEkaZKXbI5V_VTuG1pxGB_Jq3ZRhiP1ppeLE77VQct5s',
    className: 'S.4',
    streamName: 'East',
    paymentStatus: 'partial',
    totalFees: 2500000,
    amountPaid: 1900000,
    balance: 600000,
    guardianName: 'Mrs. Sarah Namugisha',
    guardianPhone: '+256772456789',
    lastPaymentDate: new Date('2024-09-12'),
    status: 'active',
  },
  {
    id: '12',
    studentId: 'EDU-2024-389-SM',
    firstName: 'Patricia',
    lastName: 'Auma',
    className: 'P.7',
    streamName: 'Green',
    paymentStatus: 'fully_paid',
    totalFees: 1450000,
    amountPaid: 1450000,
    balance: 0,
    guardianName: 'Mr. Charles Auma',
    guardianPhone: '+256762123456',
    lastPaymentDate: new Date('2024-09-14'),
    status: 'active',
  },
];

const defaultFilters: StudentFilters = {
  search: '',
  className: 'All',
  streamName: 'All',
  paymentStatus: 'All',
  sortBy: 'name',
  sortOrder: 'asc',
};

export function useStudents(options: UseStudentsOptions = {}): UseStudentsReturn {
  const { pageSize = 10, useMockData = true } = options;

  const [allStudents, setAllStudents] = useState<StudentListItem[]>([]);
  const [filters, setFiltersState] = useState<StudentFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract available filter options
  const availableClasses = useMemo(() => {
    const classes = Array.from(new Set(allStudents.map(s => s.className))).sort((a, b) => {
      // Sort by level (P.1, P.2, ... S.1, S.2, etc.)
      const aNum = parseInt(a.replace(/\D/g, '')) || 0;
      const bNum = parseInt(b.replace(/\D/g, '')) || 0;
      const aPrefix = a.startsWith('S') ? 1 : 0;
      const bPrefix = b.startsWith('S') ? 1 : 0;
      return aPrefix - bPrefix || aNum - bNum;
    });
    return ['All', ...classes];
  }, [allStudents]);

  const availableStreams = useMemo(() => {
    const streams = Array.from(new Set(allStudents.map(s => s.streamName).filter(Boolean) as string[])).sort();
    return ['All', ...streams];
  }, [allStudents]);

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    let result = [...allStudents];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(s => 
        s.firstName.toLowerCase().includes(searchLower) ||
        s.lastName.toLowerCase().includes(searchLower) ||
        s.studentId.toLowerCase().includes(searchLower) ||
        s.guardianName.toLowerCase().includes(searchLower)
      );
    }

    // Apply class filter
    if (filters.className !== 'All') {
      result = result.filter(s => s.className === filters.className);
    }

    // Apply stream filter
    if (filters.streamName !== 'All') {
      result = result.filter(s => s.streamName === filters.streamName);
    }

    // Apply payment status filter
    if (filters.paymentStatus !== 'All') {
      result = result.filter(s => s.paymentStatus === filters.paymentStatus);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'name':
          comparison = `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
          break;
        case 'balance':
          comparison = a.balance - b.balance;
          break;
        case 'className':
          const aNum = parseInt(a.className.replace(/\D/g, '')) || 0;
          const bNum = parseInt(b.className.replace(/\D/g, '')) || 0;
          comparison = aNum - bNum;
          break;
        case 'lastPayment':
          const aDate = a.lastPaymentDate?.getTime() || 0;
          const bDate = b.lastPaymentDate?.getTime() || 0;
          comparison = bDate - aDate;
          break;
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [allStudents, filters]);

  // Calculate stats
  const stats: StudentStats = useMemo(() => {
    const activeStudents = allStudents.filter(s => s.status === 'active');
    return {
      totalStudents: allStudents.length,
      activeStudents: activeStudents.length,
      totalOutstanding: activeStudents.reduce((sum, s) => sum + s.balance, 0),
      totalCollected: activeStudents.reduce((sum, s) => sum + s.amountPaid, 0),
      fullyPaidCount: activeStudents.filter(s => s.paymentStatus === 'fully_paid').length,
      partialCount: activeStudents.filter(s => s.paymentStatus === 'partial').length,
      overdueCount: activeStudents.filter(s => s.paymentStatus === 'overdue').length,
      noPaymentCount: activeStudents.filter(s => s.paymentStatus === 'no_payment').length,
    };
  }, [allStudents]);

  // Paginate
  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (useMockData) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setAllStudents(mockStudentsData);
      } else {
        // TODO: Implement Firebase data fetching
        // const students = await getStudents(schoolId);
        // setAllStudents(students);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setIsLoading(false);
    }
  }, [useMockData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const setFilters = useCallback((newFilters: Partial<StudentFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  return {
    students: paginatedStudents,
    stats,
    filters,
    setFilters,
    resetFilters,
    currentPage,
    totalPages,
    totalItems: filteredStudents.length,
    setCurrentPage,
    isLoading,
    error,
    refresh: loadData,
    availableClasses,
    availableStreams,
  };
}

export default useStudents;
