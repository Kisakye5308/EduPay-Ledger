/**
 * Residence Fee Components
 * UI components for boarding vs day scholar fee management
 */

'use client';

import React, { useState } from 'react';
import { Card, Badge, Button, Modal, ProgressBar } from '../ui';
import {
  ResidenceType,
  ResidenceFeeStructure,
  StudentResidenceFees,
  BoardingFeeReport,
  BoardingFeeItem,
  FeeAdjustment,
  getResidenceTypeLabel,
  getResidenceTypeColor,
  BOARDING_FEE_CATEGORIES,
} from '../../types/residence';

// Utility function
function formatUGX(amount: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================
// ResidenceTypeBadge
// Display residence type with color coding
// ============================================
interface ResidenceTypeBadgeProps {
  type: ResidenceType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function ResidenceTypeBadge({ type, size = 'md', showIcon = true }: ResidenceTypeBadgeProps) {
  const icons: Record<ResidenceType, string> = {
    boarder: 'hotel',
    day_scholar: 'directions_walk',
    half_boarder: 'restaurant',
    weekly_boarder: 'weekend',
    external: 'person_outline',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${getResidenceTypeColor(type)} ${sizeClasses[size]}`}>
      {showIcon && (
        <span className="material-symbols-outlined text-sm">{icons[type]}</span>
      )}
      {getResidenceTypeLabel(type)}
    </span>
  );
}

// ============================================
// FeeStructureCard
// Display a fee structure
// ============================================
interface FeeStructureCardProps {
  structure: ResidenceFeeStructure;
  onEdit?: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function FeeStructureCard({
  structure,
  onEdit,
  isSelected,
  onSelect,
}: FeeStructureCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card 
      className={`cursor-pointer transition-all ${
        isSelected 
          ? 'ring-2 ring-primary border-primary' 
          : 'hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ResidenceTypeBadge type={structure.residenceType} size="sm" />
            {!structure.isActive && (
              <Badge variant="secondary" className="text-xs">Inactive</Badge>
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{structure.name}</h3>
          <p className="text-sm text-slate-500">{structure.description}</p>
        </div>
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <span className="material-symbols-outlined text-sm">edit</span>
          </Button>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-bold text-primary">{formatUGX(structure.totalBaseFee)}</span>
        <span className="text-sm text-slate-500">base fees</span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Required Fees ({structure.baseFees.length})</span>
          <span className="font-medium">{formatUGX(structure.totalBaseFee)}</span>
        </div>
        {structure.optionalFees.length > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Optional Fees ({structure.optionalFees.length})</span>
            <span className="font-medium text-slate-400">
              up to {formatUGX(structure.optionalFees.reduce((sum, f) => sum + f.amount, 0))}
            </span>
          </div>
        )}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
        className="text-sm text-primary hover:underline flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-sm">
          {showDetails ? 'expand_less' : 'expand_more'}
        </span>
        {showDetails ? 'Hide' : 'Show'} fee breakdown
      </button>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Required Fees</h4>
            {structure.baseFees.map(fee => (
              <div key={fee.categoryId} className="flex justify-between text-sm py-1">
                <span className="text-slate-600 dark:text-slate-400">{fee.categoryName}</span>
                <span className="font-medium">{formatUGX(fee.amount)}</span>
              </div>
            ))}
          </div>
          {structure.optionalFees.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Optional Fees</h4>
              {structure.optionalFees.map(fee => (
                <div key={fee.categoryId} className="flex justify-between text-sm py-1">
                  <span className="text-slate-400">{fee.categoryName}</span>
                  <span className="font-medium text-slate-400">{formatUGX(fee.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ============================================
// StudentFeeAssignmentCard
// Display a student's fee assignment
// ============================================
interface StudentFeeAssignmentCardProps {
  fees: StudentResidenceFees | null;
  isLoading?: boolean;
  onChangeResidence?: () => void;
  onAddAdjustment?: () => void;
  onRecordPayment?: () => void;
}

export function StudentFeeAssignmentCard({
  fees,
  isLoading,
  onChangeResidence,
  onAddAdjustment,
  onRecordPayment,
}: StudentFeeAssignmentCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!fees) {
    return (
      <Card className="text-center py-8">
        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">assignment</span>
        <p className="text-slate-500 mb-4">No fee assignment found</p>
        <Button variant="primary" onClick={onChangeResidence}>
          Assign Fee Structure
        </Button>
      </Card>
    );
  }

  const paymentProgress = fees.adjustedTotal > 0 
    ? Math.round((fees.amountPaid / fees.adjustedTotal) * 100) 
    : 0;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <ResidenceTypeBadge type={fees.residenceType} />
          <p className="text-sm text-slate-500 mt-1">{fees.feeStructureName}</p>
        </div>
        {onChangeResidence && (
          <Button variant="outline" size="sm" onClick={onChangeResidence}>
            Change
          </Button>
        )}
      </div>

      {/* Fee Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <p className="text-xs text-slate-500">Base Fees</p>
          <p className="text-lg font-bold">{formatUGX(fees.totalBaseFees)}</p>
        </div>
        {fees.totalOptionalFees > 0 && (
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-xs text-slate-500">Optional</p>
            <p className="text-lg font-bold">{formatUGX(fees.totalOptionalFees)}</p>
          </div>
        )}
        <div className="text-center p-3 bg-primary/10 rounded-lg">
          <p className="text-xs text-slate-500">Total Due</p>
          <p className="text-lg font-bold text-primary">{formatUGX(fees.adjustedTotal)}</p>
        </div>
      </div>

      {/* Adjustments */}
      {fees.adjustments.length > 0 && (
        <div className="mb-4 p-3 bg-success/5 border border-success/20 rounded-lg">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Adjustments Applied</p>
          {fees.adjustments.map(adj => (
            <div key={adj.id} className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                {adj.type === 'scholarship' && '🎓'} 
                {adj.type === 'sibling_discount' && '👨‍👩‍👧‍👦'} 
                {adj.type === 'staff_discount' && '👔'} 
                {' '}{adj.description}
              </span>
              <span className="font-medium text-success">-{formatUGX(adj.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Payment Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-500">Payment Progress</span>
          <span className="font-medium">{paymentProgress}%</span>
        </div>
        <ProgressBar 
          value={paymentProgress} 
          max={100} 
          color={paymentProgress >= 100 ? 'success' : paymentProgress >= 70 ? 'primary' : 'warning'} 
        />
        <div className="flex justify-between text-xs mt-1">
          <span className="text-success">Paid: {formatUGX(fees.amountPaid)}</span>
          <span className="text-warning">Balance: {formatUGX(fees.balance)}</span>
        </div>
      </div>

      {/* Fee Breakdown Toggle */}
      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="w-full text-sm text-primary hover:underline flex items-center justify-center gap-1 py-2"
      >
        <span className="material-symbols-outlined text-sm">
          {showBreakdown ? 'expand_less' : 'expand_more'}
        </span>
        {showBreakdown ? 'Hide' : 'Show'} detailed breakdown
      </button>

      {showBreakdown && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {fees.appliedFees.map(fee => (
            <div 
              key={fee.categoryId} 
              className={`flex justify-between text-sm py-1 ${fee.isWaived ? 'opacity-50 line-through' : ''}`}
            >
              <span className={fee.isOptional ? 'text-slate-400' : 'text-slate-600 dark:text-slate-400'}>
                {fee.categoryName}
                {fee.isOptional && <span className="text-xs ml-1">(optional)</span>}
              </span>
              <span className="font-medium">{formatUGX(fee.adjustedAmount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        {onAddAdjustment && (
          <Button variant="outline" size="sm" className="flex-1" onClick={onAddAdjustment}>
            Add Discount
          </Button>
        )}
        {onRecordPayment && fees.balance > 0 && (
          <Button variant="primary" size="sm" className="flex-1" onClick={onRecordPayment}>
            Record Payment
          </Button>
        )}
      </div>
    </Card>
  );
}

// ============================================
// BoardingFeeReportCard
// Display boarding vs day scholar comparison
// ============================================
interface BoardingFeeReportCardProps {
  report: BoardingFeeReport | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
}

export function BoardingFeeReportCard({
  report,
  isLoading,
  onRefresh,
  onExport,
}: BoardingFeeReportCardProps) {
  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card className="text-center py-8">
        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">assessment</span>
        <p className="text-slate-500">No report data available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Boarding vs Day Scholar Report</h2>
          <p className="text-sm text-slate-500">
            Term {report.term.replace('term_', '')} {report.year} • Generated {report.generatedAt.toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <span className="material-symbols-outlined text-sm">download</span>
              Export
            </Button>
          )}
          {onRefresh && (
            <Button variant="primary" size="sm" onClick={onRefresh}>
              <span className="material-symbols-outlined text-sm">refresh</span>
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-primary/5">
          <span className="material-symbols-outlined text-primary mb-2">groups</span>
          <p className="text-2xl font-bold">{report.totalStudents}</p>
          <p className="text-sm text-slate-500">Total Students</p>
        </Card>
        <Card className="bg-slate-50 dark:bg-slate-800">
          <span className="material-symbols-outlined text-slate-600 mb-2">receipt</span>
          <p className="text-2xl font-bold">{formatUGX(report.totalExpectedFees)}</p>
          <p className="text-sm text-slate-500">Expected Fees</p>
        </Card>
        <Card className="bg-success/5">
          <span className="material-symbols-outlined text-success mb-2">check_circle</span>
          <p className="text-2xl font-bold text-success">{formatUGX(report.totalCollected)}</p>
          <p className="text-sm text-slate-500">Collected</p>
        </Card>
        <Card className="bg-warning/5">
          <span className="material-symbols-outlined text-warning mb-2">pending</span>
          <p className="text-2xl font-bold text-warning">{formatUGX(report.totalBalance)}</p>
          <p className="text-sm text-slate-500">Outstanding</p>
        </Card>
      </div>

      {/* Boarding vs Day Comparison */}
      <div className="grid grid-cols-2 gap-6">
        {/* Boarders */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-2xl text-primary">hotel</span>
            <div>
              <h3 className="font-bold text-lg">Boarding Students</h3>
              <p className="text-sm text-slate-500">{report.boardingStudents} students</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Expected Fees</span>
              <span className="font-bold">{formatUGX(report.boardingFees)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Collected</span>
              <span className="font-bold text-success">{formatUGX(report.boardingCollected)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Outstanding</span>
              <span className="font-bold text-warning">{formatUGX(report.boardingFees - report.boardingCollected)}</span>
            </div>
            <ProgressBar 
              value={report.boardingFees > 0 ? (report.boardingCollected / report.boardingFees) * 100 : 0} 
              max={100} 
              color="primary" 
            />
            <p className="text-center text-sm text-slate-500">
              {report.boardingFees > 0 ? ((report.boardingCollected / report.boardingFees) * 100).toFixed(1) : 0}% collected
            </p>
          </div>
        </Card>

        {/* Day Scholars */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-2xl text-success">directions_walk</span>
            <div>
              <h3 className="font-bold text-lg">Day Scholars</h3>
              <p className="text-sm text-slate-500">{report.dayStudents} students</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Expected Fees</span>
              <span className="font-bold">{formatUGX(report.dayFees)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Collected</span>
              <span className="font-bold text-success">{formatUGX(report.dayCollected)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Outstanding</span>
              <span className="font-bold text-warning">{formatUGX(report.dayFees - report.dayCollected)}</span>
            </div>
            <ProgressBar 
              value={report.dayFees > 0 ? (report.dayCollected / report.dayFees) * 100 : 0} 
              max={100} 
              color="success" 
            />
            <p className="text-center text-sm text-slate-500">
              {report.dayFees > 0 ? ((report.dayCollected / report.dayFees) * 100).toFixed(1) : 0}% collected
            </p>
          </div>
        </Card>
      </div>

      {/* By Residence Type Table */}
      <Card>
        <h3 className="font-bold text-lg mb-4">Collection by Residence Type</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Type</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Students</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Expected</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Collected</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Balance</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {report.byResidenceType.map(row => (
                <tr key={row.residenceType} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <ResidenceTypeBadge type={row.residenceType} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{row.studentCount}</td>
                  <td className="px-4 py-3 text-right">{formatUGX(row.totalFees)}</td>
                  <td className="px-4 py-3 text-right text-success font-medium">{formatUGX(row.totalCollected)}</td>
                  <td className="px-4 py-3 text-right text-warning font-medium">{formatUGX(row.totalBalance)}</td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant={row.collectionRate >= 80 ? 'success' : row.collectionRate >= 60 ? 'warning' : 'danger'}>
                      {row.collectionRate.toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ============================================
// ResidenceTypeSelector
// Select residence type for a student
// ============================================
interface ResidenceTypeSelectorProps {
  value: ResidenceType;
  onChange: (type: ResidenceType) => void;
  disabled?: boolean;
}

export function ResidenceTypeSelector({ value, onChange, disabled }: ResidenceTypeSelectorProps) {
  const options: { type: ResidenceType; icon: string; description: string }[] = [
    { type: 'boarder', icon: 'hotel', description: 'Full boarding student' },
    { type: 'day_scholar', icon: 'directions_walk', description: 'Day student - goes home daily' },
    { type: 'half_boarder', icon: 'restaurant', description: 'Lunch program only' },
    { type: 'weekly_boarder', icon: 'weekend', description: 'Goes home on weekends' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map(option => (
        <button
          key={option.type}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.type)}
          className={`p-4 rounded-lg border-2 text-left transition-all ${
            value === option.type
              ? 'border-primary bg-primary/5'
              : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-3">
            <span className={`material-symbols-outlined text-2xl ${
              value === option.type ? 'text-primary' : 'text-slate-400'
            }`}>
              {option.icon}
            </span>
            <div>
              <p className="font-medium">{getResidenceTypeLabel(option.type)}</p>
              <p className="text-xs text-slate-500">{option.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
