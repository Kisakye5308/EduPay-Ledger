'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ExamClearanceReport } from '@/components/clearance/ExamClearanceReport';

export default function ClearancePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [examType, setExamType] = useState<string>('end_of_term');
  const [term, setTerm] = useState<1 | 2 | 3>(1);
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="p-4 lg:p-8 bg-background-light dark:bg-background-dark min-h-full">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-background-light dark:bg-background-dark min-h-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            📋 Exam Clearance
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage student clearance for examinations based on fee payment status
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Year Selector */}
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-slate-800"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>

          {/* Term Selector */}
          <select
            value={term}
            onChange={(e) => setTerm(parseInt(e.target.value) as 1 | 2 | 3)}
            className="border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-slate-800"
          >
            <option value={1}>Term 1</option>
            <option value={2}>Term 2</option>
            <option value={3}>Term 3</option>
          </select>

          {/* Exam Type Selector */}
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            className="border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-slate-800"
          >
            <option value="end_of_term">End of Term Exams</option>
            <option value="midterm">Mid-Term Exams</option>
            <option value="mock">Mock Exams</option>
            <option value="national">National Exams (UCE/UACE)</option>
          </select>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">How It Works</h3>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Students must meet minimum payment thresholds to be cleared for exams. 
            Conditional clearance can be granted with a payment promise.
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Clearance Threshold</h3>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            <strong>70%</strong> minimum payment required for end of term exams. 
            Exam fees must be paid in full.
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
          <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300">Quick Actions</h3>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            Print cleared lists • Export blocked students • Send SMS reminders • 
            Process class clearance
          </p>
        </div>
      </div>

      {/* Main Report */}
      <ExamClearanceReport
        academicYear={academicYear}
        term={term}
        examType={examType}
      />

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
        <p>
          Clearance is processed automatically based on configured thresholds. 
          Contact administration for special exemptions.
        </p>
      </footer>
    </div>
  );
}
