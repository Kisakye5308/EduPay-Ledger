/**
 * End-of-Term Financial Summary Components
 * UI components for comprehensive term-end reports
 */

'use client';

import React, { useState } from 'react';
import {
  TermFinancialSummary,
  CategoryCollection,
  ClassCollection,
  WeeklyCollectionData,
  StudentOutstandingItem,
  ArrearsSummary,
  ClearanceSummary,
  ScholarshipSummary,
  formatPercentage,
  getCollectionRateColor,
  getCollectionRateLabel,
} from '../../types/term-summary';
import { formatUGX } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/Progress';
import { Table } from '../ui/Table';

// ============================================
// SUMMARY OVERVIEW CARD
// ============================================

interface SummaryOverviewProps {
  summary: TermFinancialSummary;
}

export function SummaryOverviewCard({ summary }: SummaryOverviewProps) {
  const collectionRateColor = getCollectionRateColor(summary.collectionRate);
  const collectionLabel = getCollectionRateLabel(summary.collectionRate);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{summary.term} {summary.year}</h2>
          <p className="text-sm text-gray-500">Financial Summary Report</p>
        </div>
        <Badge variant={collectionRateColor === '#22c55e' ? 'success' : collectionRateColor === '#f59e0b' ? 'warning' : 'danger'}>
          {collectionLabel}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600 mb-1">Expected Fees</p>
          <p className="text-lg font-bold text-blue-900">{formatUGX(summary.totalExpectedFees)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600 mb-1">Collected</p>
          <p className="text-lg font-bold text-green-900">{formatUGX(summary.totalCollected)}</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4">
          <p className="text-sm text-amber-600 mb-1">Outstanding</p>
          <p className="text-lg font-bold text-amber-900">{formatUGX(summary.totalOutstanding)}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-purple-600 mb-1">Collection Rate</p>
          <p className="text-lg font-bold text-purple-900">{formatPercentage(summary.collectionRate)}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-500">{formatPercentage(summary.collectionRate)}</span>
        </div>
        <ProgressBar value={summary.collectionRate} max={100} className={collectionRateColor === '#22c55e' ? 'bg-green-500' : collectionRateColor === '#f59e0b' ? 'bg-amber-500' : 'bg-red-500'} />
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{summary.totalStudents}</p>
          <p className="text-sm text-gray-500">Total Students</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{summary.clearanceSummary.cleared}</p>
          <p className="text-sm text-gray-500">Cleared Students</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-600">{summary.clearanceSummary.notCleared}</p>
          <p className="text-sm text-gray-500">Not Cleared</p>
        </div>
      </div>

      {summary.peakCollectionDay && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Peak Collection Day:</span>{' '}
            {new Date(summary.peakCollectionDay.date).toLocaleDateString('en-UG', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} - {formatUGX(summary.peakCollectionDay.amount)}
          </p>
        </div>
      )}
    </Card>
  );
}

// ============================================
// COLLECTION BY CLASS TABLE
// ============================================

interface CollectionByClassProps {
  classes: ClassCollection[];
  onClassClick?: (className: string) => void;
}

export function CollectionByClassTable({ classes, onClassClick }: CollectionByClassProps) {
  const [sortBy, setSortBy] = useState<'class' | 'rate' | 'amount'>('class');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const sortedClasses = [...classes].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'class') {
      comparison = a.className.localeCompare(b.className);
    } else if (sortBy === 'rate') {
      comparison = a.collectionRate - b.collectionRate;
    } else {
      comparison = a.collectedAmount - b.collectedAmount;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: 'class' | 'rate' | 'amount') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Collection by Class</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('class')}
              >
                Class {sortBy === 'class' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Students</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Expected</th>
              <th 
                className="px-4 py-3 text-right text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('amount')}
              >
                Collected {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-4 py-3 text-right text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('rate')}
              >
                Rate {sortBy === 'rate' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedClasses.map((classData) => {
              const rateColor = getCollectionRateColor(classData.collectionRate);
              return (
                <tr 
                  key={classData.className} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onClassClick?.(classData.className)}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {classData.className}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">
                    {classData.totalStudents}
                    <span className="text-green-600 ml-1">({classData.fullyPaidCount})</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">
                    {formatUGX(classData.expectedAmount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                    {formatUGX(classData.collectedAmount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right" style={{ color: rateColor }}>
                    {formatPercentage(classData.collectionRate)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-20 mx-auto">
                      <ProgressBar value={classData.collectionRate} max={100} className={rateColor === '#22c55e' ? 'bg-green-500' : rateColor === '#f59e0b' ? 'bg-amber-500' : 'bg-red-500'} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ============================================
// COLLECTION BY CATEGORY CHART
// ============================================

interface CollectionByCategoryProps {
  categories: CategoryCollection[];
}

export function CollectionByCategoryChart({ categories }: CollectionByCategoryProps) {
  const maxExpected = Math.max(...categories.map(c => c.expectedAmount));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Collection by Fee Category</h3>
      
      <div className="space-y-4">
        {categories.map((category) => {
          const barWidth = (category.expectedAmount / maxExpected) * 100;
          const collectedWidth = (category.collectedAmount / category.expectedAmount) * barWidth;
          
          return (
            <div key={category.categoryId} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{category.categoryName}</span>
                <span className="text-sm text-gray-500">
                  {formatUGX(category.collectedAmount)} / {formatUGX(category.expectedAmount)}
                </span>
              </div>
              <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden" style={{ width: `${barWidth}%` }}>
                <div 
                  className="absolute h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${(category.collectedAmount / category.expectedAmount) * 100}%` }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-700">
                  {formatPercentage(category.collectionRate)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Outstanding: {formatUGX(category.outstandingAmount)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ============================================
// OUTSTANDING STUDENTS TABLE
// ============================================

interface OutstandingStudentsProps {
  students: StudentOutstandingItem[];
  onStudentClick?: (studentId: string) => void;
  onSendReminder?: (studentId: string) => void;
}

export function OutstandingStudentsTable({ 
  students, 
  onStudentClick, 
  onSendReminder 
}: OutstandingStudentsProps) {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(student => {
    if (filter !== 'all' && student.className !== filter) return false;
    if (searchTerm && !student.studentName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const classes = Array.from(new Set(students.map(s => s.className))).sort();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Outstanding Balances</h3>
        <span className="text-sm text-gray-500">{students.length} students</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by student name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Classes</option>
          {classes.map(cls => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Student</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Class</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Total Fees</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Paid</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Balance</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Last Payment</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStudents.map((student) => (
              <tr 
                key={student.studentId} 
                className="hover:bg-gray-50"
              >
                <td 
                  className="px-4 py-3 text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                  onClick={() => onStudentClick?.(student.studentId)}
                >
                  {student.studentName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{student.className}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {formatUGX(student.totalFees)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-green-600">
                  {formatUGX(student.amountPaid)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-bold text-red-600">
                  {formatUGX(student.balance)}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-500">
                  {student.lastPaymentDate 
                    ? new Date(student.lastPaymentDate).toLocaleDateString('en-UG', { 
                        day: '2-digit', 
                        month: 'short' 
                      })
                    : '-'
                  }
                </td>
                <td className="px-4 py-3 text-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSendReminder?.(student.studentId)}
                  >
                    Send Reminder
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No students found matching your criteria
        </div>
      )}
    </Card>
  );
}

// ============================================
// ARREARS SUMMARY CARD
// ============================================

interface ArrearsSummaryCardProps {
  arrears: ArrearsSummary;
}

export function ArrearsSummaryCard({ arrears }: ArrearsSummaryCardProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Arrears Summary</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-600 mb-1">Total Arrears</p>
          <p className="text-xl font-bold text-red-900">{formatUGX(arrears.totalArrearsFromPreviousTerm)}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm text-orange-600 mb-1">Students in Arrears</p>
          <p className="text-xl font-bold text-orange-900">{arrears.studentsWithArrears}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Arrears Recovery</h4>
        
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <span className="text-sm text-green-700">Recovered</span>
          <span className="font-bold text-green-800">{formatUGX(arrears.arrearsRecovered)}</span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
          <span className="text-sm text-orange-700">Carried Forward</span>
          <span className="font-bold text-orange-800">{formatUGX(arrears.arrearsCarriedForward)}</span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">Recovery Rate</span>
          <span className="font-bold text-blue-800">{formatPercentage(arrears.arrearsRecoveryRate)}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Average Arrears per Student</span>
          <span className="font-medium text-gray-900">{formatUGX(arrears.averageArrearsPerStudent)}</span>
        </div>
      </div>
    </Card>
  );
}

// ============================================
// CLEARANCE SUMMARY CARD
// ============================================

interface ClearanceSummaryCardProps {
  clearance: ClearanceSummary;
}

export function ClearanceSummaryCard({ clearance }: ClearanceSummaryCardProps) {
  const clearanceRate = clearance.clearanceRate;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Exam Clearance Summary</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{clearance.cleared}</p>
          <p className="text-sm text-green-600">Cleared</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{clearance.notCleared}</p>
          <p className="text-sm text-red-600">Not Cleared</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{clearance.totalEligible}</p>
          <p className="text-sm text-amber-600">Total Eligible</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Clearance Rate</span>
          <span className="text-sm text-gray-500">{formatPercentage(clearanceRate)}</span>
        </div>
        <ProgressBar value={clearanceRate} max={100} className="bg-green-500" />
      </div>

      {clearance.clearedByClass && clearance.clearedByClass.length > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">By Class</h4>
          {clearance.clearedByClass.slice(0, 3).map((cls) => (
            <div key={cls.className} className="flex items-center justify-between text-sm py-1">
              <span className="text-gray-600">{cls.className}</span>
              <span className="font-medium text-gray-900">
                {cls.cleared}/{cls.total} ({formatPercentage(cls.rate)})
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ============================================
// SCHOLARSHIP SUMMARY CARD
// ============================================

interface ScholarshipSummaryCardProps {
  scholarship: ScholarshipSummary;
}

export function ScholarshipSummaryCard({ scholarship }: ScholarshipSummaryCardProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Scholarship & Bursary Summary</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-purple-600 mb-1">Total Awarded</p>
          <p className="text-xl font-bold text-purple-900">{formatUGX(scholarship.totalAmountAwarded)}</p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4">
          <p className="text-sm text-indigo-600 mb-1">Recipients</p>
          <p className="text-xl font-bold text-indigo-900">{scholarship.totalBeneficiaries}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">By Type</h4>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <span className="text-sm font-medium text-gray-900">Full Scholarships</span>
          </div>
          <span className="font-bold text-gray-900">{scholarship.fullScholarships}</span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <span className="text-sm font-medium text-gray-900">Partial Scholarships</span>
          </div>
          <span className="font-bold text-gray-900">{scholarship.partialScholarships}</span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <span className="text-sm font-medium text-gray-900">Bursaries</span>
          </div>
          <span className="font-bold text-gray-900">{scholarship.bursaries}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total Scholarships</span>
          <span className="font-medium text-gray-900">{scholarship.totalScholarships}</span>
        </div>
      </div>
    </Card>
  );
}

// ============================================
// WEEKLY TREND CHART
// ============================================

interface WeeklyTrendChartProps {
  data: WeeklyCollectionData[];
  peakDay?: string;
}

export function WeeklyTrendChart({ data, peakDay }: WeeklyTrendChartProps) {
  const maxAmount = Math.max(...data.map(d => d.amount));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Collection Trends</h3>
      
      <div className="space-y-4">
        {data.map((week, index) => {
          const barWidth = (week.amount / maxAmount) * 100;
          const isPeak = peakDay && new Date(peakDay) >= new Date(week.weekStart) && 
                        new Date(peakDay) <= new Date(week.weekEnd);
          
          return (
            <div key={week.weekNumber} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Week {week.weekNumber}
                  {isPeak && (
                    <Badge variant="success" className="ml-2">Peak Week</Badge>
                  )}
                </span>
                <span className="text-sm text-gray-500">
                  {formatUGX(week.amount)}
                  <span className="text-xs text-gray-400 ml-1">({week.transactionCount} txns)</span>
                </span>
              </div>
              <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`absolute h-full rounded-full transition-all duration-500 ${
                    isPeak ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{new Date(week.weekStart).toLocaleDateString('en-UG', { day: '2-digit', month: 'short' })}</span>
                <span>{new Date(week.weekEnd).toLocaleDateString('en-UG', { day: '2-digit', month: 'short' })}</span>
              </div>
            </div>
          );
        })}
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No collection data available for this term
        </div>
      )}
    </Card>
  );
}

// ============================================
// REPORT EXPORT BUTTONS
// ============================================

interface ReportExportButtonsProps {
  onExport: (format: 'pdf' | 'excel' | 'csv') => void;
  isExporting?: boolean;
  termName?: string;
}

export function ReportExportButtons({ onExport, isExporting, termName }: ReportExportButtonsProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">Export Report</h4>
          <p className="text-sm text-gray-500">
            {termName ? `Download ${termName} financial summary` : 'Download term financial summary'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onExport('pdf')}
            disabled={isExporting}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => onExport('excel')}
            disabled={isExporting}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => onExport('csv')}
            disabled={isExporting}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ============================================
// TERM SELECTOR
// ============================================

interface TermSelectorProps {
  selectedTerm: string;
  selectedYear: number;
  onTermChange: (term: string) => void;
  onYearChange: (year: number) => void;
  onGenerate: () => void;
  isLoading?: boolean;
}

export function TermSelector({
  selectedTerm,
  selectedYear,
  onTermChange,
  onYearChange,
  onGenerate,
  isLoading,
}: TermSelectorProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-4">
          <select
            value={selectedTerm}
            onChange={(e) => onTermChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Term 1">Term 1 (Feb - May)</option>
            <option value="Term 2">Term 2 (May - Aug)</option>
            <option value="Term 3">Term 3 (Sep - Dec)</option>
          </select>

          <select
            value={selectedYear}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <Button
          onClick={onGenerate}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </>
          ) : (
            'Generate Report'
          )}
        </Button>
      </div>
    </Card>
  );
}
