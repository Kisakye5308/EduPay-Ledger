import React from 'react';

export { Button } from './Button';
export { Input, Textarea, Select } from './Input';
export { Card, CardHeader, CardTitle, CardContent, CardFooter, StatsCard } from './Card';
export { Badge, PaymentStatusBadge, SeverityBadge, VerificationBadge } from './Badge';
export { ProgressBar, ProgressBar as Progress, InstallmentProgress, CollectionProgress } from './Progress';
export { Avatar, AvatarGroup } from './Avatar';
export { Chip, FilterChip, TagChip } from './Chip';
export { Modal, ConfirmModal } from './Modal';
export { Table, Pagination } from './Table';

// Table helper components for convenience
export const TableHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <thead className={className}>{children}</thead>
);
export const TableBody = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <tbody className={className}>{children}</tbody>
);
export const TableRow = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <tr className={className}>{children}</tr>
);
export const TableHead = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <th className={className}>{children}</th>
);
export const TableCell = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <td className={className}>{children}</td>
);
