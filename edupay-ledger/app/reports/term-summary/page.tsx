/**
 * End-of-Term Financial Summary Page
 * Comprehensive term-end reporting for school bursars
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useTermReporting, useOutstandingStudents } from '../../../hooks/useTermSummary';
import {
  SummaryOverviewCard,
  CollectionByClassTable,
  CollectionByCategoryChart,
  OutstandingStudentsTable,
  ArrearsSummaryCard,
  ClearanceSummaryCard,
  ScholarshipSummaryCard,
  WeeklyTrendChart,
  ReportExportButtons,
  TermSelector,
} from '../../../components/reports';
import { Card } from '../../../components/ui/Card';

export default function TermSummaryPage() {
  // Mock school and user IDs for development
  const schoolId = 'school-001';
  const userId = 'user-001';

  const {
    selectedTerm,
    selectedYear,
    activeTab,
    summary,
    trends,
    classPerformance,
    isLoading,
    isExporting,
    setSelectedTerm,
    setSelectedYear,
    setActiveTab,
    generateReport,
    exportReport,
  } = useTermReporting(schoolId, userId);

  const { students: outstandingStudents, totalOutstanding, byClass } = useOutstandingStudents(schoolId);

  // Auto-generate report on initial load
  useEffect(() => {
    generateReport();
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'classes', label: 'By Class', icon: '🏫' },
    { id: 'students', label: 'Outstanding', icon: '👥' },
    { id: 'trends', label: 'Trends', icon: '📈' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">End-of-Term Financial Summary</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate comprehensive term-end reports with collection analysis, outstanding balances, and trends.
          </p>
        </div>

        {/* Term Selector */}
        <div className="mb-6">
          <TermSelector
            selectedTerm={selectedTerm}
            selectedYear={selectedYear}
            onTermChange={setSelectedTerm}
            onYearChange={setSelectedYear}
            onGenerate={generateReport}
            isLoading={isLoading}
          />
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-2 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-gray-600">Generating report...</p>
            </div>
          </div>
        )}

        {/* Content */}
        {!isLoading && summary && (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Main Summary */}
                <SummaryOverviewCard summary={summary} />

                {/* Export Buttons */}
                <ReportExportButtons
                  onExport={exportReport}
                  isExporting={isExporting}
                  termName={`${summary.term} ${summary.year}`}
                />

                {/* Grid of Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Arrears */}
                  {summary.arrearsSummary && (
                    <ArrearsSummaryCard arrears={summary.arrearsSummary} />
                  )}

                  {/* Clearance */}
                  {summary.clearanceSummary && (
                    <ClearanceSummaryCard clearance={summary.clearanceSummary} />
                  )}

                  {/* Scholarships */}
                  {summary.scholarshipSummary && (
                    <ScholarshipSummaryCard scholarship={summary.scholarshipSummary} />
                  )}
                </div>

                {/* Category Breakdown */}
                <CollectionByCategoryChart categories={summary.collectionByCategory} />
              </div>
            )}

            {/* Classes Tab */}
            {activeTab === 'classes' && (
              <div className="space-y-6">
                <CollectionByClassTable classes={summary.collectionByClass} />

                {/* Class Performance Summary */}
                {classPerformance && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">🏆 Top Performers</h3>
                      <div className="space-y-3">
                        {classPerformance.topPerformers.map((cls, index) => (
                          <div 
                            key={cls.className}
                            className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-green-700">#{index + 1}</span>
                              <span className="font-medium text-gray-900">{cls.className}</span>
                            </div>
                            <span className="text-green-700 font-medium">
                              {cls.collectionRate.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">⚠️ Needs Attention</h3>
                      <div className="space-y-3">
                        {classPerformance.bottomPerformers.map((cls, index) => (
                          <div 
                            key={cls.className}
                            className="flex items-center justify-between p-3 bg-amber-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-amber-700">#{classPerformance.classes.length - index}</span>
                              <span className="font-medium text-gray-900">{cls.className}</span>
                            </div>
                            <span className="text-amber-700 font-medium">
                              {cls.collectionRate.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* Outstanding Students Tab */}
            {activeTab === 'students' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6 bg-red-50">
                    <p className="text-sm text-red-600 mb-1">Total Outstanding</p>
                    <p className="text-2xl font-bold text-red-900">
                      UGX {(totalOutstanding / 1000000).toFixed(1)}M
                    </p>
                  </Card>
                  <Card className="p-6 bg-amber-50">
                    <p className="text-sm text-amber-600 mb-1">Students with Balance</p>
                    <p className="text-2xl font-bold text-amber-900">{outstandingStudents.length}</p>
                  </Card>
                  <Card className="p-6 bg-blue-50">
                    <p className="text-sm text-blue-600 mb-1">Classes Affected</p>
                    <p className="text-2xl font-bold text-blue-900">{Object.keys(byClass).length}</p>
                  </Card>
                </div>

                {/* Outstanding Students Table */}
                <OutstandingStudentsTable
                  students={outstandingStudents}
                  onStudentClick={(id) => console.log('View student:', id)}
                  onSendReminder={(id) => console.log('Send reminder:', id)}
                />
              </div>
            )}

            {/* Trends Tab */}
            {activeTab === 'trends' && (
              <div className="space-y-6">
                {/* Weekly Collection Chart */}
                <WeeklyTrendChart 
                  data={summary.weeklyCollection}
                  peakDay={summary.peakCollectionDay?.date instanceof Date 
                    ? summary.peakCollectionDay.date.toISOString() 
                    : undefined}
                />

                {/* Trend Analysis */}
                {trends && (
                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Trend Analysis</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Collection Trend</p>
                        <p className={`text-xl font-bold capitalize ${
                          trends.trendDirection === 'increasing' ? 'text-green-600' :
                          trends.trendDirection === 'decreasing' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {trends.trendDirection === 'increasing' ? '📈' : 
                           trends.trendDirection === 'decreasing' ? '📉' : '➡️'} {trends.trendDirection}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Avg. Weekly Collection</p>
                        <p className="text-xl font-bold text-gray-900">
                          UGX {(trends.averageWeeklyCollection / 1000000).toFixed(1)}M
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Best vs Worst Week</p>
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 font-medium">
                            {((trends.bestWeek?.amount || 0) / 1000000).toFixed(1)}M
                          </span>
                          <span className="text-gray-400">vs</span>
                          <span className="text-red-600 font-medium">
                            {((trends.worstWeek?.amount || 0) / 1000000).toFixed(1)}M
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Payment Method Distribution */}
                {summary.collectionByPaymentMethod && (
                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">💳 Payment Methods</h3>
                    
                    <div className="space-y-4">
                      {summary.collectionByPaymentMethod.map((method) => {
                        const percentage = method.percentage;
                        return (
                          <div key={method.method} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700 capitalize">
                                {method.method.replace('_', ' ')}
                              </span>
                              <span className="text-sm text-gray-500">
                                UGX {(method.totalAmount / 1000000).toFixed(1)}M ({method.transactionCount} txns)
                              </span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </>
        )}

        {/* No Data State */}
        {!isLoading && !summary && (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Report Generated</h3>
            <p className="text-gray-500 mb-6">
              Select a term and year, then click "Generate Report" to create a comprehensive financial summary.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
