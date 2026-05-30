'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, FileText, Plus, Upload, Shield, X, Video, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/providers';
import { useState } from 'react';
import { TEAM_MEMBERS } from '@/lib/mock-data';
import { confirmDelete } from '@/lib/confirm-delete';

export default function MeetingsPage() {
  const { user } = useAuth();
  
  // Real-time queries
  const allMeetings = useQuery(api.meetings.getAll) || [];
  
  const scheduleWithGoogleMeet = useAction(api.meetingsActions.scheduleWithGoogleMeet);
  const updateMeeting = useMutation(api.meetings.update);
  const deleteMeeting = useMutation(api.meetings.remove);
  
  const canManageMeetings = user?.isSuperAdmin || user?.role === 'CEO' || user?.role === 'COO';
  
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showMOMUpload, setShowMOMUpload] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  
  const [scheduleFormData, setScheduleFormData] = useState({
    title: '',
    date: '',
    time: '',
    attendees: [] as string[],
    agenda: '',
  });
  
  const [momFormData, setMOMFormData] = useState({
    minutesUrl: '',
    decisions: '',
  });
  
  const scheduled = allMeetings.filter((m) => m.status === 'scheduled');
  const completed = allMeetings.filter((m) => m.status === 'completed');
  const cancelled = allMeetings.filter((m) => m.status === 'cancelled');

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageMeetings || !user) return;

    setIsScheduling(true);
    try {
      const result = await scheduleWithGoogleMeet({
        title: scheduleFormData.title,
        date: scheduleFormData.date,
        time: scheduleFormData.time,
        attendees: scheduleFormData.attendees,
        agenda: scheduleFormData.agenda || undefined,
        scheduledBy: user.name,
      });

      setScheduleFormData({
        title: '',
        date: '',
        time: '',
        attendees: [],
        agenda: '',
      });
      setShowScheduleForm(false);
      alert(
        `Meeting scheduled successfully!\n\nGoogle Meet link:\n${result.meetLink}`,
      );
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to schedule meeting. Ensure Google Calendar API credentials are configured in Convex.',
      );
    } finally {
      setIsScheduling(false);
    }
  };

  const handleUploadMOM = async (e: React.FormEvent, meetingId: any) => {
    e.preventDefault();
    if (!canManageMeetings) return;
    
    try {
      await updateMeeting({
        id: meetingId,
        status: 'completed',
        minutesUrl: momFormData.minutesUrl,
        decisions: momFormData.decisions,
      });
      
      // Reset form
      setMOMFormData({
        minutesUrl: '',
        decisions: '',
      });
      setShowMOMUpload(null);
      alert('Minutes of Meeting uploaded successfully!');
    } catch (error) {
      console.error('Error uploading MOM:', error);
      alert('Failed to upload MOM');
    }
  };

  const toggleAttendee = (name: string) => {
    setScheduleFormData(prev => ({
      ...prev,
      attendees: prev.attendees.includes(name)
        ? prev.attendees.filter(a => a !== name)
        : [...prev.attendees, name]
    }));
  };

  const handleDeleteMeeting = async (meetingId: any, meetingTitle: string) => {
    if (!canManageMeetings) return;
    if (!confirmDelete('meeting', meetingTitle)) return;

    try {
      await deleteMeeting({ id: meetingId });
      alert('Meeting deleted successfully.');
    } catch (error) {
      console.error('Error deleting meeting:', error);
      alert('Failed to delete meeting.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Header 
        title="Meetings & Minutes" 
        subtitle={canManageMeetings ? "Schedule meetings with auto-generated Google Meet links (CEO/COO Access)" : "View scheduled meetings and minutes"} 
      />

      <div className="p-6 space-y-6">
        {/* CEO/COO Schedule Meeting Button */}
        {canManageMeetings && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 shadow-lg">
            <div className="flex justify-between items-center">
              <div className="text-white">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Shield className="h-6 w-6" />
                  {user?.role === 'CEO' ? 'CEO' : 'COO'} Meeting Management
                </h2>
                <p className="text-blue-100">Schedule meetings — a Google Meet link is created automatically via Google Calendar API</p>
              </div>
              <button
                onClick={() => setShowScheduleForm(!showScheduleForm)}
                className="flex items-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors shadow-lg font-bold text-lg"
              >
                <Plus className="h-6 w-6" />
                {showScheduleForm ? 'Cancel' : 'Schedule Meeting'}
              </button>
            </div>
          </div>
        )}

        {/* Schedule Meeting Form - CEO/COO Only */}
        {canManageMeetings && showScheduleForm && (
          <Card className="border-blue-300 bg-white">
            <CardHeader>
              <CardTitle className="text-blue-900">Schedule New Meeting</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleScheduleMeeting} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={scheduleFormData.title}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, title: e.target.value })}
                    placeholder="e.g., Business Team Sync"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={scheduleFormData.date}
                      onChange={(e) => setScheduleFormData({ ...scheduleFormData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={scheduleFormData.time}
                      onChange={(e) => setScheduleFormData({ ...scheduleFormData, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Attendees <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 border border-gray-300 rounded-lg">
                    {TEAM_MEMBERS.map((member) => (
                      <label key={member.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={scheduleFormData.attendees.includes(member.name)}
                          onChange={() => toggleAttendee(member.name)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{member.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {scheduleFormData.attendees.length} attendee(s)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agenda (Optional)
                  </label>
                  <textarea
                    value={scheduleFormData.agenda}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, agenda: e.target.value })}
                    rows={3}
                    placeholder="Meeting agenda and topics to discuss..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={scheduleFormData.attendees.length === 0 || isScheduling}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isScheduling && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isScheduling ? 'Creating Google Meet...' : 'Schedule Meeting + Google Meet'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScheduleForm(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduled.length}</div>
              <p className="text-xs text-muted-foreground">upcoming meetings</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completed.length}</div>
              <p className="text-xs text-muted-foreground">with minutes available</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allMeetings.length}</div>
              <p className="text-xs text-muted-foreground">all time</p>
            </CardContent>
          </Card>
        </div>

        {/* Scheduled Meetings */}
        {scheduled.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-blue-700">Upcoming Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scheduled.map((meeting) => (
                  <div
                    key={meeting._id}
                    className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{meeting.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {meeting.date} at {meeting.time}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium">
                          Scheduled
                        </span>
                        {canManageMeetings && (
                          <>
                            <button
                              onClick={() => setShowMOMUpload(showMOMUpload === meeting._id ? null : meeting._id)}
                              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                            >
                              <Upload className="w-3 h-3" />
                              Upload MOM
                            </button>
                            <button
                              onClick={() => handleDeleteMeeting(meeting._id, meeting.title)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              title="Delete meeting"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Attendees:</p>
                      <div className="flex flex-wrap gap-1">
                        {meeting.attendees.map((attendee: string) => (
                          <span
                            key={attendee}
                            className="inline-flex px-2.5 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                          >
                            {attendee}
                          </span>
                        ))}
                      </div>
                    </div>
                    {meeting.agenda && (
                      <div className="pt-2 border-t border-blue-200">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Agenda:</p>
                        <p className="text-sm text-gray-700">{meeting.agenda}</p>
                      </div>
                    )}
                    {meeting.meetLink && (
                      <div className="pt-2 border-t border-blue-200">
                        <a
                          href={meeting.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-700 font-medium text-sm hover:underline"
                        >
                          <Video className="w-4 h-4" />
                          Join Google Meet
                        </a>
                      </div>
                    )}
                    
                    {/* MOM Upload Form - CEO/COO Only */}
                    {canManageMeetings && showMOMUpload === meeting._id && (
                      <div className="pt-3 border-t border-blue-300">
                        <form onSubmit={(e) => handleUploadMOM(e, meeting._id)} className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Minutes URL (PDF/DOCX Link) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="url"
                              required
                              value={momFormData.minutesUrl}
                              onChange={(e) => setMOMFormData({ ...momFormData, minutesUrl: e.target.value })}
                              placeholder="https://drive.google.com/file/..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Upload your PDF/DOCX to Google Drive or Dropbox and paste the shareable link
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Key Decisions & Action Items
                            </label>
                            <textarea
                              value={momFormData.decisions}
                              onChange={(e) => setMOMFormData({ ...momFormData, decisions: e.target.value })}
                              rows={3}
                              placeholder="Summary of key decisions and action items..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              type="submit"
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                            >
                              Upload MOM
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowMOMUpload(null)}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Meetings */}
        {completed.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-green-700">Completed Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completed.map((meeting) => (
                  <div
                    key={meeting._id}
                    className="p-4 rounded-lg bg-green-50 border border-green-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{meeting.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {meeting.date} at {meeting.time}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex px-3 py-1 bg-green-600 text-white rounded text-xs font-medium">
                          Completed
                        </span>
                        {canManageMeetings && (
                          <button
                            onClick={() => handleDeleteMeeting(meeting._id, meeting.title)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Delete meeting"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Attendees:</p>
                      <div className="flex flex-wrap gap-1">
                        {meeting.attendees.map((attendee: string) => (
                          <span
                            key={attendee}
                            className="inline-flex px-2.5 py-1 bg-green-100 text-green-800 rounded text-xs"
                          >
                            {attendee}
                          </span>
                        ))}
                      </div>
                    </div>
                    {meeting.decisions && (
                      <div className="pt-2 border-t border-green-200">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Key Decisions:</p>
                        <p className="text-sm text-gray-700">{meeting.decisions}</p>
                      </div>
                    )}
                    {meeting.minutesUrl && (
                      <div className="pt-2 border-t border-green-200">
                        <a
                          href={meeting.minutesUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-green-700 font-medium text-sm hover:text-green-800 hover:underline"
                        >
                          <FileText className="w-4 h-4" />
                          View Minutes of Meeting (MOM)
                        </a>
                      </div>
                    )}
                    {meeting.meetLink && (
                      <div className="pt-2 border-t border-green-200">
                        <a
                          href={meeting.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-700 font-medium text-sm hover:underline"
                        >
                          <Video className="w-4 h-4" />
                          Google Meet Recording Link
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
