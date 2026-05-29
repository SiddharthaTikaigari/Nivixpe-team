'use client';

// Using real-time members from prop
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { confirmDelete } from '@/lib/confirm-delete';

interface WorkItem {
  id: string;
  title: string;
  assignee: string;
  assigneeRole: string;
  status?: string;
  dueDate: string;
  priority: string;
  description?: string;
}

interface TeamWorkOverviewProps {
  workItems: WorkItem[];
  onDeleteWork: (id: string) => void;
  members: any[];
}

export function TeamWorkOverview({ workItems, onDeleteWork, members }: TeamWorkOverviewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const filteredWork = workItems.filter((work) => {
    const matchesSearch =
      work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.assignee.toLowerCase().includes(searchTerm.toLowerCase());

    const assignee = members.find((m) => m.name === work.assignee || m.email === work.assignee);
    const matchesTeam = filterTeam === 'all' || assignee?.team === filterTeam;
    const matchesPriority = filterPriority === 'all' || work.priority === filterPriority;

    return matchesSearch && matchesTeam && matchesPriority;
  });

  const teams = Array.from(new Set(members.map((m) => m.team).filter(Boolean)));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>All Team Work Assignments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by work title or assignee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="all">All Teams</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredWork.length} of {workItems.length} work assignments
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground">Work Title</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Assigned To</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Priority</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Due Date</th>
                <th className="text-center py-3 px-4 font-semibold text-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredWork.length > 0 ? (
                filteredWork.map((work, index) => (
                  <tr key={work.id || work._id || index} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-foreground">{work.title}</p>
                        {work.description && (
                          <p className="text-xs text-muted-foreground mt-1">{work.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-foreground">{work.assignee}</p>
                        <p className="text-xs text-muted-foreground">{work.assigneeRole}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded border ${getPriorityColor(work.priority)}`}>
                        {work.priority.charAt(0).toUpperCase() + work.priority.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground">{work.dueDate}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          if (!confirmDelete('work assignment', work.title)) return;
                          onDeleteWork(work.id || work._id);
                        }}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                        title="Delete this work assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No work assignments found matching your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
