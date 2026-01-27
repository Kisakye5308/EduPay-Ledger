/**
 * Parent Dashboard Page
 * Comprehensive dashboard for parents with multiple children
 * Uses new parent portal hooks and components
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  ParentDashboardOverview,
  StudentFeeCard,
  PaymentHistoryList,
  FeeStatementView,
  AnnouncementCard,
  QuickPayWidget,
} from '@/components/portal';
import {
  useParentDashboard,
  useStudentFeeOverview,
  usePaymentHistory,
  useFeeStatement,
  useAnnouncements,
  useQuickPay,
} from '@/hooks/useParentPortal';
import { formatUGX } from '@/types/parent-portal';

// Mock parent ID - in production this would come from authentication
const MOCK_PARENT_ID = 'parent-001';
const MOCK_SCHOOL_ID = 'school-001';

export default function ParentDashboardPage() {
  const router = useRouter();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'announcements' | 'payments'>('overview');

  // Hooks
  const { dashboard, isLoading: dashboardLoading, error: dashboardError } = useParentDashboard(MOCK_PARENT_ID);
  const { overview, isLoading: overviewLoading } = useStudentFeeOverview(selectedChildId);
  const { payments, isLoading: paymentsLoading } = usePaymentHistory(dashboard?.children?.map(c => c.id) || []);
  const { statement, isLoading: statementLoading, generate: generateStatement } = useFeeStatement(selectedChildId);
  const { announcements, isLoading: announcementsLoading } = useAnnouncements(MOCK_SCHOOL_ID, ['S.3'], ['boarder']);
  const { initiatePay, isProcessing } = useQuickPay();

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
  };

  const handleViewStatement = async () => {
    if (selectedChildId) {
      await generateStatement({
        name: 'Demo School',
        address: 'Kampala, Uganda',
        phone: '+256700000000',
        email: 'info@demoschool.ug'
      });
      setShowStatementModal(true);
    }
  };

  const handleQuickPay = async (amount: number, phone: string, provider: 'mtn' | 'airtel') => {
    if (!selectedChildId) return;
    
    const result = await initiatePay(selectedChildId, amount, phone, provider);

    if (result?.success) {
      alert('Payment initiated! Check your phone for the prompt.');
      setShowPayModal(false);
    }
  };

  if (dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (dashboardError || !dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-500 mb-4">{dashboardError || 'Please try again later'}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-6 -mx-4 sm:mx-0">
        <h1 className="text-2xl font-bold">Welcome, Parent!</h1>
        <p className="text-blue-100 mt-1">View your children's fee status and make payments</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {(['overview', 'announcements', 'payments'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'announcements' && dashboard.unreadAnnouncements > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {dashboard.unreadAnnouncements}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Dashboard Overview */}
          <div className="space-y-6">
            <ParentDashboardOverview
              dashboard={dashboard}
              onSelectChild={handleSelectChild}
              onViewPayments={() => setActiveTab('payments')}
              onViewPromises={() => router.push('/parent/promises')}
            />
          </div>

          {/* Right Column - Selected Child Details */}
          <div className="space-y-6">
            {selectedChildId && overview ? (
              <StudentFeeCard
                overview={overview}
                onPayNow={() => setShowPayModal(true)}
                onViewStatement={handleViewStatement}
                onMakePromise={() => router.push(`/parent/student/${selectedChildId}/promise`)}
              />
            ) : (
              <Card className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
                <p className="text-gray-500">Select a child from the list to view their fee details</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">School Announcements</h2>
          {announcementsLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading announcements...</p>
            </div>
          ) : announcements.length > 0 ? (
            announcements.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} />
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No announcements at this time</p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Payment History</h2>
            <Button variant="outline" size="sm">
              Download All Receipts
            </Button>
          </div>
          {paymentsLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading payments...</p>
            </div>
          ) : (
            <PaymentHistoryList
              payments={payments}
              onViewReceipt={(paymentId) => router.push(`/parent/receipt/${paymentId}`)}
            />
          )}
        </div>
      )}

      {/* Quick Pay Modal */}
      {showPayModal && selectedChildId && overview && (
        <Modal
          isOpen={showPayModal}
          onClose={() => setShowPayModal(false)}
          title="Quick Payment"
        >
          <QuickPayWidget
            studentName={overview.studentName}
            balance={overview.totalOwed}
            onPay={handleQuickPay}
            isProcessing={isProcessing}
          />
        </Modal>
      )}

      {/* Statement Modal */}
      {showStatementModal && statement && (
        <Modal
          isOpen={showStatementModal}
          onClose={() => setShowStatementModal(false)}
          title="Fee Statement"
          size="lg"
        >
          <FeeStatementView
            statement={statement}
            onPrint={() => window.print()}
            onDownload={() => {
              // In production, generate PDF
              alert('PDF download feature coming soon!');
            }}
          />
        </Modal>
      )}

      {/* Help Section */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-semibold text-blue-800">Need Help?</h3>
            <p className="text-sm text-blue-700 mt-1">
              If you have questions about your child's fees or need assistance with payments,
              please contact the school bursar's office during working hours.
            </p>
            <div className="flex gap-3 mt-3">
              <Button variant="outline" size="sm">
                📞 Call School
              </Button>
              <Button variant="outline" size="sm">
                ✉️ Send Message
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
