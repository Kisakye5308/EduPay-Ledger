/**
 * Predictive Analytics Service
 * Arrears prediction and payment behavior analysis
 */

import { differenceInDays, subMonths, format, startOfMonth, endOfMonth } from 'date-fns';

// ============================================================================
// Types
// ============================================================================

export interface PaymentHistory {
  id: string;
  studentId: string;
  amount: number;
  date: Date;
  termId: string;
  dueDate: Date;
  paymentMethod: string;
}

export interface StudentPaymentProfile {
  studentId: string;
  totalPayments: number;
  averagePaymentAmount: number;
  averageDelayDays: number;
  onTimePaymentRate: number;
  preferredPaymentMethod: string;
  paymentFrequency: number; // payments per term
  lastPaymentDate: Date | null;
  riskScore: number; // 0-100, higher = more risk
  riskCategory: 'low' | 'medium' | 'high' | 'critical';
  predictedNextPaymentDate: Date | null;
  predictedPaymentAmount: number;
}

export interface ArrearsPrediction {
  studentId: string;
  currentBalance: number;
  predictedArrears30Days: number;
  predictedArrears60Days: number;
  predictedArrears90Days: number;
  probabilityOfDefault: number;
  recommendedAction: string;
  riskFactors: string[];
}

export interface CollectionForecast {
  period: string;
  predictedCollection: number;
  confidenceInterval: { low: number; high: number };
  basedOnHistoricalAverage: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface RiskAlert {
  studentId: string;
  studentName: string;
  alertType: 'arrears_risk' | 'payment_delay' | 'default_risk' | 'pattern_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation: string;
  timestamp: Date;
}

// ============================================================================
// Risk Score Calculation
// ============================================================================

interface RiskFactors {
  paymentDelayDays: number;
  missedPayments: number;
  partialPayments: number;
  currentBalance: number;
  expectedAmount: number;
  daysUntilDeadline: number;
  historicalOnTimeRate: number;
  previousTermPerformance: number;
}

/**
 * Calculate risk score for a student based on multiple factors
 * Returns a score from 0-100 (higher = more risk)
 */
export function calculateRiskScore(factors: RiskFactors): number {
  const weights = {
    paymentDelay: 0.25,
    missedPayments: 0.20,
    partialPayments: 0.10,
    balanceRatio: 0.20,
    deadlineProximity: 0.10,
    historicalRate: 0.10,
    previousTerm: 0.05,
  };

  // Normalize factors to 0-100 scale
  const delayScore = Math.min(factors.paymentDelayDays / 30 * 100, 100);
  const missedScore = Math.min(factors.missedPayments * 25, 100);
  const partialScore = Math.min(factors.partialPayments * 15, 100);
  const balanceRatio = factors.expectedAmount > 0 
    ? (factors.currentBalance / factors.expectedAmount) * 100 
    : 0;
  const deadlineScore = factors.daysUntilDeadline > 0 
    ? Math.max(0, 100 - (factors.daysUntilDeadline / 30 * 100))
    : 100;
  const historicalScore = (1 - factors.historicalOnTimeRate) * 100;
  const previousScore = (1 - factors.previousTermPerformance) * 100;

  const weightedScore = 
    delayScore * weights.paymentDelay +
    missedScore * weights.missedPayments +
    partialScore * weights.partialPayments +
    balanceRatio * weights.balanceRatio +
    deadlineScore * weights.deadlineProximity +
    historicalScore * weights.historicalRate +
    previousScore * weights.previousTerm;

  return Math.min(Math.round(weightedScore), 100);
}

/**
 * Convert risk score to category
 */
export function getRiskCategory(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score < 25) return 'low';
  if (score < 50) return 'medium';
  if (score < 75) return 'high';
  return 'critical';
}

// ============================================================================
// Payment Prediction
// ============================================================================

/**
 * Predict next payment date based on historical patterns
 */
export function predictNextPaymentDate(
  paymentHistory: PaymentHistory[],
  currentDate: Date = new Date()
): Date | null {
  if (paymentHistory.length < 2) return null;

  // Sort by date descending
  const sorted = [...paymentHistory].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  // Calculate average days between payments
  const gaps: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = differenceInDays(sorted[i].date, sorted[i + 1].date);
    if (gap > 0 && gap < 120) { // Filter outliers
      gaps.push(gap);
    }
  }

  if (gaps.length === 0) return null;

  // Use weighted average (recent gaps weighted more)
  const weightedGaps = gaps.map((gap, i) => gap * (gaps.length - i));
  const totalWeight = gaps.reduce((sum, _, i) => sum + (gaps.length - i), 0);
  const avgGap = Math.round(weightedGaps.reduce((a, b) => a + b, 0) / totalWeight);

  // Predict next date
  const lastPayment = sorted[0].date;
  const predictedDate = new Date(lastPayment);
  predictedDate.setDate(predictedDate.getDate() + avgGap);

  // Ensure prediction is in the future
  return predictedDate > currentDate ? predictedDate : null;
}

/**
 * Predict payment amount based on historical patterns
 */
export function predictPaymentAmount(paymentHistory: PaymentHistory[]): number {
  if (paymentHistory.length === 0) return 0;

  // Sort by date descending
  const sorted = [...paymentHistory].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  // Use exponential moving average (EMA) for recent payments
  const recentPayments = sorted.slice(0, 5);
  const alpha = 0.3; // Smoothing factor

  let ema = recentPayments[recentPayments.length - 1].amount;
  for (let i = recentPayments.length - 2; i >= 0; i--) {
    ema = alpha * recentPayments[i].amount + (1 - alpha) * ema;
  }

  return Math.round(ema);
}

// ============================================================================
// Arrears Prediction
// ============================================================================

/**
 * Predict arrears development over time
 */
export function predictArrears(
  currentBalance: number,
  expectedPayment: number,
  paymentHistory: PaymentHistory[],
  dueDate: Date
): ArrearsPrediction {
  const profile = analyzePaymentProfile(paymentHistory);
  const riskScore = profile.riskScore;
  
  // Calculate probability factors
  const onTimeProb = profile.onTimePaymentRate;
  const avgDelay = profile.averageDelayDays;
  
  // Predict arrears at different time horizons
  const arrears30 = predictArrearsAtHorizon(
    currentBalance, expectedPayment, onTimeProb, avgDelay, 30
  );
  const arrears60 = predictArrearsAtHorizon(
    currentBalance, expectedPayment, onTimeProb, avgDelay, 60
  );
  const arrears90 = predictArrearsAtHorizon(
    currentBalance, expectedPayment, onTimeProb, avgDelay, 90
  );

  // Calculate probability of default (not paying at all)
  const defaultProb = calculateDefaultProbability(paymentHistory, riskScore);

  // Generate risk factors
  const riskFactors = generateRiskFactors(profile, currentBalance, expectedPayment);

  // Generate recommendation
  const recommendation = generateRecommendation(riskScore, defaultProb, currentBalance);

  return {
    studentId: paymentHistory[0]?.studentId || '',
    currentBalance,
    predictedArrears30Days: arrears30,
    predictedArrears60Days: arrears60,
    predictedArrears90Days: arrears90,
    probabilityOfDefault: defaultProb,
    recommendedAction: recommendation,
    riskFactors,
  };
}

function predictArrearsAtHorizon(
  currentBalance: number,
  expectedPayment: number,
  onTimeProb: number,
  avgDelay: number,
  horizonDays: number
): number {
  // Simple model: current balance reduced by expected partial payments
  const expectedPayments = Math.floor(horizonDays / (avgDelay || 30));
  const likelyPayment = expectedPayment * onTimeProb * expectedPayments * 0.8;
  
  return Math.max(0, currentBalance - likelyPayment);
}

function calculateDefaultProbability(
  paymentHistory: PaymentHistory[],
  riskScore: number
): number {
  // Base probability on risk score
  let prob = riskScore / 200; // Max 50% from risk score

  // Adjust for payment history
  if (paymentHistory.length === 0) {
    prob += 0.2; // No history increases default risk
  } else {
    const recentPayments = paymentHistory.filter(
      p => differenceInDays(new Date(), p.date) < 90
    );
    if (recentPayments.length === 0) {
      prob += 0.15; // No recent payments
    }
  }

  return Math.min(Math.max(prob, 0), 0.95); // Cap at 95%
}

function generateRiskFactors(
  profile: StudentPaymentProfile,
  currentBalance: number,
  expectedAmount: number
): string[] {
  const factors: string[] = [];

  if (profile.onTimePaymentRate < 0.5) {
    factors.push('Less than 50% on-time payment rate');
  }
  if (profile.averageDelayDays > 14) {
    factors.push(`Average payment delay of ${Math.round(profile.averageDelayDays)} days`);
  }
  if (currentBalance > expectedAmount * 0.8) {
    factors.push('Balance exceeds 80% of expected fees');
  }
  if (profile.lastPaymentDate) {
    const daysSinceLastPayment = differenceInDays(new Date(), profile.lastPaymentDate);
    if (daysSinceLastPayment > 45) {
      factors.push(`No payment in ${daysSinceLastPayment} days`);
    }
  }
  if (profile.riskScore > 60) {
    factors.push('Historical payment pattern indicates high risk');
  }

  return factors;
}

function generateRecommendation(
  riskScore: number,
  defaultProb: number,
  currentBalance: number
): string {
  if (riskScore >= 75 || defaultProb >= 0.5) {
    return 'Immediate follow-up required. Consider payment plan or parent meeting.';
  }
  if (riskScore >= 50 || defaultProb >= 0.3) {
    return 'Send payment reminder. Schedule follow-up within 1 week.';
  }
  if (riskScore >= 25) {
    return 'Monitor closely. Send friendly reminder before deadline.';
  }
  return 'Low risk. Continue standard monitoring.';
}

// ============================================================================
// Profile Analysis
// ============================================================================

/**
 * Analyze student payment profile from history
 */
export function analyzePaymentProfile(
  paymentHistory: PaymentHistory[]
): StudentPaymentProfile {
  if (paymentHistory.length === 0) {
    return {
      studentId: '',
      totalPayments: 0,
      averagePaymentAmount: 0,
      averageDelayDays: 0,
      onTimePaymentRate: 0,
      preferredPaymentMethod: 'unknown',
      paymentFrequency: 0,
      lastPaymentDate: null,
      riskScore: 75, // High risk for no history
      riskCategory: 'high',
      predictedNextPaymentDate: null,
      predictedPaymentAmount: 0,
    };
  }

  const studentId = paymentHistory[0].studentId;
  const totalPayments = paymentHistory.length;
  const totalAmount = paymentHistory.reduce((sum, p) => sum + p.amount, 0);
  const averagePaymentAmount = totalAmount / totalPayments;

  // Calculate on-time rate and average delay
  const delays = paymentHistory.map(p => 
    Math.max(0, differenceInDays(p.date, p.dueDate))
  );
  const averageDelayDays = delays.reduce((a, b) => a + b, 0) / delays.length;
  const onTimePayments = delays.filter(d => d <= 7).length; // Within 7 days of due date
  const onTimePaymentRate = onTimePayments / totalPayments;

  // Find preferred payment method
  const methodCounts = paymentHistory.reduce((acc, p) => {
    acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const preferredPaymentMethod = Object.entries(methodCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

  // Calculate payment frequency (payments per 90 days)
  const sortedHistory = [...paymentHistory].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  const firstPayment = sortedHistory[0].date;
  const lastPayment = sortedHistory[sortedHistory.length - 1].date;
  const daySpan = Math.max(differenceInDays(lastPayment, firstPayment), 1);
  const paymentFrequency = (totalPayments / daySpan) * 90;

  // Calculate risk score
  const riskScore = calculateRiskScore({
    paymentDelayDays: averageDelayDays,
    missedPayments: 0, // Would need more context
    partialPayments: 0,
    currentBalance: 0,
    expectedAmount: 1,
    daysUntilDeadline: 30,
    historicalOnTimeRate: onTimePaymentRate,
    previousTermPerformance: onTimePaymentRate,
  });

  return {
    studentId,
    totalPayments,
    averagePaymentAmount,
    averageDelayDays,
    onTimePaymentRate,
    preferredPaymentMethod,
    paymentFrequency,
    lastPaymentDate: lastPayment,
    riskScore,
    riskCategory: getRiskCategory(riskScore),
    predictedNextPaymentDate: predictNextPaymentDate(paymentHistory),
    predictedPaymentAmount: predictPaymentAmount(paymentHistory),
  };
}

// ============================================================================
// Collection Forecasting
// ============================================================================

/**
 * Forecast collections for upcoming periods
 */
export function forecastCollections(
  historicalData: { period: string; amount: number }[],
  periodsToForecast: number = 3
): CollectionForecast[] {
  if (historicalData.length < 3) {
    return [];
  }

  // Calculate trend using linear regression
  const n = historicalData.length;
  const amounts = historicalData.map(d => d.amount);
  const indices = amounts.map((_, i) => i);
  
  const sumX = indices.reduce((a, b) => a + b, 0);
  const sumY = amounts.reduce((a, b) => a + b, 0);
  const sumXY = indices.reduce((sum, x, i) => sum + x * amounts[i], 0);
  const sumXX = indices.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate standard deviation for confidence interval
  const mean = sumY / n;
  const variance = amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  // Determine trend direction
  const trend: 'increasing' | 'stable' | 'decreasing' = 
    slope > 0.05 * mean ? 'increasing' :
    slope < -0.05 * mean ? 'decreasing' : 'stable';

  // Generate forecasts
  const forecasts: CollectionForecast[] = [];
  const lastPeriodDate = new Date(historicalData[historicalData.length - 1].period);

  for (let i = 1; i <= periodsToForecast; i++) {
    const forecastIndex = n + i - 1;
    const predicted = intercept + slope * forecastIndex;
    
    // Add some seasonality adjustment (simplified)
    const seasonalFactor = 1 + (i % 3 === 1 ? 0.1 : i % 3 === 2 ? 0 : -0.1);
    const adjustedPrediction = predicted * seasonalFactor;
    
    const nextMonth = new Date(lastPeriodDate);
    nextMonth.setMonth(nextMonth.getMonth() + i);

    forecasts.push({
      period: format(nextMonth, 'MMM yyyy'),
      predictedCollection: Math.max(0, Math.round(adjustedPrediction)),
      confidenceInterval: {
        low: Math.max(0, Math.round(adjustedPrediction - 1.96 * stdDev)),
        high: Math.round(adjustedPrediction + 1.96 * stdDev),
      },
      basedOnHistoricalAverage: Math.round(mean),
      trend,
    });
  }

  return forecasts;
}

// ============================================================================
// Risk Alerts
// ============================================================================

/**
 * Generate risk alerts for students based on their profiles
 */
export function generateRiskAlerts(
  students: Array<{
    id: string;
    name: string;
    balance: number;
    profile: StudentPaymentProfile;
  }>
): RiskAlert[] {
  const alerts: RiskAlert[] = [];

  for (const student of students) {
    const { profile, balance } = student;

    // High risk alert
    if (profile.riskCategory === 'critical') {
      alerts.push({
        studentId: student.id,
        studentName: student.name,
        alertType: 'default_risk',
        severity: 'critical',
        message: `Critical default risk for ${student.name}. Balance: UGX ${balance.toLocaleString()}`,
        recommendation: 'Immediate intervention required. Schedule parent meeting.',
        timestamp: new Date(),
      });
    }

    // Payment delay alert
    if (profile.averageDelayDays > 21) {
      alerts.push({
        studentId: student.id,
        studentName: student.name,
        alertType: 'payment_delay',
        severity: profile.averageDelayDays > 30 ? 'high' : 'medium',
        message: `Consistent late payments (avg ${Math.round(profile.averageDelayDays)} days late)`,
        recommendation: 'Send payment reminder and discuss payment schedule.',
        timestamp: new Date(),
      });
    }

    // Arrears risk
    if (profile.riskCategory === 'high' && balance > 0) {
      alerts.push({
        studentId: student.id,
        studentName: student.name,
        alertType: 'arrears_risk',
        severity: 'high',
        message: `High risk of arrears. Current balance: UGX ${balance.toLocaleString()}`,
        recommendation: 'Proactive outreach recommended before deadline.',
        timestamp: new Date(),
      });
    }

    // Pattern change detection (simplified)
    if (
      profile.lastPaymentDate &&
      differenceInDays(new Date(), profile.lastPaymentDate) > 60 &&
      profile.onTimePaymentRate > 0.6
    ) {
      alerts.push({
        studentId: student.id,
        studentName: student.name,
        alertType: 'pattern_change',
        severity: 'medium',
        message: 'Payment pattern change detected. Previously reliable payer now overdue.',
        recommendation: 'Check if family circumstances have changed.',
        timestamp: new Date(),
      });
    }
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}

export default {
  calculateRiskScore,
  getRiskCategory,
  predictNextPaymentDate,
  predictPaymentAmount,
  predictArrears,
  analyzePaymentProfile,
  forecastCollections,
  generateRiskAlerts,
};
