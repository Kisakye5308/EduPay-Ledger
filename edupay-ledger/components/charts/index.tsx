'use client';

/**
 * Data Visualization Charts
 * Collection trends, class comparisons, payment method breakdown
 */

import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { cn, formatCurrency } from '@/lib/utils';

// ============================================================================
// Color Palette
// ============================================================================

const COLORS = {
  primary: '#2563eb',
  secondary: '#7c3aed',
  success: '#16a34a',
  warning: '#ea580c',
  error: '#dc2626',
  info: '#0891b2',
  gray: '#6b7280',
};

const CHART_COLORS = [
  '#2563eb', // Primary blue
  '#16a34a', // Green
  '#7c3aed', // Purple
  '#ea580c', // Orange
  '#0891b2', // Cyan
  '#dc2626', // Red
  '#84cc16', // Lime
  '#f59e0b', // Amber
];

// ============================================================================
// Custom Tooltip
// ============================================================================

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: number) => string;
}

function CustomTooltip({ active, payload, label, formatter }: TooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[160px]">
      <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}</span>
          </span>
          <span className="font-medium text-gray-900">
            {formatter ? formatter(entry.value) : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Collection Trends Chart (Area/Line)
// ============================================================================

interface CollectionData {
  period: string;
  collected: number;
  target: number;
  previous?: number;
}

interface CollectionTrendsChartProps {
  data: CollectionData[];
  title?: string;
  showTarget?: boolean;
  showPrevious?: boolean;
  height?: number;
  className?: string;
}

export function CollectionTrendsChart({
  data,
  title = 'Collection Trends',
  showTarget = true,
  showPrevious = false,
  height = 350,
  className,
}: CollectionTrendsChartProps) {
  return (
    <Card className={className}>
      <CardHeader title={title} />
      <CardBody>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="period"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={{ stroke: '#e5e7eb' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={{ stroke: '#e5e7eb' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
            />
            <Tooltip
              content={<CustomTooltip formatter={(v) => formatCurrency(v)} />}
            />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
            />
            
            <Area
              type="monotone"
              dataKey="collected"
              name="Collected"
              stroke={COLORS.primary}
              strokeWidth={2}
              fill="url(#collectedGradient)"
            />
            
            {showTarget && (
              <Line
                type="monotone"
                dataKey="target"
                name="Target"
                stroke={COLORS.success}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}
            
            {showPrevious && (
              <Line
                type="monotone"
                dataKey="previous"
                name="Previous Period"
                stroke={COLORS.gray}
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Class Comparison Chart (Bar)
// ============================================================================

interface ClassComparisonData {
  className: string;
  collected: number;
  expected: number;
  percentage: number;
}

interface ClassComparisonChartProps {
  data: ClassComparisonData[];
  title?: string;
  height?: number;
  className?: string;
}

export function ClassComparisonChart({
  data,
  title = 'Collection by Class',
  height = 350,
  className,
}: ClassComparisonChartProps) {
  return (
    <Card className={className}>
      <CardHeader title={title} />
      <CardBody>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 10, left: 60, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
            />
            <YAxis
              type="category"
              dataKey="className"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              width={50}
            />
            <Tooltip
              content={<CustomTooltip formatter={(v) => formatCurrency(v)} />}
            />
            <Legend verticalAlign="top" height={36} />
            
            <Bar
              dataKey="collected"
              name="Collected"
              fill={COLORS.primary}
              radius={[0, 4, 4, 0]}
            />
            <Bar
              dataKey="expected"
              name="Expected"
              fill="#e5e7eb"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        
        {/* Class percentage indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t">
          {data.slice(0, 6).map((item) => (
            <div key={item.className} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">{item.className}</span>
              <span className={cn(
                'text-sm font-medium',
                item.percentage >= 80 ? 'text-success-600' :
                item.percentage >= 50 ? 'text-warning-600' :
                'text-error-600'
              )}>
                {item.percentage.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Payment Methods Chart (Pie/Donut)
// ============================================================================

interface PaymentMethodData {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

interface PaymentMethodsChartProps {
  data: PaymentMethodData[];
  title?: string;
  height?: number;
  className?: string;
}

export function PaymentMethodsChart({
  data,
  title = 'Payment Methods',
  height = 300,
  className,
}: PaymentMethodsChartProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className={className}>
      <CardHeader title={title} />
      <CardBody>
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="amount"
                nameKey="method"
                label={({ method, percentage }) => `${percentage.toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.method}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Legend with details */}
          <div className="w-full lg:w-48 space-y-3">
            {data.map((item, index) => (
              <div key={item.method} className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.method}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.count} transactions
                  </p>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {item.percentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Total */}
        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-sm text-gray-500">Total Collections</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Daily Collections Chart (Bar)
// ============================================================================

interface DailyCollectionData {
  day: string;
  amount: number;
  transactions: number;
}

interface DailyCollectionsChartProps {
  data: DailyCollectionData[];
  title?: string;
  height?: number;
  className?: string;
}

export function DailyCollectionsChart({
  data,
  title = 'Daily Collections',
  height = 250,
  className,
}: DailyCollectionsChartProps) {
  const maxAmount = Math.max(...data.map(d => d.amount));
  const avgAmount = data.reduce((sum, d) => sum + d.amount, 0) / data.length;

  return (
    <Card className={className}>
      <CardHeader title={title} />
      <CardBody>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={{ stroke: '#e5e7eb' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={{ stroke: '#e5e7eb' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip
              content={<CustomTooltip formatter={(v) => formatCurrency(v)} />}
            />
            
            <Bar
              dataKey="amount"
              name="Amount"
              fill={COLORS.primary}
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.amount === maxAmount ? COLORS.success : COLORS.primary}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-gray-500">Highest</p>
            <p className="text-sm font-semibold text-success-600">
              {formatCurrency(maxAmount)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Average</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(avgAmount)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Total Txns</p>
            <p className="text-sm font-semibold text-gray-900">
              {data.reduce((sum, d) => sum + d.transactions, 0)}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Arrears Trend Chart
// ============================================================================

interface ArrearsTrendData {
  period: string;
  totalArrears: number;
  studentsInArrears: number;
  newArrears: number;
  recovered: number;
}

interface ArrearsTrendChartProps {
  data: ArrearsTrendData[];
  title?: string;
  height?: number;
  className?: string;
}

export function ArrearsTrendChart({
  data,
  title = 'Arrears Trend',
  height = 300,
  className,
}: ArrearsTrendChartProps) {
  return (
    <Card className={className}>
      <CardHeader title={title} />
      <CardBody>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="period"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis
              yAxisId="amount"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
            />
            <YAxis
              yAxisId="count"
              orientation="right"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <Tooltip
              content={<CustomTooltip formatter={(v) => v > 10000 ? formatCurrency(v) : v.toString()} />}
            />
            <Legend verticalAlign="top" height={36} />
            
            <Area
              yAxisId="amount"
              type="monotone"
              dataKey="totalArrears"
              name="Total Arrears"
              stroke={COLORS.error}
              fill={COLORS.error}
              fillOpacity={0.1}
            />
            <Bar
              yAxisId="amount"
              dataKey="recovered"
              name="Recovered"
              fill={COLORS.success}
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="studentsInArrears"
              name="Students in Arrears"
              stroke={COLORS.warning}
              strokeWidth={2}
              dot={{ fill: COLORS.warning }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Mini Sparkline Chart
// ============================================================================

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  showDots?: boolean;
}

export function Sparkline({
  data,
  color = COLORS.primary,
  height = 40,
  width = 120,
  showDots = false,
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }));

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={showDots ? { fill: color, r: 2 } : false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// Collection Rate Gauge
// ============================================================================

interface CollectionGaugeProps {
  collected: number;
  target: number;
  size?: number;
  className?: string;
}

export function CollectionGauge({
  collected,
  target,
  size = 200,
  className,
}: CollectionGaugeProps) {
  const percentage = Math.min((collected / target) * 100, 100);
  const color = percentage >= 80 ? COLORS.success : percentage >= 50 ? COLORS.warning : COLORS.error;

  const data = [
    { name: 'Collected', value: percentage },
    { name: 'Remaining', value: 100 - percentage },
  ];

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <ResponsiveContainer width={size} height={size}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={0}
            dataKey="value"
          >
            <Cell fill={color} />
            <Cell fill="#e5e7eb" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
        <span className="text-3xl font-bold" style={{ color }}>
          {percentage.toFixed(0)}%
        </span>
        <span className="text-xs text-gray-500">Collected</span>
      </div>
    </div>
  );
}

export default {
  CollectionTrendsChart,
  ClassComparisonChart,
  PaymentMethodsChart,
  DailyCollectionsChart,
  ArrearsTrendChart,
  Sparkline,
  CollectionGauge,
};
