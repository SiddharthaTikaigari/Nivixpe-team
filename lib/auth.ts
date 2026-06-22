export type UserRole = 'CEO' | 'CTO' | 'COO' | 'CSO' | 'CMO' | 'DCSO' | 'DCMO' | 'Legal' | 'Legal Intern' | 'Designer' | 'Admin' | 'Developer 1' | 'Developer 2' | 'Developer 3';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  team?: 'Business' | 'Legal' | 'Technical' | 'Marketing' | 'Design';
  isSuperAdmin?: boolean;
  accessLevel?: 'admin' | 'manager' | 'employee';
  avatar?: string;
  joinDate: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Mock users for demo
export const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'ceo@nivixpe.com': {
    password: 'ceo123',
    user: {
      id: '1',
      email: 'ceo@nivixpe.com',
      name: 'Sahith',
      role: 'CEO',
      department: 'Executive',
      team: 'Business',
      isSuperAdmin: true,
      accessLevel: 'admin',
      joinDate: '2020-01-15',
    },
  },
  'cto@nivixpe.com': {
    password: 'cto123',
    user: {
      id: '2',
      email: 'cto@nivixpe.com',
      name: 'Shubham',
      role: 'CTO',
      department: 'Technology',
      team: 'Technical',
      accessLevel: 'admin',
      joinDate: '2020-02-01',
    },
  },
  'cso@nivixpe.com': {
    password: 'cso123',
    user: {
      id: '3',
      email: 'cso@nivixpe.com',
      name: 'Swaraag',
      role: 'CSO',
      department: 'Sales & Strategy',
      team: 'Business',
      accessLevel: 'manager',
      joinDate: '2020-03-10',
    },
  },
  'cmo@nivixpe.com': {
    password: 'cmo123',
    user: {
      id: '4',
      email: 'cmo@nivixpe.com',
      name: 'Abhiram',
      role: 'CMO',
      department: 'Marketing',
      team: 'Marketing',
      accessLevel: 'manager',
      joinDate: '2020-04-15',
    },
  },
  'dcso@nivixpe.com': {
    password: 'dcso123',
    user: {
      id: '5',
      email: 'dcso@nivixpe.com',
      name: 'Ujjwal',
      role: 'DCSO',
      department: 'Deputy Sales & Strategy',
      team: 'Business',
      accessLevel: 'manager',
      joinDate: '2021-01-20',
    },
  },
  'dcmo@nivixpe.com': {
    password: 'dcmo123',
    user: {
      id: '6',
      email: 'dcmo@nivixpe.com',
      name: 'Bhavika',
      role: 'DCMO',
      department: 'Deputy Marketing',
      team: 'Marketing',
      accessLevel: 'manager',
      joinDate: '2021-02-10',
    },
  },
  'coo@nivixpe.com': {
    password: 'coo123',
    user: {
      id: '7',
      email: 'coo@nivixpe.com',
      name: 'Siddharatha',
      role: 'COO',
      department: 'Operations',
      team: 'Business',
      accessLevel: 'admin',
      joinDate: '2020-05-01',
    },
  },
  'designer1@nivixpe.com': {
    password: 'design123',
    user: {
      id: '8',
      email: 'designer1@nivixpe.com',
      name: 'Aradhya',
      role: 'Designer',
      department: 'Design',
      team: 'Design',
      accessLevel: 'employee',
      joinDate: '2021-06-15',
    },
  },
  'designer2@nivixpe.com': {
    password: 'design123',
    user: {
      id: '9',
      email: 'designer2@nivixpe.com',
      name: 'Rudra Sahu',
      role: 'Designer',
      department: 'Design',
      team: 'Design',
      accessLevel: 'employee',
      joinDate: '2021-07-01',
    },
  },
  'legal@nivixpe.com': {
    password: 'legal123',
    user: {
      id: '10',
      email: 'legal@nivixpe.com',
      name: 'Kashish',
      role: 'Legal',
      department: 'Legal & Compliance',
      team: 'Legal',
      accessLevel: 'manager',
      joinDate: '2020-08-01',
    },
  },
  'developer1@nivixpe.com': {
    password: 'dev123',
    user: {
      id: '11',
      email: 'developer1@nivixpe.com',
      name: 'Ngan Nguyen',
      role: 'Developer 1',
      department: 'Technology',
      team: 'Technical',
      accessLevel: 'employee',
      joinDate: '2025-05-01',
    },
  },
  'developer2@nivixpe.com': {
    password: 'dev123',
    user: {
      id: '12',
      email: 'developer2@nivixpe.com',
      name: 'Huy Ho',
      role: 'Developer 2',
      department: 'Technology',
      team: 'Technical',
      accessLevel: 'employee',
      joinDate: '2025-05-01',
    },
  },
  'legal2@nivixpe.com': {
    password: 'dev123',
    user: {
      id: '13',
      email: 'legal2@nivixpe.com',
      name: 'Vinisha',
      role: 'Legal Intern',
      department: 'Legal & Compliance',
      team: 'Legal',
      accessLevel: 'employee',
      joinDate: '2025-05-15',
    },
  },
  'developer3@nivix.com': {
    password: 'dev123',
    user: {
      id: '14',
      email: 'developer3@nivix.com',
      name: 'Nithin Sureddy',
      role: 'Developer 3',
      department: 'Technology',
      team: 'Technical',
      accessLevel: 'employee',
      joinDate: '2025-05-01',
    },
  },
};
