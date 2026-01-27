/**
 * Student Import Page
 * Bulk import students from Excel/CSV files
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import {
  FileUploadDropzone,
  ColumnMappingStep,
  ImportPreviewStep,
  ImportingProgress,
  ImportComplete,
  ImportConfigPanel,
  WizardStepper,
} from '../../../components/import';
import { useImportWizard, ImportStep } from '../../../hooks/useBulkImport';

const WIZARD_STEPS: { key: ImportStep; label: string }[] = [
  { key: 'upload', label: 'Upload File' },
  { key: 'mapping', label: 'Map Columns' },
  { key: 'preview', label: 'Preview' },
  { key: 'importing', label: 'Import' },
  { key: 'complete', label: 'Done' },
];

export default function StudentImportPage() {
  const router = useRouter();
  
  // Mock school/user IDs - in production would come from auth context
  const schoolId = 'school_1';
  const userId = 'user_1';

  const {
    step,
    job,
    error,
    isLoading,
    selectedFile,
    parsedHeaders,
    parsedRows,
    columnMappings,
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
  } = useImportWizard(schoolId, userId);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <button 
            onClick={() => router.push('/students')}
            className="hover:text-gray-700"
          >
            Students
          </button>
          <span>/</span>
          <span>Import</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Import Students</h1>
            <p className="text-gray-500 mt-1">
              Bulk import students from Excel or CSV files
            </p>
          </div>
          {step !== 'upload' && step !== 'importing' && step !== 'complete' && (
            <Button variant="outline" onClick={reset}>
              Start Over
            </Button>
          )}
        </div>
      </div>

      {/* Wizard Stepper */}
      {step !== 'complete' && (
        <WizardStepper currentStep={step} steps={WIZARD_STEPS} />
      )}

      {/* Main Content */}
      <div className="space-y-6">
        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-6">
            <FileUploadDropzone
              onFileSelect={selectFile}
              isLoading={isLoading}
              error={error}
              onDownloadTemplate={downloadTemplate}
            />
            
            <ImportConfigPanel
              config={config}
              onUpdate={updateConfig}
            />
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 'mapping' && (
          <div className="space-y-6">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-medium text-blue-900">Map your columns</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Match each column from your file to the corresponding student field. 
                    We've auto-detected some mappings for you.
                  </p>
                </div>
              </div>
            </Card>

            {selectedFile && (
              <div className="text-sm text-gray-500">
                File: <span className="font-medium">{selectedFile.name}</span>
                <span className="mx-2">•</span>
                {parsedRows.length} rows found
              </div>
            )}

            <ColumnMappingStep
              headers={parsedHeaders}
              sampleRow={parsedRows[0] || null}
              mappings={columnMappings}
              missingRequired={missingRequiredFields}
              onUpdateMapping={updateColumnMapping}
              onBack={() => goToStep('upload')}
              onNext={validateData}
            />
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && job && (
          <ImportPreviewStep
            job={job}
            onBack={() => goToStep('mapping')}
            onImport={startImport}
            isLoading={isLoading}
          />
        )}

        {/* Step 4: Importing */}
        {step === 'importing' && job && (
          <ImportingProgress job={job} />
        )}

        {/* Step 5: Complete */}
        {step === 'complete' && job && (
          <ImportComplete
            job={job}
            onNewImport={reset}
            onViewStudents={() => router.push('/students')}
          />
        )}
      </div>

      {/* Help Section */}
      {step === 'upload' && (
        <Card className="mt-8 p-6">
          <h3 className="font-semibold mb-4">Import Guidelines</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Required Columns</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Student ID (unique identifier)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  First Name
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Last Name
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Class (e.g., S.1, S.2, P.5)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Guardian Name
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Guardian Phone
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Formatting Tips</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  <span>Phone numbers: Use format +256 or 0 prefix (e.g., +256772123456 or 0772123456)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  <span>Classes: Use Ugandan format (S.1, S.2... or P.1, P.2...)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  <span>Dates: Use DD/MM/YYYY format</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  <span>Currency: Use UGX or plain numbers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  <span>Residence: boarder, day_scholar, half_boarder</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
