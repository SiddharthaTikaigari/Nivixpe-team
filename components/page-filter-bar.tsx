'use client';

import { TEAM_MEMBERS } from '@/lib/mock-data';
import { Search, Filter, Users, User } from 'lucide-react';
import { useState, useMemo } from 'react';

interface PageFilterBarProps {
  onTeamChange: (team: string) => void;
  onPersonChange: (person: string) => void;
  selectedTeam?: string;
  selectedPerson?: string;
  showTeamFilter?: boolean;
  showPersonFilter?: boolean;
  /** Restrict to these team members only */
  visibleMembers?: typeof TEAM_MEMBERS;
  extraFilters?: React.ReactNode;
}

const TEAMS = [
  { id: 'all', label: 'All Teams', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { id: 'Business', label: 'Business', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { id: 'Legal', label: 'Legal', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { id: 'Technical', label: 'Technical', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { id: 'Marketing', label: 'Marketing', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { id: 'Design', label: 'Design', color: 'bg-pink-100 text-pink-700 border-pink-300' },
];

export function PageFilterBar({
  onTeamChange,
  onPersonChange,
  selectedTeam = 'all',
  selectedPerson = 'all',
  showTeamFilter = true,
  showPersonFilter = true,
  visibleMembers,
  extraFilters,
}: PageFilterBarProps) {
  const members = visibleMembers || TEAM_MEMBERS;

  const filteredMembers = useMemo(() => {
    if (selectedTeam === 'all') return members;
    return members.filter((m) => m.team === selectedTeam);
  }, [members, selectedTeam]);

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-gray-200/80 shadow-sm">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 mr-1">
        <Filter className="h-4 w-4" />
        Filters
      </div>

      {showTeamFilter && (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          <select
            value={selectedTeam}
            onChange={(e) => {
              onTeamChange(e.target.value);
              onPersonChange('all'); // Reset person when team changes
            }}
            className="px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all cursor-pointer hover:border-gray-400 min-w-[140px]"
          >
            {TEAMS.map((team) => (
              <option key={team.id} value={team.id}>
                {team.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {showPersonFilter && (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <select
            value={selectedPerson}
            onChange={(e) => onPersonChange(e.target.value)}
            className="px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all cursor-pointer hover:border-gray-400 min-w-[160px]"
          >
            <option value="all">All Members</option>
            {filteredMembers.map((member) => (
              <option key={member.id} value={member.name}>
                {member.name} ({member.role})
              </option>
            ))}
          </select>
        </div>
      )}

      {(selectedTeam !== 'all' || selectedPerson !== 'all') && (
        <button
          onClick={() => {
            onTeamChange('all');
            onPersonChange('all');
          }}
          className="px-3.5 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-all"
        >
          Clear Filters
        </button>
      )}
      
      {extraFilters}
    </div>
  );
}
