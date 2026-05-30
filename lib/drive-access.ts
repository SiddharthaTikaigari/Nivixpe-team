import { User } from './auth';

export type DriveFolder = 'Marketing' | 'Business' | 'Legal' | 'Technical' | 'Other';

export const DRIVE_FOLDERS: { id: DriveFolder; label: string; description: string }[] = [
  { id: 'Marketing', label: 'Marketing', description: 'Shared docs for the Marketing team' },
  { id: 'Business', label: 'Business', description: 'Shared docs for the Business team' },
  { id: 'Legal', label: 'Legal', description: 'Shared docs for the Legal team' },
  { id: 'Technical', label: 'Tech Team', description: 'Tech team documents — full access for CEO, CTO & COO' },
  { id: 'Other', label: 'Other Docs', description: 'Docs for Design and other teams' },
];

export function canAccessAllDriveFolders(user: User | null): boolean {
  if (!user) return false;
  return user.isSuperAdmin === true || user.role === 'CTO' || user.role === 'COO';
}

export function getUserDriveFolder(user: User | null): DriveFolder {
  if (!user) return 'Other';
  if (user.team === 'Marketing') return 'Marketing';
  if (user.team === 'Business') return 'Business';
  if (user.team === 'Legal') return 'Legal';
  if (user.team === 'Technical') return 'Technical';
  return 'Other';
}

export function getAccessibleDriveFolders(user: User | null): DriveFolder[] {
  if (!user) return [];
  if (canAccessAllDriveFolders(user)) {
    return DRIVE_FOLDERS.map((f) => f.id);
  }
  return [getUserDriveFolder(user)];
}

export function canUploadToDriveFolder(user: User | null, folder: DriveFolder): boolean {
  if (!user) return false;
  if (canAccessAllDriveFolders(user)) return true;
  return getUserDriveFolder(user) === folder;
}

export function getDefaultUploadFolder(user: User | null): DriveFolder {
  if (!user) return 'Other';
  return getUserDriveFolder(user);
}
