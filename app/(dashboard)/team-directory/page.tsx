'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TEAM_MEMBERS } from '@/lib/mock-data';
import { Search, User as UserIcon } from 'lucide-react';

export default function TeamDirectoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const filteredMembers = TEAM_MEMBERS.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const roles = Array.from(new Set(TEAM_MEMBERS.map((m) => m.role)));

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Team Directory" subtitle="View all team members and their information" />

      <div className="p-6 space-y-4">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="all">All Roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {filteredMembers.length} of {TEAM_MEMBERS.length} members
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground w-12"></th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <UserIcon size={16} />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground font-medium">{member.name}</td>
                      <td className="py-3 px-4 text-foreground">{member.email}</td>
                      <td className="py-3 px-4 text-foreground">
                        <span className="px-2.5 py-1.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{member.department}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              member.status === 'active'
                                ? 'bg-green-500'
                                : member.status === 'onLeave'
                                  ? 'bg-yellow-500'
                                  : 'bg-gray-400'
                            }`}
                          ></span>
                          <span className="text-xs capitalize">
                            {member.status === 'onLeave' ? 'On Leave' : member.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">
                        {member.lastLogin || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
