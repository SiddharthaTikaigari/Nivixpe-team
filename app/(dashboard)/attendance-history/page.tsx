'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/providers';
import { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  User as UserIcon, 
  TrendingUp, 
  Filter, 
  Download,
  Search,
  Timer,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Users
} from 'lucide-react';
import { format, parse, differenceInMinutes } from 'date-fns';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';

export default function AttendanceHistoryPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [selectedPersonEmail, setSelectedPersonEmail] = useState('');

  // Queries
  const allHistory = useQuery(api.attendanceRecords.getAllHistory) || [];
  const rawTeamMembers = useQuery(api.teamMembers.getAll) || [];

  // Deduplicate team members by email to fix re-entry issues
  const teamMembers = useMemo(() => {
    const seen = new Set();
    return rawTeamMembers.filter(m => {
      if (seen.has(m.email)) return false;
      seen.add(m.email);
      return true;
    });
  }, [rawTeamMembers]);

  // Helper: Calculate work hours for a record
  const calculateWorkHours = (login: string, logout?: string) => {
    if (!logout) return 0;
    try {
      const startTime = parse(login, 'HH:mm', new Date());
      const endTime = parse(logout, 'HH:mm', new Date());
      const diff = differenceInMinutes(endTime, startTime);
      return Math.max(0, diff); // Return minutes
    } catch (e) {
      return 0;
    }
  };

  const formatHours = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  // Process data with roles
  const historyWithRoles = useMemo(() => {
    return allHistory.map(record => {
      const member = teamMembers.find(m => m.email === record.email);
      return {
        ...record,
        role: member?.role || 'Unknown',
        team: member?.team || 'Other',
        name: member?.name || record.email.split('@')[0]
      };
    });
  }, [allHistory, teamMembers]);

  // Derived filters
  const roles = useMemo(() => {
    const uniqueRoles = Array.from(new Set(teamMembers.map(m => m.role)));
    return ['All Roles', ...uniqueRoles];
  }, [teamMembers]);

  // Role-wise statistics
  const roleStats = useMemo(() => {
    const stats: Record<string, { totalHours: number, count: number, lateCount: number }> = {};
    historyWithRoles.forEach(r => {
      if (!stats[r.role]) stats[r.role] = { totalHours: 0, count: 0, lateCount: 0 };
      stats[r.role].totalHours += calculateWorkHours(r.loginTime || '00:00', r.logoutTime);
      stats[r.role].count += 1;
      if (r.status === 'late') stats[r.role].lateCount += 1;
    });
    return Object.entries(stats).map(([role, data]) => ({
      role,
      avgHours: data.count > 0 ? (data.totalHours / data.count / 60).toFixed(1) : 0,
      lateRate: data.count > 0 ? Math.round((data.lateCount / data.count) * 100) : 0,
      count: data.count
    }));
  }, [historyWithRoles]);

  // Filtered data for table
  const filteredHistory = historyWithRoles.filter(record => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         record.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'All Roles' || record.role === selectedRole;
    
    // Permission check
    const isOwner = record.email === user?.email;
    const canSeeAll = user?.isSuperAdmin || user?.role === 'COO' || user?.role === 'CTO' || user?.role === 'CSO' || user?.role === 'CMO';
    
    return matchesSearch && matchesRole && (isOwner || canSeeAll);
  });

  // Deduplicate history records (if there are duplicate entries for the same person on same day)
  const uniqueFilteredHistory = useMemo(() => {
    const seen = new Set();
    return filteredHistory.filter(r => {
      const key = `${r.date}-${r.email}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [filteredHistory]);

  // Individual Analytics (for selected person or self)
  const targetEmail = selectedPersonEmail || user?.email;
  const personHistory = historyWithRoles.filter(r => r.email === targetEmail).slice(0, 10).reverse();
  const personStats = useMemo(() => {
    const history = historyWithRoles.filter(r => r.email === targetEmail);
    const totalMins = history.reduce((acc, r) => acc + calculateWorkHours(r.loginTime || '00:00', r.logoutTime), 0);
    const lateDays = history.filter(r => r.status === 'late').length;
    return {
      totalHours: formatHours(totalMins),
      avgMins: history.length > 0 ? totalMins / history.length : 0,
      lateDays,
      attendanceRate: Math.min(100, Math.round((history.length / 22) * 100)) // Assuming 22 working days
    };
  }, [historyWithRoles, targetEmail]);

  const chartData = personHistory.map(r => ({
    date: format(new Date(r.date), 'MMM dd'),
    hours: calculateWorkHours(r.loginTime || '00:00', r.logoutTime) / 60
  }));

  // Colors for roles
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const handleExport = () => {
    if (uniqueFilteredHistory.length === 0) return;

    const headers = ['Date', 'Name', 'Email', 'Role', 'Team', 'Status', 'Login', 'Logout', 'Work Hours'];
    const csvRows = uniqueFilteredHistory.map(r => [
      r.date,
      r.name,
      r.email,
      r.role,
      r.team,
      r.status,
      r.loginTime || '-',
      r.logoutTime || '-',
      formatHours(calculateWorkHours(r.loginTime || '00:00', r.logoutTime))
    ]);

    const csvContent = [headers, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_history_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-slate-900 font-sans">
      <Header title="Attendance Analytics" subtitle="Role-wise and person-wise tracking" />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Quick Insights Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white border border-slate-100 shadow-sm p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Members</p>
              <p className="text-xl font-bold text-slate-900">{teamMembers.length}</p>
            </div>
          </Card>
          <Card className="bg-white border border-slate-100 shadow-sm p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Timer size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg. Work Day</p>
              <p className="text-xl font-bold text-slate-900">
                {(roleStats.reduce((acc, r) => acc + Number(r.avgHours), 0) / (roleStats.length || 1)).toFixed(1)}h
              </p>
            </div>
          </Card>
          <Card className="bg-white border border-slate-100 shadow-sm p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Late Rate</p>
              <p className="text-xl font-bold text-slate-900">
                {Math.round(roleStats.reduce((acc, r) => acc + r.lateRate, 0) / (roleStats.length || 1))}%
              </p>
            </div>
          </Card>
          <Card className="bg-white border border-slate-100 shadow-sm p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
              <Briefcase size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Roles</p>
              <p className="text-xl font-bold text-slate-900">{roles.length - 1}</p>
            </div>
          </Card>
        </div>

        {/* Role-wise Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-50 bg-slate-50/50">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
                <TrendingUp size={18} className="text-indigo-600" />
                Role-wise Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="role" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="avgHours" radius={[4, 4, 0, 0]} barSize={32}>
                    {roleStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-50 bg-slate-50/50">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
                <Filter size={18} className="text-indigo-600" />
                Quick Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-2 block">Department Role</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-2 block">Team Member</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                  value={selectedPersonEmail}
                  onChange={(e) => setSelectedPersonEmail(e.target.value)}
                >
                  <option value="">Myself ({user?.name})</option>
                  {teamMembers.filter(m => m.email !== user?.email).map(m => (
                    <option key={m.id} value={m.email}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Attendance Consistency</span>
                    <span className="text-sm font-bold text-indigo-600">{personStats.attendanceRate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full transition-all duration-700" style={{ width: `${personStats.attendanceRate}%` }}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Late Days</p>
                      <p className="text-lg font-bold text-amber-600">{personStats.lateDays}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Work Hours</p>
                      <p className="text-lg font-bold text-indigo-600">{personStats.totalHours.split('h')[0]}h</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed History Table */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Attendance Logs</h2>
            <div className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search members..."
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm font-medium shadow-sm focus:ring-2 focus:ring-indigo-500/5 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 py-2 text-sm font-semibold transition-all shadow-md shadow-indigo-100"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Employee</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Department</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Log Times</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Work Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {uniqueFilteredHistory.length > 0 ? (
                  uniqueFilteredHistory.map((record) => (
                    <tr key={record._id} className="hover:bg-slate-50/50 transition-colors group cursor-default">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all border border-slate-200">
                            <UserIcon size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{record.name}</p>
                            <p className="text-[10px] font-medium text-slate-500">{record.date}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-700">{record.role}</p>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase">{record.team}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          record.status === 'present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                          record.status === 'late' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                          'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2 text-[13px] font-medium text-slate-500">
                          <span className="text-slate-800">{record.loginTime || '—'}</span>
                          <span className="text-slate-300">→</span>
                          <span className="text-slate-800">{record.logoutTime || 'Active'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-indigo-600 bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          {formatHours(calculateWorkHours(record.loginTime || '00:00', record.logoutTime))}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-400 italic font-medium">
                      <div className="flex flex-col items-center gap-3">
                        <Search size={32} className="text-slate-100" />
                        <p>No matching records found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
