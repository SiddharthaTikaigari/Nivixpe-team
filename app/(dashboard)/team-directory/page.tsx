'use client';

import { useState } from 'react';
import { useAuth } from '@/app/providers';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TEAM_MEMBERS, TeamMember } from '@/lib/mock-data';
import { Search, User as UserIcon, Calendar, Clock, X } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { format } from 'date-fns';
import { PageFilterBar } from '@/components/page-filter-bar';

export default function TeamDirectoryPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterTeam, setFilterTeam] = useState('all');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const filteredMembers = TEAM_MEMBERS.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    const matchesTeam = filterTeam === 'all' || member.team === filterTeam || member.additionalTeams?.includes(filterTeam);
    return matchesSearch && matchesRole && matchesTeam;
  });

  const roles = Array.from(new Set(TEAM_MEMBERS.map((m) => m.role)));

  return (
    <div className="flex-1 overflow-y-auto flex flex-col relative">
      <Header title="Team Directory" subtitle="View all team members and their information" />

      <div className="p-6 space-y-4">
        <PageFilterBar 
          selectedTeam={filterTeam}
          onTeamChange={setFilterTeam}
          selectedPerson="all"
          onPersonChange={() => {}}
          showPersonFilter={false}
          extraFilters={
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3.5 py-2.5 border border-input rounded-lg bg-background text-sm font-medium cursor-pointer hover:border-gray-400 transition-all"
              >
                <option value="all">All Roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          }
        />

        <Card className="border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground w-12"></th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Role</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Department</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr 
                      key={member.id} 
                      className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedMember(member)}
                    >
                      <td className="py-4 px-6">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <UserIcon size={20} />
                        </div>
                      </td>
                      <td className="py-4 px-6 text-foreground font-semibold">{member.name}</td>
                      <td className="py-4 px-6 text-foreground">{member.email}</td>
                      <td className="py-4 px-6 text-foreground">
                        <span className="px-3 py-1.5 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold">
                          {member.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        <div className="flex flex-col gap-1">
                          <span>{member.department}</span>
                          <span className="text-xs text-slate-400 font-medium">{member.team}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : member.status === 'onLeave' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                          <span className="text-sm font-medium capitalize">
                            {member.status === 'onLeave' ? 'On Leave' : member.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedMember && (
        <AttendanceModal 
          member={selectedMember} 
          onClose={() => setSelectedMember(null)} 
          currentUser={user}
        />
      )}
    </div>
  );
}

function AttendanceModal({ member, onClose, currentUser }: { member: TeamMember, onClose: () => void, currentUser: any }) {
  const attendanceRecords = useQuery(api.attendanceRecords.getByEmail, { email: member.email }) || [];
  
  const canView = currentUser?.email === member.email || 
                  currentUser?.isSuperAdmin || 
                  currentUser?.role === 'CTO' || 
                  currentUser?.role === 'COO';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">{member.name}'s Profile</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">{member.role} • {member.email}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border">
              <p className="text-sm text-slate-500 font-medium">Department</p>
              <p className="font-semibold">{member.department}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border">
              <p className="text-sm text-slate-500 font-medium">Primary Team</p>
              <p className="font-semibold">{member.team}</p>
            </div>
            {member.additionalTeams && member.additionalTeams.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-xl border col-span-2">
                <p className="text-sm text-slate-500 font-medium">Additional Teams</p>
                <div className="flex gap-2 mt-2">
                  {member.additionalTeams.map(t => (
                    <span key={t} className="px-3 py-1 bg-white border rounded-lg text-sm font-medium shadow-sm">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Attendance History
            </h3>
            
            {!canView ? (
              <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 text-sm font-medium flex items-center gap-2">
                You do not have permission to view this member's attendance records.
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed">
                No attendance records found.
              </div>
            ) : (
              <div className="space-y-3">
                {attendanceRecords.map((record) => (
                  <div key={record._id} className="flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-xl flex flex-col items-center justify-center font-bold">
                        <span className="text-lg leading-none">{format(new Date(record.date), 'dd')}</span>
                        <span className="text-[10px] uppercase">{format(new Date(record.date), 'MMM')}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{format(new Date(record.date), 'EEEE')}</p>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {record.loginTime || '--:--'} - {record.logoutTime || '--:--'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${record.status === 'present' ? 'bg-emerald-100 text-emerald-800' : record.status === 'absent' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                        {record.status}
                      </span>
                      {record.workHours !== undefined && (
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          {Math.floor(record.workHours / 60)}h {record.workHours % 60}m
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
