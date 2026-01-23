import { Timestamp } from 'firebase/firestore';

export interface School {
  id: string;
  name: string;
  type: 'primary' | 'secondary' | 'mixed';
  location: {
    district: string;
    address: string;
  };
  contact: {
    phone: string;
    email: string;
  };
  academicYear: string;
  currentTerm: 1 | 2 | 3;
  classes: SchoolClass[];
  feeStructures: FeeStructure[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SchoolClass {
  id: string;
  name: string; // e.g., "P.1", "S.1", "Baby"
  level: 'baby' | 'nursery' | 'primary' | 'secondary';
  order: number; // For sorting
  streams: Stream[];
  feeStructureId?: string;
}

export interface Stream {
  id: string;
  name: string; // e.g., "North", "South", "Blue", "Red"
  classId: string;
}

export interface FeeStructure {
  id: string;
  name: string;
  totalAmount: number;
  currency: 'UGX';
  term: 1 | 2 | 3;
  academicYear: string;
  classIds: string[]; // Classes this structure applies to
  feeItems: FeeItem[];
  installmentRules: InstallmentRule[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FeeItem {
  id: string;
  name: string; // e.g., "Tuition", "Lab Fee", "Uniform"
  amount: number;
  isOptional: boolean;
}

export interface InstallmentRule {
  id: string;
  order: number;
  name: string; // e.g., "First Installment (Deposit)"
  amount: number;
  percentage: number;
  deadline: Timestamp;
  gracePeriodDays: number;
  penaltyType: 'flat' | 'daily' | 'percentage';
  penaltyAmount: number;
}

// Primary school classes
export const PRIMARY_CLASSES = ['Baby', 'Middle', 'Top', 'P.1', 'P.2', 'P.3', 'P.4', 'P.5', 'P.6', 'P.7'];

// Secondary school classes
export const SECONDARY_CLASSES = ['S.1', 'S.2', 'S.3', 'S.4', 'S.5', 'S.6'];

// All classes
export const ALL_CLASSES = [...PRIMARY_CLASSES, ...SECONDARY_CLASSES];
