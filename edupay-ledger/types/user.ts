export type UserRole = 'super_admin' | 'admin' | 'staff' | 'auditor';

export interface User {
  uid: string;
  email: string;
  phone?: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  schoolId: string;
  permissions: Permission[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type Permission =
  | 'read:students'
  | 'write:students'
  | 'delete:students'
  | 'read:payments'
  | 'write:payments'
  | 'delete:payments'
  | 'read:reports'
  | 'export:reports'
  | 'read:settings'
  | 'write:settings'
  | 'read:audit'
  | 'manage:users'
  | 'manage:school';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'read:students',
    'write:students',
    'delete:students',
    'read:payments',
    'write:payments',
    'delete:payments',
    'read:reports',
    'export:reports',
    'read:settings',
    'write:settings',
    'read:audit',
    'manage:users',
    'manage:school',
  ],
  admin: [
    'read:students',
    'write:students',
    'read:payments',
    'write:payments',
    'read:reports',
    'export:reports',
    'read:settings',
    'write:settings',
    'read:audit',
    'manage:users',
  ],
  staff: [
    'read:students',
    'write:students',
    'read:payments',
    'write:payments',
    'read:reports',
  ],
  auditor: [
    'read:students',
    'read:payments',
    'read:reports',
    'export:reports',
    'read:audit',
  ],
};

export function hasPermission(user: User, permission: Permission): boolean {
  return user.permissions.includes(permission);
}

export function hasAnyPermission(user: User, permissions: Permission[]): boolean {
  return permissions.some(p => user.permissions.includes(p));
}

export function hasAllPermissions(user: User, permissions: Permission[]): boolean {
  return permissions.every(p => user.permissions.includes(p));
}

export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    admin: 'Administrator',
    staff: 'Staff',
    auditor: 'Auditor',
  };
  return names[role];
}
