/**
 * Category Collection Report Component
 * 
 * Displays collection statistics by fee category for school administrators.
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCategoryCollectionReport } from '@/hooks/useFeeCategories';

interface CategoryCollectionReportProps {
  academicYear?: string;
  term?: 1 | 2 | 3;
  className?: string;
}

export function CategoryCollectionReport({
  academicYear,
  term,
  className = '',
}: CategoryCollectionReportProps) {
  const currentYear = academicYear || new Date().getFullYear().toString();
  const currentTerm = term || 1;

  const { summary, isLoading, error, refresh } = useCategoryCollectionReport(currentYear, currentTerm);
  const [sortBy, setSortBy] = useState<'name' | 'collected' | 'percentage'>('percentage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCompact = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toString();
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getCategoryIcon = (categoryCode: string) => {
    const icons: Record<string, string> = {
      TUI: '📚',
      BRD: '🏠',
      LUN: '🍽️',
      TRN: '🚌',
      UNI: '👔',
      LAB: '🔬',
      EXM: '📝',
      XTR: '⚽',
      DEV: '🏗️',
      COM: '💻',
      LIB: '📖',
      MED: '🏥',
      PTA: '👥',
      SPT: '🏆',
      GRD: '🎓',
      REG: '📋',
      CUS: '📦',
    };
    return icons[categoryCode] || '📋';
  };

  const sortedSummary = [...summary].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.categoryName.localeCompare(b.categoryName);
        break;
      case 'collected':
        comparison = a.collected - b.collected;
        break;
      case 'percentage':
        comparison = a.percentage - b.percentage;
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const totals = summary.reduce(
    (acc, item) => ({
      collected: acc.collected + item.collected,
      expected: acc.expected + item.expected,
    }),
    { collected: 0, expected: 0 }
  );

  const overallPercentage = totals.expected > 0 ? (totals.collected / totals.expected) * 100 : 0;

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={refresh} variant="outline">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Collection by Category</h3>
          <p className="text-sm text-gray-500">
            {currentYear} - Term {currentTerm}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
            }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="percentage-desc">Highest Collection %</option>
            <option value="percentage-asc">Lowest Collection %</option>
            <option value="collected-desc">Highest Amount</option>
            <option value="collected-asc">Lowest Amount</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
          </select>
          <Button onClick={refresh} variant="outline" size="sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Expected</p>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(totals.expected)}</p>
          <p className="text-xs text-blue-500 mt-1">{summary.length} categories</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <p className="text-sm text-green-600 font-medium">Collected</p>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(totals.collected)}</p>
          <p className="text-xs text-green-500 mt-1">{overallPercentage.toFixed(1)}% of expected</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <p className="text-sm text-red-600 font-medium">Outstanding</p>
          <p className="text-2xl font-bold text-red-900">{formatCurrency(totals.expected - totals.collected)}</p>
          <p className="text-xs text-red-500 mt-1">{(100 - overallPercentage).toFixed(1)}% remaining</p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 font-medium">Overall Collection Progress</span>
          <span className="font-bold text-gray-900">{overallPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${getProgressColor(overallPercentage)}`}
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Category List */}
      <div className="space-y-3">
        {sortedSummary.map(category => (
          <div
            key={category.categoryId}
            className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getCategoryIcon(category.categoryCode)}</span>
                <div>
                  <p className="font-medium text-gray-900">{category.categoryName}</p>
                  <p className="text-xs text-gray-500">{category.categoryCode}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${category.percentage >= 70 ? 'text-green-600' : category.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {category.percentage.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">collection rate</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
              <div>
                <p className="text-gray-500">Expected</p>
                <p className="font-medium">{formatCurrency(category.expected)}</p>
              </div>
              <div>
                <p className="text-gray-500">Collected</p>
                <p className="font-medium text-green-600">{formatCurrency(category.collected)}</p>
              </div>
              <div>
                <p className="text-gray-500">Outstanding</p>
                <p className="font-medium text-red-600">{formatCurrency(category.expected - category.collected)}</p>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(category.percentage)}`}
                style={{ width: `${Math.min(category.percentage, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {sortedSummary.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">No category data available</p>
          <p className="text-sm mt-1">Configure fee categories to see collection reports</p>
        </div>
      )}

      {/* Print Button */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="print:hidden"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Report
        </Button>
      </div>
    </Card>
  );
}

// ============================================================================
// MINI CATEGORY CHART
// ============================================================================

interface MiniCategoryChartProps {
  categories: { name: string; collected: number; expected: number }[];
  className?: string;
}

export function MiniCategoryChart({ categories, className = '' }: MiniCategoryChartProps) {
  const formatCompact = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toString();
  };

  const maxExpected = Math.max(...categories.map(c => c.expected), 1);

  return (
    <div className={`space-y-2 ${className}`}>
      {categories.slice(0, 5).map((cat, index) => {
        const collectedPercent = (cat.collected / maxExpected) * 100;
        const expectedPercent = (cat.expected / maxExpected) * 100;

        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 truncate max-w-[60%]">{cat.name}</span>
              <span className="text-gray-900 font-medium">{formatCompact(cat.collected)}</span>
            </div>
            <div className="relative h-3 bg-gray-100 rounded-full">
              <div
                className="absolute h-3 bg-gray-200 rounded-full"
                style={{ width: `${expectedPercent}%` }}
              />
              <div
                className="absolute h-3 bg-green-500 rounded-full"
                style={{ width: `${collectedPercent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CategoryCollectionReport;
