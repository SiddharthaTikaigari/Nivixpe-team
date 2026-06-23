'use client'

import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageFilterBar } from '@/components/page-filter-bar'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { TEAM_MEMBERS } from '@/lib/mock-data'
import { Shield } from 'lucide-react'
import { useState, useMemo } from 'react'

export default function WorkAllocationPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [filterTeam, setFilterTeam] = useState('all')
  const [filterPerson, setFilterPerson] = useState('all')
  
  // Real-time queries
  const allTasks = useQuery(api.workTasks.getAll) || []
  
  // RBAC: Filter team members based on user role
  const getVisibleMembers = () => {
    if (!user) return []
    
    // CEO sees everyone
    if (user.isSuperAdmin) {
      return TEAM_MEMBERS
    }
    
    // CTO sees everyone (full system access)
    if (user.role === 'CTO') {
      return TEAM_MEMBERS
    }
    
    // CSO sees Business team (including DCSO — mutual visibility)
    if (user.role === 'CSO') {
      return TEAM_MEMBERS.filter(m => m.team === 'Business' || m.name === user.name)
    }
    
    // DCSO sees Business team (including CSO — mutual visibility)
    if (user.role === 'DCSO') {
      return TEAM_MEMBERS.filter(m => m.team === 'Business' || m.name === user.name)
    }
    
    // CMO sees Marketing and Design teams
    if (user.role === 'CMO') {
      return TEAM_MEMBERS.filter(m => m.team === 'Marketing' || m.team === 'Design' || m.name === user.name)
    }
    
    // DCMO sees Marketing team
    if (user.role === 'DCMO') {
      return TEAM_MEMBERS.filter(m => m.team === 'Marketing' || m.name === user.name)
    }
    
    // COO sees all teams
    if (user.role === 'COO') {
      return TEAM_MEMBERS
    }

    // Legal head sees Legal team
    if (user.role === 'Legal') {
      return TEAM_MEMBERS.filter(m => m.team === 'Legal' || m.name === user.name)
    }
    
    // Everyone else sees only themselves
    return TEAM_MEMBERS.filter(m => m.name === user.name)
  }
  
  const visibleMembers = getVisibleMembers()

  // Apply filters
  const filteredMembers = useMemo(() => {
    let result = visibleMembers
    if (filterTeam !== 'all') {
      result = result.filter(m => m.team === filterTeam)
    }
    if (filterPerson !== 'all') {
      result = result.filter(m => m.name === filterPerson)
    }
    return result
  }, [visibleMembers, filterTeam, filterPerson])
  
  // Calculate work distribution for filtered members
  const getTeamWorkStats = () => {
    return filteredMembers.map((member) => {
      const memberTasks = allTasks.filter((t) => t.assignee === member.name)
      const completed = memberTasks.filter((t) => t.status === 'completed').length
      const ongoing = memberTasks.filter((t) => t.status === 'ongoing').length
      const missed = memberTasks.filter((t) => t.status === 'missed').length

      return {
        ...member,
        totalTasks: memberTasks.length,
        completed,
        ongoing,
        missed,
      }
    })
  }

  const teamStats = getTeamWorkStats()

  return (
    <div className="flex-1 overflow-y-auto">
      <Header 
        title="Work Allocation" 
        subtitle={
          user?.isSuperAdmin 
            ? "Distribute and track team workload across all departments" 
            : user?.role === 'CTO'
            ? "Full system access - View all team workload"
            : "View team workload distribution"
        } 
      />

      <div className="p-6 space-y-6">
        {/* CEO/CTO Work Allocation Control */}
        {(user?.isSuperAdmin || user?.role === 'CTO') && (
          <Card className="border-purple-300 bg-purple-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                {user?.isSuperAdmin ? 'CEO Work Allocation Management' : 'CTO System Overview'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-purple-900">
                {user?.isSuperAdmin 
                  ? 'As CEO, you have full control over team work allocation and task distribution. Monitor team capacity and optimize assignments across all departments.'
                  : 'As CTO, you have full system access to view and manage all team work allocation and technical oversight.'
                }
              </p>
              <div className="bg-white rounded-lg border border-purple-200 p-3 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-purple-900">Business Team (Swaraag)</span>
                  <span className="font-semibold text-purple-700">
                    {TEAM_MEMBERS.filter((m) => m.team === 'Business').length} members
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-purple-900">Marketing Team (Abhiram)</span>
                  <span className="font-semibold text-purple-700">
                    {TEAM_MEMBERS.filter((m) => m.team === 'Marketing').length} members
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-purple-900">Design Team (Shubham)</span>
                  <span className="font-semibold text-purple-700">
                    {TEAM_MEMBERS.filter((m) => m.team === 'Design').length} members
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-purple-900">Legal Team (Kashish)</span>
                  <span className="font-semibold text-purple-700">
                    {TEAM_MEMBERS.filter((m) => m.team === 'Legal').length} members
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-purple-900">Technical Team (Shubham)</span>
                  <span className="font-semibold text-purple-700">
                    {TEAM_MEMBERS.filter((m) => m.team === 'Technical').length} members
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Lead Notice */}
        {!user?.isSuperAdmin && user?.role !== 'CTO' && (user?.role === 'CSO' || user?.role === 'CMO' || user?.role === 'DCMO' || user?.role === 'COO' || user?.role === 'Legal') && (
          <Card className="border-blue-300 bg-blue-50">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900">
                You can view work allocation for your team members. Showing {visibleMembers.length} team member(s).
              </p>
            </CardContent>
          </Card>
        )}

        {/* Filter Bar */}
        <PageFilterBar
          onTeamChange={setFilterTeam}
          onPersonChange={setFilterPerson}
          selectedTeam={filterTeam}
          selectedPerson={filterPerson}
          visibleMembers={visibleMembers}
        />

        {/* Work Distribution */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>
              {user?.isSuperAdmin || user?.role === 'CTO' 
                ? 'Team Workload Distribution' 
                : filteredMembers.length > 1
                ? 'Team Workload Distribution'
                : 'My Workload'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Team Member</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Role</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Team</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Total Tasks</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      <span className="text-green-700">Completed</span>
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      <span className="text-yellow-700">Ongoing</span>
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      <span className="text-red-700">Missed</span>
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Completion %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {teamStats.map((member) => {
                    const completionRate =
                      member.totalTasks > 0 ? Math.round((member.completed / member.totalTasks) * 100) : 0
                    return (
                      <tr 
                        key={member.id} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/work-tracker?user=${encodeURIComponent(member.name)}`)}
                      >
                        <td className="px-4 py-3 text-gray-900 font-medium">{member.name}</td>
                        <td className="px-4 py-3 text-gray-600">{member.role}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            member.team === 'Business' ? 'bg-blue-100 text-blue-700' :
                            member.team === 'Legal' ? 'bg-purple-100 text-purple-700' :
                            member.team === 'Technical' ? 'bg-emerald-100 text-emerald-700' :
                            member.team === 'Marketing' ? 'bg-orange-100 text-orange-700' :
                            member.team === 'Design' ? 'bg-pink-100 text-pink-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {member.team || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-900 font-semibold">{member.totalTasks}</td>
                        <td className="px-4 py-3 text-center text-green-700 font-semibold">{member.completed}</td>
                        <td className="px-4 py-3 text-center text-yellow-700 font-semibold">{member.ongoing}</td>
                        <td className="px-4 py-3 text-center text-red-700 font-semibold">{member.missed}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full transition-all"
                                style={{ width: `${completionRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700">{completionRate}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Workload by Member */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamStats.map((member) => (
            <Card 
              key={member.id} 
              className="border-border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/work-tracker?user=${encodeURIComponent(member.name)}`)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{member.name}</CardTitle>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                    member.team === 'Business' ? 'bg-blue-100 text-blue-700' :
                    member.team === 'Legal' ? 'bg-purple-100 text-purple-700' :
                    member.team === 'Technical' ? 'bg-emerald-100 text-emerald-700' :
                    member.team === 'Marketing' ? 'bg-orange-100 text-orange-700' :
                    member.team === 'Design' ? 'bg-pink-100 text-pink-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {member.team || 'N/A'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-green-50">
                    <span className="text-sm text-green-700 font-medium">Completed</span>
                    <span className="text-lg font-bold text-green-700">{member.completed}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-yellow-50">
                    <span className="text-sm text-yellow-700 font-medium">Ongoing</span>
                    <span className="text-lg font-bold text-yellow-700">{member.ongoing}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-red-50">
                    <span className="text-sm text-red-700 font-medium">Missed</span>
                    <span className="text-lg font-bold text-red-700">{member.missed}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50">
                    <span className="text-sm text-blue-700 font-medium">Total</span>
                    <span className="text-lg font-bold text-blue-700">{member.totalTasks}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
