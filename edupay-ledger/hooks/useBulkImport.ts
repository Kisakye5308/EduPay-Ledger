/**
 * Bulk Import Hooks
 * React hooks for Excel/CSV student import workflow
 */

import { useState, useCallback, useEffect } from 'react';
import {
  ImportJob,
  ImportRow,
  ImportConfig,
  ImportSummary,
  ColumnMapping,
  StudentImportField,
  DEFAULT_IMPORT_TEMPLATE,
} from '../types/bulk-import';
import {
  createImportJob,
  validateImportRows,
  executeImport,
  getExistingStudentIds,
  autoDetectColumnMappings,
  generateTemplateCSV,
  getMockImportJob,
} from '../lib/services/bulk-import.service';

const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

export type ImportStep = 
  | 'upload'
  | 'mapping'
  | 'preview'
  | 'importing'
  | 'complete';

interface UseImportWizardReturn {
  // State
  step: ImportStep;
  job: ImportJob | null;
  error: string | null;
  isLoading: boolean;
  
  // File handling
  selectedFile: File | null;
  parsedHeaders: string[];
  parsedRows: Record<string, string>[];
  
  // Column mapping
  columnMappings: ColumnMapping[];
  unmappedHeaders: string[];
  missingRequiredFields: StudentImportField[];
  
  // Config
  config: ImportConfig;
  updateConfig: (updates: Partial<ImportConfig>) => void;
  
  // Actions
  selectFile: (file: File) => Promise<void>;
  updateColumnMapping: (sourceColumn: string, targetField: StudentImportField | null) => void;
  goToStep: (step: ImportStep) => void;
  validateData: () => Promise<void>;
  startImport: () => Promise<void>;
  reset: () => void;
  downloadTemplate: () => void;
}

/**
 * Main hook for import wizard workflow
 */
export function useImportWizard(
  schoolId: string,
  userId: string
): UseImportWizardReturn {
  // Step state
  const [step, setStep] = useState<ImportStep>('upload');
  const [job, setJob] = useState<ImportJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  
  // Column mapping state
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  
  // Config state
  const [config, setConfig] = useState<ImportConfig>({
    schoolId,
    year: new Date().getFullYear(),
    term: 'term_1',
    columnMappings: [],
    skipFirstRow: true,
    duplicateHandling: 'skip',
    autoAssignFees: true,
    defaultResidenceType: 'day_scholar',
    defaultStream: '',
  });

  // Calculate unmapped and missing fields
  const mappedFields = columnMappings
    .filter(m => m.targetField)
    .map(m => m.targetField);
  
  const unmappedHeaders = parsedHeaders.filter(
    h => !columnMappings.find(m => m.sourceColumn === h)?.targetField
  );

  const requiredFields: StudentImportField[] = [
    'studentId', 'firstName', 'lastName', 'className', 'guardianName', 'guardianPhone'
  ];
  const missingRequiredFields = requiredFields.filter(
    f => !mappedFields.includes(f)
  );

  // Parse CSV file
  const parseCSV = useCallback((content: string): { headers: string[], rows: Record<string, string>[] } => {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('File is empty');
    }

    // Parse headers
    const headers = parseCSVLine(lines[0]);
    
    // Parse data rows
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return { headers, rows };
  }, []);

  // Parse single CSV line (handles quoted values)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    
    return result;
  };

  // Select and parse file
  const selectFile = useCallback(async (file: File) => {
    setError(null);
    setIsLoading(true);
    setSelectedFile(file);

    try {
      const fileType = file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'excel';
      
      if (fileType === 'csv') {
        const content = await file.text();
        const { headers, rows } = parseCSV(content);
        
        if (headers.length === 0) {
          throw new Error('No columns found in file');
        }
        
        if (rows.length === 0) {
          throw new Error('No data rows found in file');
        }

        setParsedHeaders(headers);
        setParsedRows(rows);

        // Auto-detect column mappings
        const mappings = autoDetectColumnMappings(headers);
        setColumnMappings(
          headers.map(header => {
            const autoMapping = mappings.find(m => m.sourceColumn === header);
            return {
              sourceColumn: header,
              targetField: autoMapping?.targetField || ('' as StudentImportField),
              isRequired: autoMapping?.isRequired || false,
            };
          })
        );

        setStep('mapping');
      } else {
        // For Excel files, we'd need a library like xlsx
        // For now, show a message
        throw new Error('Excel files require xlsx library. Please export as CSV.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setIsLoading(false);
    }
  }, [parseCSV]);

  // Update column mapping
  const updateColumnMapping = useCallback((sourceColumn: string, targetField: StudentImportField | null) => {
    setColumnMappings(prev => 
      prev.map(m => 
        m.sourceColumn === sourceColumn 
          ? { ...m, targetField: targetField || ('' as StudentImportField) }
          : m
      )
    );
  }, []);

  // Update config
  const updateConfig = useCallback((updates: Partial<ImportConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Go to specific step
  const goToStep = useCallback((newStep: ImportStep) => {
    setStep(newStep);
  }, []);

  // Validate data
  const validateData = useCallback(async () => {
    if (!selectedFile || parsedRows.length === 0) {
      setError('No data to validate');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get existing student IDs for duplicate checking
      let existingIds: string[] = [];
      if (!useMockData) {
        existingIds = await getExistingStudentIds(schoolId);
      }

      // Create import job with current mappings
      const jobConfig: ImportConfig = {
        ...config,
        columnMappings: columnMappings.filter(m => m.targetField),
      };

      const newJob = await createImportJob(
        schoolId,
        selectedFile.name,
        selectedFile.name.toLowerCase().endsWith('.csv') ? 'csv' : 'excel',
        parsedRows,
        jobConfig,
        userId
      );

      // Validate rows
      const validatedJob = await validateImportRows(newJob, existingIds);
      setJob(validatedJob);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, parsedRows, config, columnMappings, schoolId, userId]);

  // Start import
  const startImport = useCallback(async () => {
    if (!job) {
      setError('No validated data to import');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep('importing');

    try {
      if (useMockData) {
        // Simulate import
        await new Promise(resolve => setTimeout(resolve, 2000));
        const mockJob = getMockImportJob();
        setJob(mockJob);
      } else {
        const completedJob = await executeImport(job);
        setJob(completedJob);
      }
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setStep('preview');
    } finally {
      setIsLoading(false);
    }
  }, [job]);

  // Reset wizard
  const reset = useCallback(() => {
    setStep('upload');
    setJob(null);
    setError(null);
    setSelectedFile(null);
    setParsedHeaders([]);
    setParsedRows([]);
    setColumnMappings([]);
  }, []);

  // Download template
  const downloadTemplate = useCallback(() => {
    const csv = generateTemplateCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return {
    step,
    job,
    error,
    isLoading,
    selectedFile,
    parsedHeaders,
    parsedRows,
    columnMappings,
    unmappedHeaders,
    missingRequiredFields,
    config,
    updateConfig,
    selectFile,
    updateColumnMapping,
    goToStep,
    validateData,
    startImport,
    reset,
    downloadTemplate,
  };
}

/**
 * Hook for import history
 */
export function useImportHistory(schoolId: string) {
  const [imports, setImports] = useState<ImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchImports() {
      setIsLoading(true);
      try {
        if (useMockData) {
          setImports([getMockImportJob()]);
        } else {
          // Fetch from Firestore
          // This would query the import_jobs collection
          setImports([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load imports');
      } finally {
        setIsLoading(false);
      }
    }

    fetchImports();
  }, [schoolId]);

  return { imports, isLoading, error };
}

/**
 * Hook for file drag and drop
 */
export function useFileDrop(
  onFileDrop: (file: File) => void,
  acceptedTypes: string[] = ['.csv', '.xlsx', '.xls']
) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(file => 
      acceptedTypes.some(type => 
        file.name.toLowerCase().endsWith(type)
      )
    );

    if (validFile) {
      onFileDrop(validFile);
    }
  }, [onFileDrop, acceptedTypes]);

  return {
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
