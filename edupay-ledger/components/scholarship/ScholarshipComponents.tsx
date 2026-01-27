/**
 * Scholarship Components
 * 
 * UI components for managing scholarships and bursaries.
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  Scholarship,
  StudentScholarship,
  SCHOLARSHIP_TYPE_LABELS,
  SCHOLARSHIP_TYPE_ICONS,
  SCHOLARSHIP_STATUS_LABELS,
  SCHOLARSHIP_STATUS_COLORS,
  COVERAGE_TYPE_LABELS,
} from '@/types/scholarship';
import { useScholarships, useScholarshipReport, useStudentScholarships } from '@/hooks/useScholarship';

// ============================================================================
// SCHOLARSHIP DASHBOARD CARD
// ============================================================================

interface ScholarshipDashboardCardProps {
  academicYear?: string;
  term?: 1 | 2 | 3;
  onViewDetails?: () => void;
  className?: string;
}

export function ScholarshipDashboardCard({
  academicYear,
  term,
  onViewDetails,
  className = '',
}: ScholarshipDashboardCardProps) {
  const { stats, isLoading } = useScholarshipReport(academicYear, term);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl mb-2">🎓</span>
          <p>No scholarship data available</p>
        </div>
      </Card>
    );
  }

  const utilizationRate = stats.totalAmount > 0 
    ? (stats.disbursedAmount / stats.totalAmount) * 100 
    : 0;

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Scholarships & Bursaries</h3>
          <p className="text-sm text-gray-500">Active sponsorships overview</p>
        </div>
        {onViewDetails && (
          <Button onClick={onViewDetails} variant="outline" size="sm">
            Manage
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🎓</span>
            <span className="text-xs text-purple-600 font-medium">Scholarships</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{stats.totalScholarships}</p>
          <p className="text-xs text-purple-500">active programs</p>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">👥</span>
            <span className="text-xs text-blue-600 font-medium">Beneficiaries</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.totalBeneficiaries}</p>
          <p className="text-xs text-blue-500">students sponsored</p>
        </div>

        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">💰</span>
            <span className="text-xs text-green-600 font-medium">Total Value</span>
          </div>
          <p className="text-xl font-bold text-green-900">{formatCurrency(stats.totalAmount)}</p>
          <p className="text-xs text-green-500">allocated</p>
        </div>

        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📊</span>
            <span className="text-xs text-orange-600 font-medium">Utilization</span>
          </div>
          <p className="text-2xl font-bold text-orange-900">{utilizationRate.toFixed(0)}%</p>
          <p className="text-xs text-orange-500">disbursed</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Disbursement Progress</span>
          <span>{formatCurrency(stats.disbursedAmount)} / {formatCurrency(stats.totalAmount)}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${utilizationRate}%` }}
          />
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// SCHOLARSHIP LIST
// ============================================================================

interface ScholarshipListProps {
  onScholarshipClick?: (scholarship: Scholarship) => void;
  onAddNew?: () => void;
  className?: string;
}

export function ScholarshipList({
  onScholarshipClick,
  onAddNew,
  className = '',
}: ScholarshipListProps) {
  const { scholarships, isLoading, error, refresh } = useScholarships();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredScholarships = scholarships.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sponsor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || s.type === filterType;
    const matchesStatus = !filterStatus || s.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-0 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Scholarships & Bursaries</h2>
          {onAddNew && (
            <Button onClick={onAddNew} variant="primary" size="sm">
              <span className="mr-1">+</span> Add Scholarship
            </Button>
          )}
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-grow max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="Search scholarships..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            {Object.entries(SCHOLARSHIP_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            {Object.entries(SCHOLARSHIP_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {filteredScholarships.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <span className="text-4xl block mb-2">🎓</span>
          <p className="text-lg font-medium">No scholarships found</p>
          <p className="text-sm">
            {searchTerm || filterType || filterStatus
              ? 'Try adjusting your filters'
              : 'Create your first scholarship program'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filteredScholarships.map(scholarship => {
            const statusColors = SCHOLARSHIP_STATUS_COLORS[scholarship.status];
            const utilizationRate = scholarship.totalBudget > 0
              ? (scholarship.disbursedAmount / scholarship.totalBudget) * 100
              : 0;

            return (
              <div
                key={scholarship.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${onScholarshipClick ? 'cursor-pointer' : ''}`}
                onClick={() => onScholarshipClick?.(scholarship)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {SCHOLARSHIP_TYPE_ICONS[scholarship.type]}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{scholarship.name}</h3>
                      <p className="text-sm text-gray-500">
                        {scholarship.code} • {scholarship.sponsor.name}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                    {SCHOLARSHIP_STATUS_LABELS[scholarship.status]}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-500">Type</p>
                    <p className="font-medium">{SCHOLARSHIP_TYPE_LABELS[scholarship.type]}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Coverage</p>
                    <p className="font-medium">{COVERAGE_TYPE_LABELS[scholarship.coverageType]}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Beneficiaries</p>
                    <p className="font-medium">
                      {scholarship.currentBeneficiaries}
                      {scholarship.maxBeneficiaries && ` / ${scholarship.maxBeneficiaries}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Budget</p>
                    <p className="font-medium">{formatCurrency(scholarship.totalBudget)}</p>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Disbursed: {formatCurrency(scholarship.disbursedAmount)}</span>
                    <span>Remaining: {formatCurrency(scholarship.remainingBudget)}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${utilizationRate}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        Showing {filteredScholarships.length} of {scholarships.length} scholarships
      </div>
    </Card>
  );
}

// ============================================================================
// STUDENT SCHOLARSHIP CARD
// ============================================================================

interface StudentScholarshipCardProps {
  studentId: string;
  academicYear?: string;
  term?: 1 | 2 | 3;
  showDetails?: boolean;
  className?: string;
}

export function StudentScholarshipCard({
  studentId,
  academicYear,
  term,
  showDetails = true,
  className = '',
}: StudentScholarshipCardProps) {
  const { scholarships, isLoading, totalAmount, totalDisbursed, activeCount } = useStudentScholarships(
    studentId,
    academicYear,
    term
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (scholarships.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-4 text-gray-500">
          <span className="text-2xl block mb-2">🎓</span>
          <p className="text-sm">No scholarships assigned</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Scholarships</h3>
        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
          {activeCount} active
        </span>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Support</p>
            <p className="text-xl font-bold text-purple-900">{formatCurrency(totalAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Disbursed</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalDisbursed)}</p>
          </div>
        </div>
      </div>

      {/* Scholarship List */}
      {showDetails && (
        <div className="space-y-3">
          {scholarships.map(ss => (
            <div
              key={ss.id}
              className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{SCHOLARSHIP_TYPE_ICONS[ss.scholarshipType]}</span>
                  <div>
                    <p className="font-medium text-gray-900">{ss.scholarshipName}</p>
                    <p className="text-xs text-gray-500">{ss.sponsorName}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  ss.status === 'active' ? 'bg-green-100 text-green-800' :
                  ss.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {ss.status}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  {formatCurrency(ss.disbursedAmount)} / {formatCurrency(ss.allocatedAmount)}
                </span>
                <span className={`font-medium ${
                  ss.remainingAmount > 0 ? 'text-blue-600' : 'text-green-600'
                }`}>
                  {ss.remainingAmount > 0 ? formatCurrency(ss.remainingAmount) + ' remaining' : 'Fully disbursed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ============================================================================
// SCHOLARSHIP BADGE
// ============================================================================

interface ScholarshipBadgeProps {
  type: string;
  name: string;
  size?: 'sm' | 'md';
}

export function ScholarshipBadge({ type, name, size = 'md' }: ScholarshipBadgeProps) {
  const icon = SCHOLARSHIP_TYPE_ICONS[type as keyof typeof SCHOLARSHIP_TYPE_ICONS] || '🎓';
  
  return (
    <span className={`inline-flex items-center gap-1 bg-purple-100 text-purple-800 rounded-full font-medium ${
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    }`}>
      <span>{icon}</span>
      {name}
    </span>
  );
}

export default ScholarshipList;
