'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/providers';
import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Calendar, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isNightShiftWorker, getAttendanceShiftNote, NIGHT_SHIFT_START } from '@/lib/attendance-shift';

export default function AttendancePage() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState('');
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Real-time queries
  const todayAttendance = useQuery(api.attendanceRecords.getByDate, { date: today }) || [];
  const myAttendance = todayAttendance.find(a => a.email === user?.email);
  const activeLeavesToday = useQuery(api.leaveRequests.getActiveLeavesToday, { date: today }) || [];
  
  // Mutations
  const markAttendance = useMutation(api.attendanceRecords.create);
  const updateAttendance = useMutation(api.attendanceRecords.update);
  
  // Update current time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const allMembers = useQuery(api.teamMembers.getAll) || [];
  const activeMembers = allMembers.filter(m => m.status === 'active');
  
  const presentCount = todayAttendance.filter((a) => a.status === 'present').length;
  const onLeaveCount = activeLeavesToday.length;
  
  // Absent = Active members who haven't logged in and are not on leave
  const markedEmails = new Set(todayAttendance.map(a => a.email));
  const leaveEmails = new Set(activeLeavesToday.map(l => l.employeeEmail));
  const absentCount = activeMembers.filter(m => 
    !markedEmails.has(m.email) && !leaveEmails.has(m.email)
  ).length;
  
  const insufficientHours = todayAttendance.filter((a) => 
    a.status === 'present' && a.workHours !== undefined && a.workHours < 240
  ).length;

  const handleMarkLogin = async () => {
    if (!user) return;
    
    const now = new Date();
    const loginTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
    
    try {
      await markAttendance({
        date: today,
        email: user.email,
        loginTime: loginTime,
        status: 'present',
        workHours: 0,
      });
      alert(`Attendance marked successfully! Remember to work minimum 4 hours.`);
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert(error instanceof Error ? error.message : 'Failed to mark attendance. Please try again.');
    }
  };
  
  const handleMarkLogout = async () => {
    if (!user || !myAttendance) return;
    
    const now = new Date();
    const logoutTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
    
    // Calculate work hours
    const loginParts = (myAttendance.loginTime || '00:00').split(':');
    const logoutParts = logoutTime.split(':');
    const loginMinutes = parseInt(loginParts[0]) * 60 + parseInt(loginParts[1]);
    const logoutMinutes = parseInt(logoutParts[0]) * 60 + parseInt(logoutParts[1]);
    const workMinutes = Math.max(0, logoutMinutes - loginMinutes);
    const workHours = Math.floor(workMinutes / 60);
    const workMins = workMinutes % 60;
    
    try {
      await updateAttendance({
        id: myAttendance._id,
        logoutTime: logoutTime,
        workHours: workMinutes,
      });
      
      if (workMinutes < 240) {
        alert(`⚠️ Logout recorded: ${logoutTime}\nWork time: ${workHours}h ${workMins}m\n\nWARNING: Less than 4 hours minimum requirement!`);
      } else {
        alert(`✅ Logout recorded: ${logoutTime}\nWork time: ${workHours}h ${workMins}m\n\nGreat job meeting the 4-hour requirement!`);
      }
    } catch (error) {
      console.error('Error marking logout:', error);
      alert('Failed to mark logout. Please try again.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Attendance" subtitle="Daily attendance tracking for team members" />

      <div className="p-6 space-y-6">
        {/* Current Time and Date */}
        <Card className="border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calendar className="h-5 w-5" />
              Today's Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-900">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-sm text-blue-700 mt-1">Current Time: {currentTime}</p>
              </div>
              {user && (
                <div className="flex gap-2">
                  {!myAttendance ? (
                    <button
                      onClick={handleMarkLogin}
                      className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Mark Login
                    </button>
                  ) : (
                    <>
                      <div className="px-4 py-2 bg-green-100 text-green-800 rounded font-medium flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Logged In: {myAttendance.loginTime}
                      </div>
                      {!myAttendance.logoutTime && (
                        <button
                          onClick={handleMarkLogout}
                          className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 flex items-center gap-2"
                        >
                          <Clock className="h-4 w-4" />
                          Mark Logout
                        </button>
                      )}
                      {myAttendance.logoutTime && (
                        <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Logged Out: {myAttendance.logoutTime}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Rules */}
        {user && isNightShiftWorker(user) && (
          <Card className="border-indigo-300 bg-indigo-50">
            <CardHeader>
              <CardTitle className="text-indigo-900 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Night Shift Attendance — {user.role}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-indigo-900 space-y-2">
              <p className="font-semibold">Your primary shift starts at {NIGHT_SHIFT_START} (9:00 PM).</p>
              <p>{getAttendanceShiftNote(user)}</p>
              <p className="text-indigo-700">
                Daytime login is optional — use Mark Login whenever you begin working, day or night.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              CRITICAL: Mandatory Attendance Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-900 space-y-2">
            <p className="font-bold text-lg underline">MANDATORY: All employees (including Leads) MUST work minimum 4 hours per day.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="list-disc list-inside space-y-1">
                <li>Mark <strong>LOGIN</strong> when you start work (any time{user && isNightShiftWorker(user) ? ', including before 9 PM if working during the day' : ''})</li>
                <li>Mark <strong>LOGOUT</strong> when you finish work</li>
                <li>System automatically calculates work hours</li>
              </ul>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Status:</strong> Present (if logged in) or Absent (if not)</li>
                <li><strong>On Leave:</strong> Approved leaves are synced automatically</li>
                <li>You can only mark attendance for <strong>TODAY</strong></li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Active Leaves Today */}
        {activeLeavesToday.length > 0 && (
          <Card className="border-blue-300 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Active Leaves Today ({activeLeavesToday.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeLeavesToday.map((leave) => (
                  <div key={leave._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                    <div>
                      <p className="font-medium text-blue-900">{leave.employeeName}</p>
                      <p className="text-xs text-blue-700">{leave.type} leave • {leave.startDate} to {leave.endDate}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium">
                      On Leave
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-green-200 bg-green-50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-green-800 uppercase tracking-wider">Present</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-green-900">{presentCount}</div>
              <p className="text-xs text-green-700 font-medium">Logged in today</p>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200 bg-blue-50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-blue-800 uppercase tracking-wider">On Leave</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-blue-900">{onLeaveCount}</div>
              <p className="text-xs text-blue-700 font-medium">Approved leave</p>
            </CardContent>
          </Card>
          
          <Card className="border-red-200 bg-red-50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-red-800 uppercase tracking-wider">Absent</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-red-900">{absentCount}</div>
              <p className="text-xs text-red-700 font-medium">Not logged in yet</p>
            </CardContent>
          </Card>
          
          <Card className={cn(
            "shadow-sm transition-all duration-300",
            insufficientHours > 0 ? "border-orange-300 bg-orange-50 animate-pulse" : "border-slate-200 bg-slate-50"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-orange-800 uppercase tracking-wider">⚠️ Below 4h</CardTitle>
              <Timer className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-orange-900">{insufficientHours}</div>
              <p className="text-xs text-orange-700 font-medium">Below minimum requirement</p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Table */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Today&apos;s Attendance - {today}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Login Time</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Logout Time</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Work Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAttendance.length > 0 ? (
                    todayAttendance.map((record) => {
                      const workMins = record.workHours || 0;
                      const hours = Math.floor(workMins / 60);
                      const mins = workMins % 60;
                      const workTimeStr = `${hours}h ${mins}m`;
                      const isSufficient = workMins >= 240;
                      
                      return (
                        <tr key={record._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 text-foreground">{record.email}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1.5 rounded text-xs font-medium ${
                                record.status === 'present'
                                  ? 'bg-green-100 text-green-800'
                                  : record.status === 'onLeave'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {record.status === 'onLeave' ? 'On Leave' : record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{record.loginTime || '—'}</td>
                          <td className="py-3 px-4 text-muted-foreground">{record.logoutTime || '—'}</td>
                          <td className="py-3 px-4">
                            {record.logoutTime ? (
                              <span className={`inline-flex items-center px-2.5 py-1.5 rounded text-xs font-medium ${
                                isSufficient ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                              }`}>
                                {workTimeStr} {!isSufficient && '⚠️'}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        No attendance marked yet for today
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
