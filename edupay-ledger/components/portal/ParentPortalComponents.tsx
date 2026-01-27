/**
 * Parent Portal Components
 * UI components for parent-facing fee visibility and payment features
 */

'use client';

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/Progress';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import {
  ParentStudentFeeOverview,
  ParentPaymentHistoryItem,
  FeeStatement,
  PaymentReceipt,
  ParentAnnouncement,
  ParentDashboardSummary,
  formatUGX,
  getPaymentMethodName,
} from '../../types/parent-portal';

// ============================================
// PARENT DASHBOARD OVERVIEW
// ============================================

interface ParentDashboardOverviewProps {
  dashboard: ParentDashboardSummary;
  onSelectChild: (childId: string) => void;
  onViewPayments: () => void;
  onViewPromises: () => void;
}

export function ParentDashboardOverview({
  dashboard,
  onSelectChild,
  onViewPayments,
  onViewPromises,
}: ParentDashboardOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{dashboard.totalChildren}</p>
          <p className="text-sm text-gray-500">Children</p>
        </Card>
        <Card className="p-4 text-center bg-red-50">
          <p className="text-3xl font-bold text-red-600">{formatUGX(dashboard.totalBalance)}</p>
          <p className="text-sm text-gray-500">Total Balance</p>
        </Card>
        <Card className="p-4 text-center bg-green-50">
          <p className="text-3xl font-bold text-green-600">{formatUGX(dashboard.totalPaidThisTerm)}</p>
          <p className="text-sm text-gray-500">Paid This Term</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{dashboard.unreadAnnouncements}</p>
          <p className="text-sm text-gray-500">Notifications</p>
        </Card>
      </div>

      {/* Children List */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">My Children</h3>
        <div className="space-y-3">
          {dashboard.children.map((child) => (
            <div
              key={child.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => onSelectChild(child.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600">
                    {child.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{child.name}</p>
                  <p className="text-sm text-gray-500">{child.className}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-red-600">{formatUGX(child.balance)}</p>
                <div className="flex items-center gap-2">
                  <ProgressBar value={child.paymentProgress} className="w-20 h-2" />
                  <span className="text-sm text-gray-500">{child.paymentProgress}%</span>
                </div>
                {child.isCleared ? (
                  <Badge variant="success" className="mt-1">Cleared</Badge>
                ) : (
                  <Badge variant="warning" className="mt-1">Not Cleared</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Payments & Promises */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Recent Payments</h3>
            <Button variant="ghost" size="sm" onClick={onViewPayments}>
              View All →
            </Button>
          </div>
          {dashboard.recentPayments.length > 0 ? (
            <div className="space-y-2">
              {dashboard.recentPayments.map((payment) => (
                <div key={payment.id} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{payment.studentName}</p>
                    <p className="text-gray-500">
                      {new Date(payment.date).toLocaleDateString('en-UG', { 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </p>
                  </div>
                  <span className="font-semibold text-green-600">
                    +{formatUGX(payment.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No recent payments</p>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Payment Promises</h3>
            <Button variant="ghost" size="sm" onClick={onViewPromises}>
              View All →
            </Button>
          </div>
          {dashboard.activePromises.length > 0 ? (
            <div className="space-y-2">
              {dashboard.activePromises.map((promise) => (
                <div key={promise.id} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{promise.studentName}</p>
                    <p className="text-gray-500">
                      Due: {new Date(promise.dueDate).toLocaleDateString('en-UG', { 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{formatUGX(promise.amount)}</span>
                    <Badge variant="primary" className="ml-2">{promise.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No active promises</p>
          )}
        </Card>
      </div>
    </div>
  );
}

// ============================================
// STUDENT FEE CARD (DETAILED VIEW)
// ============================================

interface StudentFeeCardProps {
  overview: ParentStudentFeeOverview;
  onPayNow?: () => void;
  onViewStatement?: () => void;
  onMakePromise?: () => void;
}

export function StudentFeeCard({
  overview,
  onPayNow,
  onViewStatement,
  onMakePromise,
}: StudentFeeCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold">{overview.studentName.charAt(0)}</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{overview.studentName}</h2>
            <p className="text-blue-100">{overview.className} • {overview.residenceType}</p>
          </div>
        </div>
      </div>

      {/* Clearance Status Banner */}
      <div className={`px-6 py-3 ${overview.clearanceStatus.isCleared ? 'bg-green-50' : 'bg-yellow-50'}`}>
        <div className="flex items-center gap-2">
          {overview.clearanceStatus.isCleared ? (
            <>
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-700 font-medium">{overview.clearanceStatus.message}</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-yellow-700 font-medium">{overview.clearanceStatus.message}</span>
            </>
          )}
        </div>
      </div>

      {/* Fee Summary */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {formatUGX(overview.currentTerm.totalFees)}
            </p>
            <p className="text-sm text-gray-500">Total Fees</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {formatUGX(overview.currentTerm.totalPaid)}
            </p>
            <p className="text-sm text-gray-500">Total Paid</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">
              {formatUGX(overview.currentTerm.balance)}
            </p>
            <p className="text-sm text-gray-500">Balance</p>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Payment Progress</span>
            <span className="font-medium">{overview.currentTerm.paymentProgress}%</span>
          </div>
          <ProgressBar value={overview.currentTerm.paymentProgress} className="h-3" />
        </div>

        {/* Previous Balance */}
        {overview.previousBalance > 0 && (
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-orange-700">Previous Term Balance</span>
              <span className="font-semibold text-orange-700">
                {formatUGX(overview.previousBalance)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1 pt-1 border-t border-orange-200">
              <span className="text-orange-800 font-medium">Total Owed</span>
              <span className="font-bold text-orange-800">
                {formatUGX(overview.totalOwed)}
              </span>
            </div>
          </div>
        )}

        {/* Fee Breakdown Toggle */}
        <button
          className="w-full text-left text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
          onClick={() => setShowBreakdown(!showBreakdown)}
        >
          {showBreakdown ? '▼' : '▶'} View Fee Breakdown
        </button>

        {showBreakdown && (
          <div className="space-y-2">
            {overview.feeBreakdown.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm py-2 border-b">
                <span className="text-gray-600">{item.category}</span>
                <div className="text-right">
                  <span className="font-medium">{formatUGX(item.amount)}</span>
                  {item.balance > 0 && (
                    <span className="text-red-500 text-xs ml-2">
                      (Bal: {formatUGX(item.balance)})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active Promise */}
        {overview.activePromise && (
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-700 font-medium">Active Payment Promise</p>
            <div className="flex justify-between items-center mt-1">
              <span className="text-blue-600">{formatUGX(overview.activePromise.amount)}</span>
              <span className="text-blue-600">
                Due: {new Date(overview.activePromise.dueDate).toLocaleDateString('en-UG')}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {onPayNow && (
            <Button className="flex-1" onClick={onPayNow}>
              Pay Now
            </Button>
          )}
          {onMakePromise && !overview.activePromise && (
            <Button variant="outline" className="flex-1" onClick={onMakePromise}>
              Make Promise
            </Button>
          )}
          {onViewStatement && (
            <Button variant="ghost" onClick={onViewStatement}>
              📄 Statement
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// ============================================
// PAYMENT HISTORY LIST
// ============================================

interface PaymentHistoryListProps {
  payments: ParentPaymentHistoryItem[];
  onViewReceipt?: (paymentId: string) => void;
}

export function PaymentHistoryList({ payments, onViewReceipt }: PaymentHistoryListProps) {
  if (payments.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-500">No payment history yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <Card key={payment.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                payment.status === 'completed' ? 'bg-green-100' : 
                payment.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                {payment.status === 'completed' ? (
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-medium">{payment.studentName}</p>
                <p className="text-sm text-gray-500">
                  {new Date(payment.date).toLocaleDateString('en-UG', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-xs text-gray-400">
                  {getPaymentMethodName(payment.method)} • Ref: {payment.reference}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-600 text-lg">{formatUGX(payment.amount)}</p>
              {payment.receiptNumber && onViewReceipt && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onViewReceipt(payment.id)}
                  className="text-xs"
                >
                  Receipt #{payment.receiptNumber}
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ============================================
// FEE STATEMENT VIEW
// ============================================

interface FeeStatementViewProps {
  statement: FeeStatement;
  onPrint?: () => void;
  onDownload?: () => void;
}

export function FeeStatementView({ statement, onPrint, onDownload }: FeeStatementViewProps) {
  return (
    <div className="bg-white p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center border-b pb-6 mb-6">
        {statement.schoolLogo && (
          <img src={statement.schoolLogo} alt="School Logo" className="w-20 h-20 mx-auto mb-2" />
        )}
        <h1 className="text-2xl font-bold">{statement.schoolName}</h1>
        <p className="text-gray-600">{statement.schoolAddress}</p>
        <p className="text-gray-600">Tel: {statement.schoolPhone} | Email: {statement.schoolEmail}</p>
        <h2 className="text-lg font-semibold mt-4">FEE STATEMENT</h2>
        <p className="text-gray-500">{statement.term} - {statement.year}</p>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-500">Student Name</p>
          <p className="font-medium">{statement.studentName}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Admission No.</p>
          <p className="font-medium">{statement.admissionNumber}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Class</p>
          <p className="font-medium">{statement.className}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Guardian</p>
          <p className="font-medium">{statement.guardianName}</p>
        </div>
      </div>

      {/* Fee Items */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Fee Structure</h3>
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left py-2 px-4">Description</th>
              <th className="text-right py-2 px-4">Amount (UGX)</th>
            </tr>
          </thead>
          <tbody>
            {statement.feeItems.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="py-2 px-4">{item.description}</td>
                <td className="py-2 px-4 text-right">{item.amount.toLocaleString()}</td>
              </tr>
            ))}
            {statement.previousBalance > 0 && (
              <tr className="border-b bg-orange-50">
                <td className="py-2 px-4 text-orange-700">Previous Balance</td>
                <td className="py-2 px-4 text-right text-orange-700">{statement.previousBalance.toLocaleString()}</td>
              </tr>
            )}
            <tr className="font-bold bg-gray-100">
              <td className="py-2 px-4">Total Owed</td>
              <td className="py-2 px-4 text-right">{statement.totalOwed.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payments */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Payments Made</h3>
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left py-2 px-4">Date</th>
              <th className="text-left py-2 px-4">Reference</th>
              <th className="text-left py-2 px-4">Method</th>
              <th className="text-right py-2 px-4">Amount (UGX)</th>
            </tr>
          </thead>
          <tbody>
            {statement.payments.map((payment, index) => (
              <tr key={index} className="border-b">
                <td className="py-2 px-4">
                  {new Date(payment.date).toLocaleDateString('en-UG')}
                </td>
                <td className="py-2 px-4">{payment.reference}</td>
                <td className="py-2 px-4">{getPaymentMethodName(payment.method)}</td>
                <td className="py-2 px-4 text-right text-green-600">
                  {payment.amount.toLocaleString()}
                </td>
              </tr>
            ))}
            <tr className="font-bold bg-green-50">
              <td className="py-2 px-4" colSpan={3}>Total Paid</td>
              <td className="py-2 px-4 text-right text-green-600">
                {statement.totalPaid.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Balance */}
      <div className="p-4 bg-red-50 rounded-lg mb-6">
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg">Current Balance</span>
          <span className="font-bold text-xl text-red-600">
            {formatUGX(statement.currentBalance)}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 border-t pt-4">
        <p>Generated on {new Date(statement.generatedAt).toLocaleString('en-UG')}</p>
        <p>This is a computer-generated statement and does not require a signature.</p>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-3 mt-6 print:hidden">
        {onPrint && (
          <Button variant="outline" onClick={onPrint}>
            🖨️ Print
          </Button>
        )}
        {onDownload && (
          <Button variant="outline" onClick={onDownload}>
            📥 Download PDF
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================
// ANNOUNCEMENT CARD
// ============================================

interface AnnouncementCardProps {
  announcement: ParentAnnouncement;
  onMarkRead?: () => void;
}

export function AnnouncementCard({ announcement, onMarkRead }: AnnouncementCardProps) {
  const typeConfig = {
    general: { icon: '📢', color: 'blue' },
    fee_reminder: { icon: '💰', color: 'yellow' },
    deadline: { icon: '⏰', color: 'red' },
    event: { icon: '🎉', color: 'green' },
    urgent: { icon: '🚨', color: 'red' },
  };

  const config = typeConfig[announcement.type] || typeConfig.general;

  return (
    <Card className={`p-4 ${announcement.isRead === false ? 'border-l-4 border-blue-500' : ''}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{config.icon}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">{announcement.title}</h4>
            <span className="text-xs text-gray-400">
              {new Date(announcement.publishedAt).toLocaleDateString('en-UG')}
            </span>
          </div>
          <p className="text-gray-600 mt-1">{announcement.content}</p>
          {announcement.priority === 'high' && (
            <Badge variant="danger" className="mt-2">Important</Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

// ============================================
// QUICK PAY WIDGET
// ============================================

interface QuickPayWidgetProps {
  studentName: string;
  balance: number;
  onPay: (amount: number, phone: string, provider: 'mtn' | 'airtel') => Promise<void>;
  isProcessing: boolean;
}

export function QuickPayWidget({ studentName, balance, onPay, isProcessing }: QuickPayWidgetProps) {
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [provider, setProvider] = useState<'mtn' | 'airtel'>('mtn');

  const quickAmounts = [100000, 200000, 500000, 1000000];

  const handlePay = async () => {
    if (!amount || !phone) return;
    await onPay(parseFloat(amount), phone, provider);
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Quick Pay for {studentName}</h3>
      
      <div className="space-y-4">
        {/* Quick Amount Buttons */}
        <div>
          <label className="text-sm text-gray-500 block mb-2">Quick Select Amount</label>
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((amt) => (
              <Button
                key={amt}
                variant={amount === amt.toString() ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setAmount(amt.toString())}
              >
                {formatUGX(amt)}
              </Button>
            ))}
            <Button
              variant={amount === balance.toString() ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setAmount(balance.toString())}
            >
              Full Balance
            </Button>
          </div>
        </div>

        {/* Custom Amount */}
        <div>
          <label className="text-sm text-gray-500 block mb-1">Or Enter Amount</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="text-sm text-gray-500 block mb-1">Mobile Money Number</label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+256..."
          />
        </div>

        {/* Provider */}
        <div>
          <label className="text-sm text-gray-500 block mb-2">Provider</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={provider === 'mtn'}
                onChange={() => setProvider('mtn')}
                className="text-yellow-500"
              />
              <span className="font-medium">MTN Mobile Money</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={provider === 'airtel'}
                onChange={() => setProvider('airtel')}
                className="text-red-500"
              />
              <span className="font-medium">Airtel Money</span>
            </label>
          </div>
        </div>

        <Button 
          className="w-full" 
          onClick={handlePay}
          disabled={!amount || !phone || isProcessing}
        >
          {isProcessing ? 'Processing...' : `Pay ${amount ? formatUGX(parseFloat(amount)) : ''}`}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          You will receive a payment prompt on your phone
        </p>
      </div>
    </Card>
  );
}
