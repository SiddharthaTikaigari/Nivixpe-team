'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { CheckCircle, AlertCircle, Clock, Info, Plus } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { useState } from 'react';
import { toast } from 'sonner';

export default function LeaveManagementPage() {
  const { user } = useAuth();
  
  // Real-time queries
  const allLeaveRequests = useQuery(api.leaveRequests.getAll) || [];
  const myLeaveRequests = useQuery(api.leaveRequests.getByEmail, user ? { email: user.email } : "skip") || [];
  
  // Mutations
  const updateLeaveStatus = useMutation(api.leaveRequests.updateStatus);
  const createLeaveRequest = useMutation(api.leaveRequests.create);
  
  // Form state
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    type: 'vacation' as 'vacation' | 'sick' | 'personal',
  });
  
  // 4 heads can approve/reject: CEO (Sahith), CTO (Shubham), CSO (Swaraag), COO (Siddhartha) — CMO account disabled
  const canApproveLeave = user?.isSuperAdmin || user?.role === 'CTO' || user?.role === 'CSO' || user?.role === 'COO';
  
  // Show all requests for CEO/CTO, only own requests for others
  const displayRequests = canApproveLeave ? allLeaveRequests : myLeaveRequests;

  const [filterPerson, setFilterPerson] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredRequests = displayRequests.filter((lr) => {
    if (filterPerson !== 'all' && lr.employeeName !== filterPerson) return false;
    if (filterStatus !== 'all' && lr.status !== filterStatus) return false;
    return true;
  });

  const employeeNames = Array.from(new Set(allLeaveRequests.map((lr) => lr.employeeName))).sort();
  
  const approvedCount = filteredRequests.filter((lr) => lr.status === 'approved').length;
  const pendingCount = filteredRequests.filter((lr) => lr.status === 'pending').length;
  const rejectedCount = filteredRequests.filter((lr) => lr.status === 'rejected').length;

  const approved = filteredRequests.filter((lr) => lr.status === 'approved');
  const pending = filteredRequests.filter((lr) => lr.status === 'pending');
  const rejected = filteredRequests.filter((lr) => lr.status === 'rejected');

  const handleApprove = async (requestId: any) => {
    if (!canApproveLeave || !user) return;
    try {
      await updateLeaveStatus({
        id: requestId,
        status: 'approved',
        approvedBy: user.name,
      });
      toast.success('Leave approved successfully');
    } catch (error) {
      console.error('Error approving leave:', error);
      toast.error('Failed to approve leave request');
    }
  };

  const handleReject = async (requestId: any) => {
    if (!canApproveLeave || !user) return;
    try {
      await updateLeaveStatus({
        id: requestId,
        status: 'rejected',
        approvedBy: user.name,
      });
      toast.success('Leave rejected successfully');
    } catch (error) {
      console.error('Error rejecting leave:', error);
      toast.error('Failed to reject leave request');
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      await createLeaveRequest({
        employeeName: user.name,
        employeeEmail: user.email,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        status: 'pending',
        type: formData.type,
      });
      
      // Reset form and close modal
      setFormData({
        startDate: '',
        endDate: '',
        reason: '',
        type: 'vacation',
      });
      setShowRequestForm(false);
      toast.success('Leave request submitted successfully!');
    } catch (error) {
      console.error('Error submitting leave request:', error);
      toast.error('Failed to submit leave request');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Header 
        title={canApproveLeave ? "Leave Management - Approval Dashboard" : "My Leave Requests"} 
        subtitle={canApproveLeave ? "View and manage all employee leave requests" : "View your leave request status and history"} 
      />

      <div className="p-6 space-y-6">
        {/* Request Leave Button - Prominent at Top */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center">
            <div className="text-white">
              <h2 className="text-2xl font-bold mb-2">Need Time Off?</h2>
              <p className="text-purple-100">Submit a leave request for approval by your team lead</p>
            </div>
            <button
              onClick={() => setShowRequestForm(!showRequestForm)}
              className="flex items-center gap-2 px-8 py-3 bg-white text-purple-800 rounded-full font-bold shadow-lg hover:bg-purple-50 hover:shadow-xl transition-all transform hover:-translate-y-0.5 border-none outline-none text-lg"
            >
              <Plus className="h-6 w-6" />
              {showRequestForm ? 'Cancel Request' : 'Request Leave'}
            </button>
          </div>
        </div>

        {/* Leave Request Form */}
        {showRequestForm && (
          <Card className="border-purple-300 bg-white">
            <CardHeader>
              <CardTitle className="text-purple-900">Submit Leave Request</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Leave Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="vacation">Vacation</option>
                    <option value="sick">Sick Leave</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    placeholder="Please provide a reason for your leave request..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Submit Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRequestForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> Your request will be sent to the approval team (CEO, CTO, CSO, or COO). 
                    You'll be notified once your request is reviewed.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Leave System Rules */}
        <Card className="border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Info className="h-5 w-5" />
              Leave System Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-900">
            <div className="space-y-1">
              <p className="font-medium">Post-Login Leave:</p>
              <p className="ml-4">• Employees can take leave at any time after login (no restriction on same-day leave post login)</p>
              <p className="ml-4">• Partial leave is allowed after logging in</p>
            </div>
            <div className="space-y-1 mt-3">
              <p className="font-medium">Full Day Absence:</p>
              <p className="ml-4">• If an employee is absent for the full day (no login), leave approval is mandatory</p>
              <p className="ml-4">• Leave approval must be taken from Team Lead, Reporting Manager, CTO, or CEO</p>
            </div>
            <div className="space-y-1 mt-3">
              <p className="font-medium">Leave Types:</p>
              <p className="ml-4">• <span className="font-medium">Present:</span> Logged in and working</p>
              <p className="ml-4">• <span className="font-medium">Partial Leave:</span> Logged in but left early</p>
              <p className="ml-4">• <span className="font-medium">Full Leave:</span> No login with approved leave request</p>
              <p className="ml-4">• <span className="font-medium">Absent:</span> No login without approved leave (auto-marked)</p>
            </div>
            <div className="space-y-1 mt-3">
              <p className="font-medium">Approval Authority:</p>
              <p className="ml-4">• <span className="font-medium text-amber-700">CEO (Sahith)</span> - Can approve all leave requests</p>
              <p className="ml-4">• <span className="font-medium text-blue-700">CTO (Shubham)</span> - Can approve all leave requests</p>
              <p className="ml-4">• <span className="font-medium text-green-700">CSO (Swaraag)</span> - Can approve all leave requests</p>
              <p className="ml-4">• <span className="font-medium text-orange-700">COO (Siddhartha)</span> - Can approve all leave requests</p>
            </div>
          </CardContent>
        </Card>

        {/* Head Approval Notice */}
        {canApproveLeave && (
          <Card className="border-amber-300 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-900">
                {user?.isSuperAdmin ? 'CEO Approval Dashboard' : 
                 user?.role === 'CTO' ? 'CTO Approval Dashboard' :
                 user?.role === 'CSO' ? 'CSO Approval Dashboard' :
                 'COO Approval Dashboard'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-900">
              <p>You have authority to approve or reject all leave requests. All team members' requests are visible below.</p>
            </CardContent>
          </Card>
        )}

        {/* Regular User Notice */}
        {!canApproveLeave && (
          <Card className="border-green-300 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">My Leave Request History</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-green-900">
              <p>View your leave request status and history. Use the "Request Leave" button above to submit a new leave request.</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">awaiting review</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Leaves</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedCount}</div>
              <p className="text-xs text-muted-foreground">verified and approved</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected Leaves</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedCount}</div>
              <p className="text-xs text-muted-foreground">declined requests</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        {canApproveLeave && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Filter Requests</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <select
                value={filterPerson}
                onChange={(e) => setFilterPerson(e.target.value)}
                className="px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all cursor-pointer min-w-[200px]"
              >
                <option value="all">All Employees</option>
                {employeeNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all cursor-pointer min-w-[160px]"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </CardContent>
          </Card>
        )}

        {/* Pending Requests - Show first for approval */}
        {pending.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-yellow-700">
                {canApproveLeave ? 'Pending Requests - Awaiting Your Approval' : 'My Pending Requests'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pending.map((request) => (
                  <div
                    key={request._id}
                    className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{request.employeeName}</p>
                        <p className="text-sm text-muted-foreground">{request.employeeEmail}</p>
                      </div>
                      <span className="inline-flex px-3 py-1 bg-yellow-600 text-white rounded text-xs font-medium">
                        {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{request.reason}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-muted-foreground">
                        {request.startDate} to {request.endDate}
                      </span>
                      <div className="flex gap-2">
                        {canApproveLeave ? (
                          <>
                            <button 
                              onClick={() => handleApprove(request._id)}
                              className="btn-success py-1.5 px-4 text-xs"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleReject(request._id)}
                              className="btn-danger py-1.5 px-4 text-xs"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <p className="text-sm text-yellow-700 font-medium">Pending Review</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Approved Requests */}
        {approved.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-green-700">
                {canApproveLeave ? 'Approved Requests' : 'My Approved Requests'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {approved.map((request) => (
                  <div
                    key={request._id}
                    className="p-4 rounded-lg bg-green-50 border border-green-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{request.employeeName}</p>
                        <p className="text-sm text-muted-foreground">{request.employeeEmail}</p>
                      </div>
                      <span className="inline-flex px-3 py-1 bg-green-600 text-white rounded text-xs font-medium">
                        {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{request.reason}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-muted-foreground">
                        {request.startDate} to {request.endDate}
                      </span>
                      <div className="text-right">
                        <p className="text-sm text-green-700 font-medium">Approved</p>
                        {request.approvedBy && (
                          <p className="text-xs text-muted-foreground">by {request.approvedBy}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rejected Requests */}
        {rejected.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-red-700">
                {canApproveLeave ? 'Rejected Requests' : 'My Rejected Requests'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rejected.map((request) => (
                  <div
                    key={request._id}
                    className="p-4 rounded-lg bg-red-50 border border-red-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{request.employeeName}</p>
                        <p className="text-sm text-muted-foreground">{request.employeeEmail}</p>
                      </div>
                      <span className="inline-flex px-3 py-1 bg-red-600 text-white rounded text-xs font-medium">
                        {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{request.reason}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-muted-foreground">
                        {request.startDate} to {request.endDate}
                      </span>
                      <div className="text-right">
                        <p className="text-sm text-red-700 font-medium">Rejected</p>
                        {request.approvedBy && (
                          <p className="text-xs text-muted-foreground">by {request.approvedBy}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No requests message */}
        {displayRequests.length === 0 && (
          <Card className="border-border">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {canApproveLeave ? 'No leave requests to display' : 'You have no leave requests yet'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
