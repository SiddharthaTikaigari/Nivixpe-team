import { User } from './auth';

// Role-based access control for features and pages
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  'CEO': [
    'dashboard',
    'team-directory',
    'work-tracker',
    'work-allocation',
    'attendance',
    'attendance-history',
    'leave-management',
    'meetings',
    'legal',
    'proof-of-work',
    'drive',
    'tech-panel',
    'notifications',
    'settings',
    'admin',
  ],
  'CTO': [
    'dashboard',
    'team-directory',
    'work-tracker',
    'work-allocation',
    'tech-panel',
    'attendance',
    'attendance-history',
    'leave-management',
    'meetings',
    'proof-of-work',
    'drive',
    'notifications',
    'settings',
    'admin',
  ],
  'CSO': [
    'dashboard',
    'team-directory',
    'work-tracker',
    'work-allocation',
    'attendance',
    'attendance-history',
    'leave-management',
    'meetings',
    'proof-of-work',
    'drive',
    'notifications',
    'settings',
  ],
  'CMO': [
    'dashboard',
    'team-directory',
    'work-tracker',
    'work-allocation',
    'attendance',
    'attendance-history',
    'leave-management',
    'meetings',
    'proof-of-work',
    'drive',
    'notifications',
    'settings',
  ],
  'DCSO': [
    'dashboard',
    'team-directory',
    'work-tracker',
    'work-allocation',
    'attendance',
    'attendance-history',
    'leave-management',
    'meetings',
    'proof-of-work',
    'drive',
    'notifications',
    'settings',
  ],
  'DCMO': [
    'dashboard',
    'team-directory',
    'work-tracker',
    'work-allocation',
    'attendance',
    'attendance-history',
    'leave-management',
    'meetings',
    'proof-of-work',
    'drive',
    'notifications',
    'settings',
  ],
  'COO': [
    'dashboard',
    'team-directory',
    'work-tracker',
    'work-allocation',
    'attendance',
    'attendance-history',
    'leave-management',
    'meetings',
    'tech-panel',
    'proof-of-work',
    'drive',
    'notifications',
    'settings',
    'admin',
  ],
  'Legal': [
    'dashboard',
    'team-directory',
    'legal',
    'meetings',
    'attendance',
    'attendance-history',
    'leave-management',
    'proof-of-work',
    'drive',
    'notifications',
    'settings',
  ],
  'Designer': [
    'dashboard',
    'team-directory',
    'work-tracker',
    'work-allocation',
    'attendance',
    'attendance-history',
    'leave-management',
    'meetings',
    'proof-of-work',
    'drive',
    'notifications',
    'settings',
  ],
};

export function canAccessPage(user: User | null, page: string): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true; // CEO has access to everything
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(page);
}

export function canEditTeamData(user: User | null): boolean {
  if (!user) return false;
  return user.isSuperAdmin || user.accessLevel === 'manager';
}

export function canAssignTasks(user: User | null): boolean {
  if (!user) return false;
  // CEO, CTO, and all managers can assign tasks
  return user.isSuperAdmin || user.role === 'CTO' || user.accessLevel === 'manager';
}

export function canAssignTasksTo(user: User | null, targetMember: any): boolean {
  if (!user) return false;
  
  // CEO can assign to anyone
  if (user.isSuperAdmin) return true;
  
  // CTO can assign to anyone
  if (user.role === 'CTO') return true;
  
  // CSO (Swaraag) can assign to Business team
  if (user.role === 'CSO' && targetMember.team === 'Business') return true;
  
  // CMO (Abhiram) can assign to Marketing and Design teams
  if (user.role === 'CMO' && (targetMember.team === 'Marketing' || targetMember.team === 'Design')) return true;
  
  // DCMO (Bhavika) can assign to Marketing team
  if (user.role === 'DCMO' && targetMember.team === 'Marketing') return true;
  
  // COO can assign to Business, Legal, Operations, Marketing, and Design teams
  if (user.role === 'COO' && (targetMember.team === 'Business' || targetMember.team === 'Legal' || targetMember.team === 'Marketing' || targetMember.team === 'Design' || targetMember.department === 'Operations')) return true;
  
  // Legal head can assign to Legal team
  if (user.role === 'Legal' && targetMember.team === 'Legal') return true;
  
  return false;
}

export function getAssignableMembers(user: User | null, allMembers: any[]): any[] {
  if (!user) return [];
  
  // CEO can assign to anyone
  if (user.isSuperAdmin) return allMembers;
  
  // CTO can assign to anyone
  if (user.role === 'CTO') return allMembers;
  
  // CSO can assign to Business team
  if (user.role === 'CSO') {
    return allMembers.filter(m => m.team === 'Business');
  }

  // DCSO can assign to Business team
  if (user.role === 'DCSO') {
    return allMembers.filter(m => m.team === 'Business');
  }
  
  // CMO can assign to Marketing and Design teams
  if (user.role === 'CMO') {
    return allMembers.filter(m => m.team === 'Marketing' || m.team === 'Design');
  }
  
  // DCMO can assign to Marketing team
  if (user.role === 'DCMO') {
    return allMembers.filter(m => m.team === 'Marketing');
  }
  
  // COO can assign to Business, Legal, Operations, Marketing, and Design teams
  if (user.role === 'COO') {
    return allMembers.filter(m => m.team === 'Business' || m.team === 'Legal' || m.team === 'Marketing' || m.team === 'Design' || m.department === 'Operations');
  }
  
  // Legal can assign to Legal team
  if (user.role === 'Legal') {
    return allMembers.filter(m => m.team === 'Legal');
  }
  
  return [];
}

export function canViewAllTasks(user: User | null): boolean {
  if (!user) return false;
  // CEO and CTO can view all tasks
  return user.isSuperAdmin || user.role === 'CTO';
}

export function canViewTeamTasks(user: User | null, taskAssignee: string, allMembers: any[]): boolean {
  if (!user) return false;
  
  // CEO and CTO can view all
  if (user.isSuperAdmin || user.role === 'CTO') return true;
  
  // User can view their own tasks
  if (user.name === taskAssignee) return true;
  
  // Find the assignee's team
  const assigneeMember = allMembers.find(m => m.name === taskAssignee);
  if (!assigneeMember) return false;
  
  // Team heads can view their team's tasks
  if (user.role === 'CSO' && assigneeMember.team === 'Business') return true;
  if (user.role === 'DCSO' && assigneeMember.team === 'Business') return true;
  if (user.role === 'CMO' && (assigneeMember.team === 'Marketing' || assigneeMember.team === 'Design')) return true;
  if (user.role === 'DCMO' && assigneeMember.team === 'Marketing') return true;
  if (user.role === 'COO' && (assigneeMember.team === 'Business' || assigneeMember.team === 'Legal' || assigneeMember.team === 'Marketing' || assigneeMember.team === 'Design' || assigneeMember.department === 'Operations')) return true;
  if (user.role === 'Legal' && assigneeMember.team === 'Legal') return true;
  
  return false;
}

export function getVisibleTasks(user: User | null, allTasks: any[], allMembers: any[]): any[] {
  if (!user) return [];
  
  // CEO and CTO see all tasks
  if (user.isSuperAdmin || user.role === 'CTO') return allTasks;
  
  // Filter tasks based on what user can view
  return allTasks.filter(task => canViewTeamTasks(user, task.assignee, allMembers));
}

export function isAdmin(user: User | null): boolean {
  return user?.isSuperAdmin === true;
}

export function isManager(user: User | null): boolean {
  return user?.accessLevel === 'manager' || user?.isSuperAdmin === true;
}

export function getTeamMembers(user: User | null, allMembers: any[]): any[] {
  if (!user) return [];
  if (user.isSuperAdmin) return allMembers; // CEO sees all
  if (user.role === 'CTO') return allMembers; // CTO sees all
  if (user.role === 'CSO') {
    return allMembers.filter((m) => m.team === 'Business');
  }
  if (user.role === 'Legal') {
    return allMembers.filter((m) => m.team === 'Legal');
  }
  if (user.role === 'CMO') {
    return allMembers.filter((m) => m.team === 'Marketing' || m.team === 'Design');
  }
  return allMembers;
}

export function getTeamForUser(user: User | null): string {
  if (!user) return 'Unknown';
  if (user.isSuperAdmin) return 'All Teams';
  return user.team || 'No Team';
}

export function canAccessAdminPanel(user: User | null): boolean {
  if (!user) return false;
  return user.isSuperAdmin || user.role === 'CTO' || user.role === 'COO';
}

export function canDeleteAllocatedTask(user: User | null, task: { createdBy?: string }): boolean {
  if (!user || !task.createdBy) return false;
  const deleterRoles = ['CEO', 'CTO', 'COO', 'CMO', 'DCMO', 'DCSO'];
  const hasRole = user.isSuperAdmin || deleterRoles.includes(user.role);
  if (!hasRole) return false;
  return task.createdBy === user.name;
}
