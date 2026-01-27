/**
 * Bulk Import Types
 * Types for Excel/CSV student data import
 */

import { ResidenceType } from './residence';

// Import file format
export type ImportFileType = 'excel' | 'csv';

// Import status
export type ImportStatus = 'pending' | 'validating' | 'importing' | 'completed' | 'failed';

// Row validation status
export type RowStatus = 'valid' | 'warning' | 'error' | 'imported' | 'skipped';

// Column mapping for import
export interface ColumnMapping {
  sourceColumn: string;
  targetField: StudentImportField;
  isRequired: boolean;
  transform?: (value: string) => any;
}

// Student import fields
export type StudentImportField = 
  | 'firstName'
  | 'middleName'
  | 'lastName'
  | 'studentId'
  | 'className'
  | 'streamName'
  | 'residenceType'
  | 'guardianName'
  | 'guardianPhone'
  | 'guardianEmail'
  | 'guardianRelation'
  | 'totalFees'
  | 'amountPaid'
  | 'dateOfBirth'
  | 'gender'
  | 'nationality'
  | 'religion'
  | 'address'
  | 'admissionDate'
  | 'previousSchool'
  | 'specialNeeds'
  | 'notes';

// Import row from file
export interface ImportRow {
  rowNumber: number;
  originalData: Record<string, string>;
  mappedData: Partial<StudentImportData>;
  status: RowStatus;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// Validation error
export interface ValidationError {
  field: string;
  message: string;
  value?: string;
}

// Validation warning
export interface ValidationWarning {
  field: string;
  message: string;
  value?: string;
  suggestion?: string;
}

// Student import data (after validation)
export interface StudentImportData {
  // Required fields
  firstName: string;
  lastName: string;
  studentId: string;
  className: string;
  guardianName: string;
  guardianPhone: string;
  
  // Optional fields
  middleName?: string;
  streamName?: string;
  residenceType?: ResidenceType;
  guardianEmail?: string;
  guardianRelation?: string;
  totalFees?: number;
  amountPaid?: number;
  dateOfBirth?: string;
  gender?: 'male' | 'female';
  nationality?: string;
  religion?: string;
  address?: string;
  admissionDate?: string;
  previousSchool?: string;
  specialNeeds?: string;
  notes?: string;
}

// Import configuration
export interface ImportConfig {
  schoolId: string;
  year: number;
  term: string;
  columnMappings: ColumnMapping[];
  skipFirstRow: boolean; // Header row
  duplicateHandling: 'skip' | 'update' | 'error';
  autoAssignFees: boolean;
  defaultResidenceType: ResidenceType;
  defaultClass?: string;
  defaultStream?: string;
}

// Import job
export interface ImportJob {
  id: string;
  schoolId: string;
  fileName: string;
  fileType: ImportFileType;
  status: ImportStatus;
  config: ImportConfig;
  
  // Progress
  totalRows: number;
  processedRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  importedRows: number;
  skippedRows: number;
  
  // Data
  rows: ImportRow[];
  
  // Summary
  summary?: ImportSummary;
  
  // Timestamps
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdBy: string;
}

// Import summary after completion
export interface ImportSummary {
  totalProcessed: number;
  successfullyImported: number;
  skipped: number;
  failed: number;
  
  // By class
  byClass: { className: string; count: number }[];
  
  // By residence type
  byResidenceType: { type: ResidenceType; count: number }[];
  
  // Errors breakdown
  errorsByType: { type: string; count: number; examples: string[] }[];
  
  // Warnings breakdown
  warningsByType: { type: string; count: number; examples: string[] }[];
}

// Import template
export interface ImportTemplate {
  id: string;
  name: string;
  description: string;
  fileType: ImportFileType;
  columns: TemplateColumn[];
  sampleData: Record<string, string>[];
}

export interface TemplateColumn {
  name: string;
  field: StudentImportField;
  required: boolean;
  description: string;
  example: string;
  validValues?: string[];
}

// Default import template for Uganda schools
export const DEFAULT_IMPORT_TEMPLATE: ImportTemplate = {
  id: 'uganda_standard',
  name: 'Uganda Standard Template',
  description: 'Standard student import template for Ugandan schools',
  fileType: 'excel',
  columns: [
    { name: 'Student ID', field: 'studentId', required: true, description: 'Unique student ID', example: 'STU-2024-001' },
    { name: 'First Name', field: 'firstName', required: true, description: 'Student first name', example: 'Sarah' },
    { name: 'Middle Name', field: 'middleName', required: false, description: 'Student middle name', example: 'Grace' },
    { name: 'Last Name', field: 'lastName', required: true, description: 'Student surname', example: 'Nakamya' },
    { name: 'Class', field: 'className', required: true, description: 'Class/Year', example: 'S.3', validValues: ['S.1', 'S.2', 'S.3', 'S.4', 'S.5', 'S.6', 'P.1', 'P.2', 'P.3', 'P.4', 'P.5', 'P.6', 'P.7'] },
    { name: 'Stream', field: 'streamName', required: false, description: 'Class stream', example: 'East', validValues: ['East', 'West', 'North', 'South', 'A', 'B', 'C'] },
    { name: 'Residence Type', field: 'residenceType', required: false, description: 'Boarding status', example: 'boarder', validValues: ['boarder', 'day_scholar', 'half_boarder', 'weekly_boarder'] },
    { name: 'Guardian Name', field: 'guardianName', required: true, description: 'Parent/Guardian full name', example: 'Nakamya Rose' },
    { name: 'Guardian Phone', field: 'guardianPhone', required: true, description: 'Phone number (with country code)', example: '+256772123456' },
    { name: 'Guardian Email', field: 'guardianEmail', required: false, description: 'Email address', example: 'parent@email.com' },
    { name: 'Guardian Relation', field: 'guardianRelation', required: false, description: 'Relationship to student', example: 'Mother', validValues: ['Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 'Grandparent', 'Other'] },
    { name: 'Total Fees', field: 'totalFees', required: false, description: 'Term fees in UGX', example: '1500000' },
    { name: 'Amount Paid', field: 'amountPaid', required: false, description: 'Already paid in UGX', example: '1000000' },
    { name: 'Date of Birth', field: 'dateOfBirth', required: false, description: 'DD/MM/YYYY format', example: '15/06/2008' },
    { name: 'Gender', field: 'gender', required: false, description: 'Student gender', example: 'female', validValues: ['male', 'female'] },
  ],
  sampleData: [
    {
      'Student ID': 'STU-2024-001',
      'First Name': 'Sarah',
      'Middle Name': 'Grace',
      'Last Name': 'Nakamya',
      'Class': 'S.3',
      'Stream': 'East',
      'Residence Type': 'boarder',
      'Guardian Name': 'Nakamya Rose',
      'Guardian Phone': '+256772123456',
      'Guardian Email': 'rose.nakamya@email.com',
      'Guardian Relation': 'Mother',
      'Total Fees': '1980000',
      'Amount Paid': '1500000',
      'Date of Birth': '15/06/2008',
      'Gender': 'female',
    },
    {
      'Student ID': 'STU-2024-002',
      'First Name': 'Peter',
      'Middle Name': '',
      'Last Name': 'Ochieng',
      'Class': 'S.2',
      'Stream': 'West',
      'Residence Type': 'day_scholar',
      'Guardian Name': 'Ochieng James',
      'Guardian Phone': '+256777456789',
      'Guardian Email': '',
      'Guardian Relation': 'Father',
      'Total Fees': '980000',
      'Amount Paid': '700000',
      'Date of Birth': '22/03/2009',
      'Gender': 'male',
    },
  ],
};

// Validation functions
export function validatePhoneNumber(phone: string): { isValid: boolean; normalized: string; error?: string } {
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // Handle Ugandan phone numbers
  if (normalized.startsWith('0')) {
    normalized = '+256' + normalized.substring(1);
  } else if (normalized.startsWith('256')) {
    normalized = '+' + normalized;
  } else if (!normalized.startsWith('+')) {
    normalized = '+256' + normalized;
  }
  
  // Validate format
  const isValid = /^\+256[0-9]{9}$/.test(normalized);
  
  return {
    isValid,
    normalized,
    error: isValid ? undefined : 'Invalid Ugandan phone number. Expected format: +256XXXXXXXXX',
  };
}

export function validateStudentId(id: string, existingIds: string[]): { isValid: boolean; error?: string } {
  if (!id || id.trim().length === 0) {
    return { isValid: false, error: 'Student ID is required' };
  }
  
  if (existingIds.includes(id)) {
    return { isValid: false, error: 'Student ID already exists' };
  }
  
  return { isValid: true };
}

export function validateClassName(className: string): { isValid: boolean; normalized: string; error?: string } {
  const normalized = className.trim().toUpperCase();
  
  // Common Uganda class formats
  const validPatterns = [
    /^S\.[1-6]$/, // Secondary: S.1 to S.6
    /^P\.[1-7]$/, // Primary: P.1 to P.7
    /^BABY$/,     // Nursery
    /^MIDDLE$/,
    /^TOP$/,
  ];
  
  const isValid = validPatterns.some(pattern => pattern.test(normalized));
  
  return {
    isValid,
    normalized,
    error: isValid ? undefined : 'Invalid class format. Expected: S.1-S.6, P.1-P.7',
  };
}

export function validateResidenceType(value: string): { isValid: boolean; type?: ResidenceType; error?: string } {
  const normalized = value.toLowerCase().trim().replace(/\s+/g, '_');
  
  const validTypes: ResidenceType[] = ['boarder', 'day_scholar', 'half_boarder', 'weekly_boarder', 'external'];
  
  // Handle common variations
  const mappings: Record<string, ResidenceType> = {
    'boarder': 'boarder',
    'boarding': 'boarder',
    'full_boarder': 'boarder',
    'full_boarding': 'boarder',
    'day': 'day_scholar',
    'day_scholar': 'day_scholar',
    'day_student': 'day_scholar',
    'half': 'half_boarder',
    'half_boarder': 'half_boarder',
    'half_boarding': 'half_boarder',
    'lunch': 'half_boarder',
    'weekly': 'weekly_boarder',
    'weekly_boarder': 'weekly_boarder',
    'external': 'external',
    'private': 'external',
  };
  
  const type = mappings[normalized];
  
  return {
    isValid: !!type,
    type,
    error: type ? undefined : `Invalid residence type. Expected: ${validTypes.join(', ')}`,
  };
}

export function parseDate(dateStr: string): { isValid: boolean; date?: Date; error?: string } {
  if (!dateStr || dateStr.trim() === '') {
    return { isValid: true }; // Optional field
  }
  
  // Try DD/MM/YYYY format (common in Uganda)
  const ddmmyyyy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
  const match = dateStr.match(ddmmyyyy);
  
  if (match) {
    const [, day, month, year] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    if (!isNaN(date.getTime())) {
      return { isValid: true, date };
    }
  }
  
  // Try ISO format
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) {
    return { isValid: true, date: isoDate };
  }
  
  return { isValid: false, error: 'Invalid date format. Expected: DD/MM/YYYY' };
}

export function parseCurrency(value: string): { isValid: boolean; amount?: number; error?: string } {
  if (!value || value.trim() === '') {
    return { isValid: true }; // Optional field
  }
  
  // Remove currency symbols, commas, spaces
  const cleaned = value.replace(/[UGX,\s]/gi, '').trim();
  const amount = parseFloat(cleaned);
  
  if (isNaN(amount) || amount < 0) {
    return { isValid: false, error: 'Invalid amount. Expected a positive number' };
  }
  
  return { isValid: true, amount };
}
