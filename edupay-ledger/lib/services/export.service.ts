/**
 * Export Service
 * 
 * Handles exporting data to CSV and PDF formats
 */

import { formatUGX, formatDate } from '@/lib/utils';
import { Payment } from '@/types/payment';
import { Student } from '@/types/student';

/**
 * Converts data to CSV format
 */
export function toCSV(data: any[], columns: Array<{ key: string; header: string }>): string {
  const headers = columns.map(col => col.header).join(',');
  const rows = data.map(row => 
    columns.map(col => {
      const value = row[col.key];
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',')
  );
  
  return [headers, ...rows].join('\n');
}

/**
 * Downloads data as a CSV file
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports payments to CSV
 */
export function exportPaymentsToCSV(payments: Payment[], filename: string = 'payments'): void {
  const columns = [
    { key: 'receiptNumber', header: 'Receipt Number' },
    { key: 'studentName', header: 'Student Name' },
    { key: 'studentClass', header: 'Class' },
    { key: 'amount', header: 'Amount (UGX)' },
    { key: 'channel', header: 'Payment Channel' },
    { key: 'transactionRef', header: 'Transaction Reference' },
    { key: 'installmentName', header: 'Installment' },
    { key: 'recordedAt', header: 'Date' },
    { key: 'recordedBy', header: 'Recorded By' },
    { key: 'stellarAnchored', header: 'Blockchain Verified' },
  ];

  const data = payments.map(p => ({
    receiptNumber: p.receiptNumber,
    studentName: p.studentName,
    studentClass: `${p.studentClass}${p.studentStream ? ' - ' + p.studentStream : ''}`,
    amount: p.amount,
    channel: p.channelDetails || p.channel,
    transactionRef: p.transactionRef,
    installmentName: p.installmentName,
    recordedAt: p.recordedAt ? formatDate(p.recordedAt.toDate()) : '',
    recordedBy: p.recordedBy,
    stellarAnchored: p.stellarAnchored ? 'Yes' : 'No',
  }));

  const csv = toCSV(data, columns);
  downloadCSV(filename, csv);
}

/**
 * Exports students to CSV
 */
export function exportStudentsToCSV(students: Student[], filename: string = 'students'): void {
  const columns = [
    { key: 'studentId', header: 'Student ID' },
    { key: 'name', header: 'Full Name' },
    { key: 'class', header: 'Class' },
    { key: 'stream', header: 'Stream' },
    { key: 'guardianName', header: 'Guardian Name' },
    { key: 'guardianPhone', header: 'Guardian Phone' },
    { key: 'totalFees', header: 'Total Fees (UGX)' },
    { key: 'amountPaid', header: 'Amount Paid (UGX)' },
    { key: 'balance', header: 'Balance (UGX)' },
    { key: 'paymentStatus', header: 'Payment Status' },
  ];

  const data = students.map(s => ({
    studentId: s.studentId,
    name: `${s.firstName} ${s.middleName || ''} ${s.lastName}`.trim(),
    class: s.className,
    stream: s.streamName || 'N/A',
    guardianName: s.guardian.name,
    guardianPhone: s.guardian.phone,
    totalFees: s.totalFees,
    amountPaid: s.amountPaid,
    balance: s.balance,
    paymentStatus: s.paymentStatus.replace('_', ' '),
  }));

  const csv = toCSV(data, columns);
  downloadCSV(filename, csv);
}

/**
 * Exports arrears report to CSV
 */
export function exportArrearsToCSV(
  students: Array<Student & { daysOverdue: number }>,
  filename: string = 'arrears_report'
): void {
  const columns = [
    { key: 'studentId', header: 'Student ID' },
    { key: 'name', header: 'Full Name' },
    { key: 'class', header: 'Class' },
    { key: 'guardianName', header: 'Guardian Name' },
    { key: 'guardianPhone', header: 'Guardian Phone' },
    { key: 'balance', header: 'Outstanding (UGX)' },
    { key: 'daysOverdue', header: 'Days Overdue' },
    { key: 'severity', header: 'Severity' },
  ];

  const data = students.map(s => {
    const severity = s.daysOverdue >= 30 ? 'Critical' :
                     s.daysOverdue >= 15 ? 'High' :
                     s.daysOverdue >= 7 ? 'Medium' : 'Low';
    return {
      studentId: s.studentId,
      name: `${s.firstName} ${s.middleName || ''} ${s.lastName}`.trim(),
      class: `${s.className}${s.streamName ? ' - ' + s.streamName : ''}`,
      guardianName: s.guardian.name,
      guardianPhone: s.guardian.phone,
      balance: s.balance,
      daysOverdue: s.daysOverdue,
      severity,
    };
  });

  const csv = toCSV(data, columns);
  downloadCSV(filename, csv);
}

/**
 * Generates a summary report in HTML format for printing
 */
export function generateSummaryReportHTML(data: {
  schoolName: string;
  term: string;
  year: string;
  totalStudents: number;
  totalCollected: number;
  totalOutstanding: number;
  fullyPaidCount: number;
  partialCount: number;
  overdueCount: number;
  noPaidCount: number;
  payments: Payment[];
}): string {
  const collectionRate = Math.round((data.totalCollected / (data.totalCollected + data.totalOutstanding)) * 100);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Fee Collection Report - ${data.term} ${data.year}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #1b2b4b;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #1b2b4b;
          margin: 0 0 10px 0;
        }
        .header p {
          color: #666;
          margin: 5px 0;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .stat-card .value {
          font-size: 24px;
          font-weight: bold;
          color: #1b2b4b;
        }
        .stat-card .label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          margin-top: 5px;
        }
        .progress-bar {
          height: 20px;
          background: #e0e0e0;
          border-radius: 10px;
          overflow: hidden;
          margin: 20px 0;
        }
        .progress-bar .fill {
          height: 100%;
          background: #22c55e;
          border-radius: 10px;
          transition: width 0.3s;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background: #1b2b4b;
          color: white;
        }
        tr:nth-child(even) {
          background: #f9f9f9;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        @media print {
          body {
            padding: 20px;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${data.schoolName}</h1>
        <p>Fee Collection Report</p>
        <p><strong>${data.term} - ${data.year}</strong></p>
        <p>Generated: ${formatDate(new Date())}</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="value">${formatUGX(data.totalCollected)}</div>
          <div class="label">Total Collected</div>
        </div>
        <div class="stat-card">
          <div class="value">${formatUGX(data.totalOutstanding)}</div>
          <div class="label">Outstanding Balance</div>
        </div>
        <div class="stat-card">
          <div class="value">${collectionRate}%</div>
          <div class="label">Collection Rate</div>
        </div>
      </div>

      <h2>Collection Progress</h2>
      <div class="progress-bar">
        <div class="fill" style="width: ${collectionRate}%"></div>
      </div>

      <h2>Student Payment Status</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="value" style="color: #22c55e">${data.fullyPaidCount}</div>
          <div class="label">Fully Paid</div>
        </div>
        <div class="stat-card">
          <div class="value" style="color: #f59e0b">${data.partialCount}</div>
          <div class="label">Partial Payment</div>
        </div>
        <div class="stat-card">
          <div class="value" style="color: #ef4444">${data.overdueCount + data.noPaidCount}</div>
          <div class="label">Outstanding</div>
        </div>
      </div>

      <h2>Recent Payments</h2>
      <table>
        <thead>
          <tr>
            <th>Receipt #</th>
            <th>Student</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Channel</th>
          </tr>
        </thead>
        <tbody>
          ${data.payments.slice(0, 20).map(p => `
            <tr>
              <td>${p.receiptNumber}</td>
              <td>${p.studentName}</td>
              <td>${formatUGX(p.amount)}</td>
              <td>${p.recordedAt ? formatDate(p.recordedAt.toDate()) : 'N/A'}</td>
              <td>${p.channelDetails || p.channel}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>This report was generated by EduPay Ledger</p>
        <p>All payment records are verified and anchored to the Stellar blockchain for audit integrity.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Opens a print dialog with the report
 */
export function printReport(htmlContent: string): void {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
}
