/**
 * Bulk Import Service
 * Handles Excel/CSV student data import with validation
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  ImportJob,
  ImportRow,
  ImportConfig,
  ImportSummary,
  StudentImportData,
  ValidationError,
  ValidationWarning,
  ColumnMapping,
  StudentImportField,
  validatePhoneNumber,
  validateStudentId,
  validateClassName,
  validateResidenceType,
  parseDate,
  parseCurrency,
  DEFAULT_IMPORT_TEMPLATE,
} from '../../types/bulk-import';
import { ResidenceType } from '../../types/residence';

const IMPORT_JOBS_COLLECTION = 'import_jobs';
const STUDENTS_COLLECTION = 'students';

/**
 * Create a new import job
 */
export async function createImportJob(
  schoolId: string,
  fileName: string,
  fileType: 'excel' | 'csv',
  rawData: Record<string, string>[],
  config: ImportConfig,
  createdBy: string
): Promise<ImportJob> {
  const jobId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const job: ImportJob = {
    id: jobId,
    schoolId,
    fileName,
    fileType,
    status: 'pending',
    config,
    totalRows: rawData.length,
    processedRows: 0,
    validRows: 0,
    errorRows: 0,
    warningRows: 0,
    importedRows: 0,
    skippedRows: 0,
    rows: rawData.map((data, index) => ({
      rowNumber: index + (config.skipFirstRow ? 2 : 1),
      originalData: data,
      mappedData: {},
      status: 'valid',
      errors: [],
      warnings: [],
    })),
    createdAt: new Date(),
    createdBy,
  };

  // Save to Firestore
  await setDoc(doc(db, IMPORT_JOBS_COLLECTION, jobId), {
    ...job,
    createdAt: Timestamp.fromDate(job.createdAt),
    rows: [], // Don't store full row data in Firestore (too large)
  });

  return job;
}

/**
 * Validate import rows
 */
export async function validateImportRows(
  job: ImportJob,
  existingStudentIds: string[]
): Promise<ImportJob> {
  const updatedJob = { ...job, status: 'validating' as const };
  
  for (let i = 0; i < updatedJob.rows.length; i++) {
    const row = updatedJob.rows[i];
    row.errors = [];
    row.warnings = [];
    row.mappedData = {};
    row.status = 'valid';

    // Map columns
    for (const mapping of job.config.columnMappings) {
      const sourceValue = row.originalData[mapping.sourceColumn];
      
      if (mapping.isRequired && (!sourceValue || sourceValue.trim() === '')) {
        row.errors.push({
          field: mapping.targetField,
          message: `${mapping.targetField} is required`,
        });
        continue;
      }

      if (sourceValue) {
        const transformedValue = mapping.transform 
          ? mapping.transform(sourceValue) 
          : sourceValue.trim();
        (row.mappedData as any)[mapping.targetField] = transformedValue;
      }
    }

    // Validate specific fields
    if (row.mappedData.studentId) {
      const idValidation = validateStudentId(row.mappedData.studentId, existingStudentIds);
      if (!idValidation.isValid) {
        row.errors.push({ field: 'studentId', message: idValidation.error!, value: row.mappedData.studentId });
      } else {
        existingStudentIds.push(row.mappedData.studentId);
      }
    }

    if (row.mappedData.guardianPhone) {
      const phoneValidation = validatePhoneNumber(row.mappedData.guardianPhone);
      if (!phoneValidation.isValid) {
        row.warnings.push({ 
          field: 'guardianPhone', 
          message: phoneValidation.error!, 
          value: row.mappedData.guardianPhone,
          suggestion: phoneValidation.normalized,
        });
      }
      row.mappedData.guardianPhone = phoneValidation.normalized;
    }

    if (row.mappedData.className) {
      const classValidation = validateClassName(row.mappedData.className);
      if (!classValidation.isValid) {
        row.warnings.push({ 
          field: 'className', 
          message: classValidation.error!, 
          value: row.mappedData.className,
        });
      } else {
        row.mappedData.className = classValidation.normalized;
      }
    }

    if (row.mappedData.residenceType) {
      const residenceValidation = validateResidenceType(row.mappedData.residenceType as string);
      if (!residenceValidation.isValid) {
        row.warnings.push({ 
          field: 'residenceType', 
          message: residenceValidation.error!, 
          value: row.mappedData.residenceType as string,
        });
        row.mappedData.residenceType = job.config.defaultResidenceType;
      } else {
        row.mappedData.residenceType = residenceValidation.type;
      }
    } else {
      row.mappedData.residenceType = job.config.defaultResidenceType;
    }

    if ((row.mappedData as any).totalFees) {
      const feesValidation = parseCurrency((row.mappedData as any).totalFees);
      if (!feesValidation.isValid) {
        row.errors.push({ 
          field: 'totalFees', 
          message: feesValidation.error!, 
          value: (row.mappedData as any).totalFees,
        });
      } else {
        row.mappedData.totalFees = feesValidation.amount;
      }
    }

    if ((row.mappedData as any).amountPaid) {
      const paidValidation = parseCurrency((row.mappedData as any).amountPaid);
      if (!paidValidation.isValid) {
        row.errors.push({ 
          field: 'amountPaid', 
          message: paidValidation.error!, 
          value: (row.mappedData as any).amountPaid,
        });
      } else {
        row.mappedData.amountPaid = paidValidation.amount;
      }
    }

    if ((row.mappedData as any).dateOfBirth) {
      const dateValidation = parseDate((row.mappedData as any).dateOfBirth);
      if (!dateValidation.isValid) {
        row.warnings.push({ 
          field: 'dateOfBirth', 
          message: dateValidation.error!, 
          value: (row.mappedData as any).dateOfBirth,
        });
      } else if (dateValidation.date) {
        row.mappedData.dateOfBirth = dateValidation.date.toISOString().split('T')[0];
      }
    }

    // Set row status
    if (row.errors.length > 0) {
      row.status = 'error';
      updatedJob.errorRows++;
    } else if (row.warnings.length > 0) {
      row.status = 'warning';
      updatedJob.warningRows++;
    } else {
      row.status = 'valid';
      updatedJob.validRows++;
    }

    updatedJob.processedRows++;
  }

  return updatedJob;
}

/**
 * Execute import for validated rows
 */
export async function executeImport(
  job: ImportJob
): Promise<ImportJob> {
  const updatedJob: ImportJob = { ...job, status: 'importing', startedAt: new Date() };
  
  const batch = writeBatch(db);
  let importedCount = 0;
  let skippedCount = 0;

  for (const row of updatedJob.rows) {
    // Skip rows with errors
    if (row.status === 'error') {
      row.status = 'skipped';
      skippedCount++;
      continue;
    }

    // Check required fields
    const data = row.mappedData;
    if (!data.firstName || !data.lastName || !data.studentId || !data.className || !data.guardianName || !data.guardianPhone) {
      row.status = 'skipped';
      row.errors.push({ field: 'general', message: 'Missing required fields' });
      skippedCount++;
      continue;
    }

    // Create student document
    const studentId = `${job.schoolId}_${data.studentId}`;
    const studentRef = doc(db, STUDENTS_COLLECTION, studentId);

    // Check for existing student
    if (job.config.duplicateHandling !== 'update') {
      const existing = await getDoc(studentRef);
      if (existing.exists()) {
        if (job.config.duplicateHandling === 'skip') {
          row.status = 'skipped';
          row.warnings.push({ field: 'studentId', message: 'Student already exists, skipped' });
          skippedCount++;
          continue;
        } else if (job.config.duplicateHandling === 'error') {
          row.status = 'error';
          row.errors.push({ field: 'studentId', message: 'Student already exists' });
          skippedCount++;
          continue;
        }
      }
    }

    const totalFees = data.totalFees || 0;
    const amountPaid = data.amountPaid || 0;
    const balance = totalFees - amountPaid;
    const paymentProgress = totalFees > 0 ? Math.round((amountPaid / totalFees) * 100) : 0;

    const studentData = {
      id: studentId,
      schoolId: job.schoolId,
      studentId: data.studentId,
      firstName: data.firstName,
      middleName: data.middleName || '',
      lastName: data.lastName,
      className: data.className,
      streamName: data.streamName || job.config.defaultStream || '',
      residenceType: data.residenceType || job.config.defaultResidenceType,
      guardian: {
        name: data.guardianName,
        phone: data.guardianPhone,
        email: data.guardianEmail || '',
        relation: data.guardianRelation || '',
      },
      totalFees,
      amountPaid,
      balance,
      paymentProgress,
      term: job.config.term,
      year: job.config.year,
      status: 'active',
      dateOfBirth: data.dateOfBirth || null,
      gender: data.gender || null,
      nationality: data.nationality || 'Ugandan',
      religion: data.religion || null,
      address: data.address || null,
      admissionDate: data.admissionDate || new Date().toISOString().split('T')[0],
      previousSchool: data.previousSchool || null,
      specialNeeds: data.specialNeeds || null,
      notes: data.notes || null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      importedFrom: job.id,
    };

    batch.set(studentRef, studentData);
    row.status = 'imported';
    importedCount++;

    // Commit in batches of 500 (Firestore limit)
    if (importedCount % 500 === 0) {
      await batch.commit();
    }
  }

  // Final commit
  await batch.commit();

  updatedJob.importedRows = importedCount;
  updatedJob.skippedRows = skippedCount;
  updatedJob.status = 'completed';
  updatedJob.completedAt = new Date();

  // Generate summary
  updatedJob.summary = generateImportSummary(updatedJob);

  // Update job in Firestore
  await updateDoc(doc(db, IMPORT_JOBS_COLLECTION, job.id), {
    status: 'completed',
    importedRows: importedCount,
    skippedRows: skippedCount,
    completedAt: Timestamp.fromDate(updatedJob.completedAt),
    summary: updatedJob.summary,
  });

  return updatedJob;
}

/**
 * Generate import summary
 */
function generateImportSummary(job: ImportJob): ImportSummary {
  const byClass = new Map<string, number>();
  const byResidenceType = new Map<ResidenceType, number>();
  const errorTypes = new Map<string, { count: number; examples: string[] }>();
  const warningTypes = new Map<string, { count: number; examples: string[] }>();

  for (const row of job.rows) {
    if (row.status === 'imported') {
      const className = row.mappedData.className || 'Unknown';
      byClass.set(className, (byClass.get(className) || 0) + 1);

      const residenceType = row.mappedData.residenceType || 'day_scholar';
      byResidenceType.set(residenceType, (byResidenceType.get(residenceType) || 0) + 1);
    }

    for (const error of row.errors) {
      const key = `${error.field}: ${error.message}`;
      const existing = errorTypes.get(key) || { count: 0, examples: [] };
      existing.count++;
      if (existing.examples.length < 3 && error.value) {
        existing.examples.push(error.value);
      }
      errorTypes.set(key, existing);
    }

    for (const warning of row.warnings) {
      const key = `${warning.field}: ${warning.message}`;
      const existing = warningTypes.get(key) || { count: 0, examples: [] };
      existing.count++;
      if (existing.examples.length < 3 && warning.value) {
        existing.examples.push(warning.value);
      }
      warningTypes.set(key, existing);
    }
  }

  return {
    totalProcessed: job.processedRows,
    successfullyImported: job.importedRows,
    skipped: job.skippedRows,
    failed: job.errorRows,
    byClass: Array.from(byClass.entries()).map(([className, count]) => ({ className, count })),
    byResidenceType: Array.from(byResidenceType.entries()).map(([type, count]) => ({ type, count })),
    errorsByType: Array.from(errorTypes.entries()).map(([type, data]) => ({ type, ...data })),
    warningsByType: Array.from(warningTypes.entries()).map(([type, data]) => ({ type, ...data })),
  };
}

/**
 * Get existing student IDs for duplicate checking
 */
export async function getExistingStudentIds(schoolId: string): Promise<string[]> {
  const q = query(
    collection(db, STUDENTS_COLLECTION),
    where('schoolId', '==', schoolId)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data().studentId);
}

/**
 * Auto-detect column mappings from headers
 */
export function autoDetectColumnMappings(headers: string[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  const template = DEFAULT_IMPORT_TEMPLATE;

  for (const header of headers) {
    const normalizedHeader = header.toLowerCase().trim().replace(/[\s_-]+/g, '');
    
    // Find matching template column
    const templateColumn = template.columns.find(col => {
      const normalizedCol = col.name.toLowerCase().replace(/[\s_-]+/g, '');
      const normalizedField = col.field.toLowerCase();
      
      return normalizedHeader === normalizedCol || 
             normalizedHeader === normalizedField ||
             normalizedHeader.includes(normalizedCol) ||
             normalizedCol.includes(normalizedHeader);
    });

    if (templateColumn) {
      mappings.push({
        sourceColumn: header,
        targetField: templateColumn.field,
        isRequired: templateColumn.required,
      });
    }
  }

  return mappings;
}

/**
 * Download import template as CSV
 */
export function generateTemplateCSV(): string {
  const template = DEFAULT_IMPORT_TEMPLATE;
  const headers = template.columns.map(col => col.name);
  const rows = template.sampleData.map(data => 
    headers.map(header => data[header] || '').join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

// ============================================
// MOCK DATA FUNCTIONS
// ============================================

export function getMockImportJob(): ImportJob {
  return {
    id: 'mock_import_1',
    schoolId: 'school_1',
    fileName: 'students_term2_2024.xlsx',
    fileType: 'excel',
    status: 'completed',
    config: {
      schoolId: 'school_1',
      year: 2024,
      term: 'term_2',
      columnMappings: [],
      skipFirstRow: true,
      duplicateHandling: 'skip',
      autoAssignFees: true,
      defaultResidenceType: 'day_scholar',
    },
    totalRows: 150,
    processedRows: 150,
    validRows: 142,
    errorRows: 5,
    warningRows: 8,
    importedRows: 142,
    skippedRows: 8,
    rows: [],
    summary: {
      totalProcessed: 150,
      successfullyImported: 142,
      skipped: 8,
      failed: 0,
      byClass: [
        { className: 'S.1', count: 45 },
        { className: 'S.2', count: 42 },
        { className: 'S.3', count: 35 },
        { className: 'S.4', count: 20 },
      ],
      byResidenceType: [
        { type: 'boarder', count: 55 },
        { type: 'day_scholar', count: 72 },
        { type: 'half_boarder', count: 15 },
      ],
      errorsByType: [
        { type: 'studentId: Student ID already exists', count: 5, examples: ['STU-001', 'STU-005'] },
      ],
      warningsByType: [
        { type: 'guardianPhone: Invalid phone format', count: 8, examples: ['0772123456', '772-123-456'] },
      ],
    },
    createdAt: new Date('2024-06-01T09:00:00'),
    startedAt: new Date('2024-06-01T09:01:00'),
    completedAt: new Date('2024-06-01T09:05:00'),
    createdBy: 'admin',
  };
}
