/**
 * Fee Category Breakdown Component
 * 
 * Displays a student's fee breakdown by category with visual progress indicators.
 * Used in student profile pages and payment recording.
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { StudentFeeBreakdown, StudentFeeCategoryStatus, FEE_CATEGORY_COLORS, FEE_CATEGORY_ICONS } from '@/types/fee-category';

interface FeeCategoryBreakdownProps {
  breakdown: StudentFeeBreakdown | null;
  isLoading?: boolean;
  showDetails?: boolean;
  showPaymentHistory?: boolean;
  onRecordPayment?: () => void;
  className?: string;
}

export function FeeCategoryBreakdown({
  breakdown,
  isLoading = false,
  showDetails = true,
  showPaymentHistory = false,
  onRecordPayment,
  className = '',
}: FeeCategoryBreakdownProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!breakdown) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No fee breakdown available</p>
          <p className="text-sm mt-1">Fee structure has not been assigned to this student</p>
        </div>
      </Card>
    );
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: StudentFeeCategoryStatus['status']) => {
    const variants: Record<string, { color: string; text: string }> = {
      fully_paid: { color: 'bg-green-100 text-green-800', text: 'Paid' },
      partially_paid: { color: 'bg-yellow-100 text-yellow-800', text: 'Partial' },
      unpaid: { color: 'bg-red-100 text-red-800', text: 'Unpaid' },
      waived: { color: 'bg-blue-100 text-blue-800', text: 'Waived' },
      pending_scholarship: { color: 'bg-purple-100 text-purple-800', text: 'Scholarship' },
    };
    const variant = variants[status] || variants.unpaid;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variant.color}`}>
        {variant.text}
      </span>
    );
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
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

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Fee Breakdown</h3>
          <p className="text-sm text-gray-500">
            {breakdown.academicYear} - Term {breakdown.term}
          </p>
        </div>
        {onRecordPayment && (
          <Button onClick={onRecordPayment} size="sm">
            Record Payment
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Total Fees</p>
          <p className="text-xl font-bold text-blue-900">{formatCurrency(breakdown.totalAmount ?? breakdown.totalFees)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Paid</p>
          <p className="text-xl font-bold text-green-900">{formatCurrency(breakdown.totalPaid)}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-600 font-medium">Balance</p>
          <p className="text-xl font-bold text-red-900">{formatCurrency(breakdown.totalBalance)}</p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Overall Payment Progress</span>
          <span className="font-medium">{(breakdown.paymentPercentage ?? ((breakdown.totalPaid / breakdown.totalFees) * 100)).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(breakdown.paymentPercentage ?? ((breakdown.totalPaid / breakdown.totalFees) * 100))}`}
            style={{ width: `${Math.min(breakdown.paymentPercentage ?? ((breakdown.totalPaid / breakdown.totalFees) * 100), 100)}%` }}
          />
        </div>
      </div>

      {/* Category Breakdown */}
      {showDetails && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Category Details</h4>
          {breakdown.categories.map(category => {
            const categoryAmount = category.amount ?? category.amountDue;
            const categoryPaid = category.paid ?? category.amountPaid;
            const percentage = categoryAmount > 0 ? (categoryPaid / categoryAmount) * 100 : 0;
            const isExpanded = expandedCategories.has(category.categoryId);

            return (
              <div
                key={category.categoryId}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleCategory(category.categoryId)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCategoryIcon(category.categoryCode)}</span>
                      <div>
                        <p className="font-medium text-gray-900">{category.categoryName}</p>
                        <p className="text-xs text-gray-500">{category.categoryCode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(category.status)}
                      <svg
                        className={`w-5 h-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">
                      {formatCurrency(categoryPaid)} / {formatCurrency(categoryAmount)}
                    </span>
                    <span className={`font-medium ${percentage >= 100 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(percentage)}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>

                  {category.balance > 0 && (
                    <p className="text-xs text-red-600 mt-2">
                      Balance: {formatCurrency(category.balance)}
                    </p>
                  )}

                  {category.waivedAmount && category.waivedAmount > 0 && (
                    <p className="text-xs text-blue-600 mt-1">
                      Waived: {formatCurrency(category.waivedAmount)} ({category.waiverReason || 'No reason provided'})
                    </p>
                  )}

                  {category.scholarshipAmount && category.scholarshipAmount > 0 && (
                    <p className="text-xs text-purple-600 mt-1">
                      Scholarship: {formatCurrency(category.scholarshipAmount)}
                      {category.scholarshipId && ` (ID: ${category.scholarshipId})`}
                    </p>
                  )}
                </div>

                {/* Expanded Payment History */}
                {isExpanded && showPaymentHistory && category.paymentHistory && category.paymentHistory.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <h5 className="text-xs font-medium text-gray-500 uppercase mb-2">Payment History</h5>
                    <div className="space-y-2">
                      {category.paymentHistory.map((payment, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <div>
                            <span className="text-gray-700">{formatCurrency(payment.amount)}</span>
                            <span className="text-gray-400 ml-2">
                              {new Date(payment.date instanceof Date ? payment.date : payment.date.toDate()).toLocaleDateString('en-UG', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <span className="text-gray-500 text-xs">{payment.paymentId}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Carry Forward Balance */}
      {breakdown.carryForwardBalance !== undefined && breakdown.carryForwardBalance !== 0 && (
        <div className={`mt-4 p-3 rounded-lg ${breakdown.carryForwardBalance > 0 ? 'bg-orange-50 border border-orange-200' : 'bg-blue-50 border border-blue-200'}`}>
          <p className={`text-sm font-medium ${breakdown.carryForwardBalance > 0 ? 'text-orange-800' : 'text-blue-800'}`}>
            {breakdown.carryForwardBalance > 0 ? '⚠️ Carry Forward Balance (Previous Term)' : '💰 Credit Balance'}
          </p>
          <p className={`text-lg font-bold ${breakdown.carryForwardBalance > 0 ? 'text-orange-900' : 'text-blue-900'}`}>
            {formatCurrency(Math.abs(breakdown.carryForwardBalance))}
          </p>
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          Last updated: {new Date(breakdown.lastUpdated instanceof Date ? breakdown.lastUpdated : breakdown.lastUpdated.toDate()).toLocaleString('en-UG')}
        </p>
      </div>
    </Card>
  );
}

// ============================================================================
// FEE CATEGORY MINI SUMMARY
// ============================================================================

interface FeeCategoryMiniSummaryProps {
  categories: StudentFeeCategoryStatus[];
  onViewDetails?: () => void;
  className?: string;
}

export function FeeCategoryMiniSummary({
  categories,
  onViewDetails,
  className = '',
}: FeeCategoryMiniSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const fullyPaid = categories.filter(c => c.status === 'fully_paid' || c.status === 'paid').length;
  const partiallyPaid = categories.filter(c => c.status === 'partially_paid' || c.status === 'partial').length;
  const unpaid = categories.filter(c => c.status === 'unpaid').length;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex gap-1">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
          {fullyPaid} Paid
        </span>
        {partiallyPaid > 0 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
            {partiallyPaid} Partial
          </span>
        )}
        {unpaid > 0 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
            {unpaid} Unpaid
          </span>
        )}
      </div>
      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View Details →
        </button>
      )}
    </div>
  );
}

// ============================================================================
// PAYMENT ALLOCATION PREVIEW
// ============================================================================

interface PaymentAllocationPreviewProps {
  allocations: { categoryId: string; categoryName: string; amount: number }[];
  totalAmount: number;
  className?: string;
}

export function PaymentAllocationPreview({
  allocations,
  totalAmount,
  className = '',
}: PaymentAllocationPreviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const allocatedTotal = allocations.reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className={`bg-blue-50 rounded-lg p-4 ${className}`}>
      <h4 className="text-sm font-medium text-blue-900 mb-3">Payment Allocation Preview</h4>
      <div className="space-y-2">
        {allocations.filter(a => a.amount > 0).map(allocation => (
          <div key={allocation.categoryId} className="flex justify-between text-sm">
            <span className="text-blue-700">{allocation.categoryName}</span>
            <span className="font-medium text-blue-900">{formatCurrency(allocation.amount)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between">
        <span className="text-sm font-medium text-blue-800">Total Allocated</span>
        <span className="font-bold text-blue-900">{formatCurrency(allocatedTotal)}</span>
      </div>
      {allocatedTotal !== totalAmount && (
        <p className="text-xs text-amber-700 mt-2">
          ⚠️ Allocation differs from payment amount by {formatCurrency(Math.abs(totalAmount - allocatedTotal))}
        </p>
      )}
    </div>
  );
}

export default FeeCategoryBreakdown;
