import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Check, X, Clock, User, Calendar, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MembershipApplication {
  id: string;
  email: string;
  name: string;
  university: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: Date;
  inviteCode?: string;
}

const AdminApplications: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedApplication, setSelectedApplication] = useState<MembershipApplication | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['/api/admin/membership-applications'],
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, status, inviteCode }: { 
      applicationId: string; 
      status: 'approved' | 'rejected'; 
      inviteCode?: string 
    }) => {
      const response = await fetch(`/api/admin/membership-applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, inviteCode }),
      });
      if (!response.ok) throw new Error('Failed to update application');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/membership-applications'] });
      setSelectedApplication(null);
      toast({
        title: "Success",
        description: "Application updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredApplications = applications.filter((app: MembershipApplication) => {
    return filter === 'all' || app.status === filter;
  });

  const handleApprove = (applicationId: string) => {
    const inviteCode = `HTX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    updateApplicationMutation.mutate({ applicationId, status: 'approved', inviteCode });
  };

  const handleReject = (applicationId: string) => {
    updateApplicationMutation.mutate({ applicationId, status: 'rejected' });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Membership Applications</h1>
          <p className="text-gray-400">Review and manage membership applications</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex space-x-1">
            {[
              { key: 'pending', label: 'Pending', count: applications.filter((a: MembershipApplication) => a.status === 'pending').length },
              { key: 'approved', label: 'Approved', count: applications.filter((a: MembershipApplication) => a.status === 'approved').length },
              { key: 'rejected', label: 'Rejected', count: applications.filter((a: MembershipApplication) => a.status === 'rejected').length },
              { key: 'all', label: 'All', count: applications.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Applications Grid */}
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {filteredApplications.map((application: MembershipApplication) => (
            <div key={application.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors cursor-pointer"
                 onClick={() => setSelectedApplication(application)}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {application.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{application.name}</h3>
                    <p className="text-gray-400 text-sm">{application.email}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </span>
              </div>

              {/* University */}
              <div className="mb-4">
                <div className="flex items-center text-gray-300 mb-1">
                  <User className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">University</span>
                </div>
                <p className="text-white text-sm">{application.university}</p>
              </div>

              {/* Reason Preview */}
              <div className="mb-4">
                <div className="flex items-center text-gray-300 mb-1">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Reason</span>
                </div>
                <p className="text-gray-400 text-sm line-clamp-3">{application.reason}</p>
              </div>

              {/* Date */}
              <div className="flex items-center text-gray-400 text-sm mb-4">
                <Calendar className="w-4 h-4 mr-2" />
                Applied: {formatDate(application.appliedDate)}
              </div>

              {/* Actions */}
              {application.status === 'pending' && (
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApprove(application.id);
                    }}
                    className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReject(application.id);
                    }}
                    className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              )}

              {application.status === 'approved' && application.inviteCode && (
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Invite Code</div>
                  <div className="text-white font-mono text-sm">{application.inviteCode}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-gray-400 text-lg mb-2">No applications found</h3>
            <p className="text-gray-500">No membership applications match the current filter.</p>
          </div>
        )}

        {/* Application Detail Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Application Details</h2>
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Applicant Info */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Applicant Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Name</label>
                      <p className="text-white">{selectedApplication.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Email</label>
                      <p className="text-white">{selectedApplication.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">University</label>
                      <p className="text-white">{selectedApplication.university}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Applied</label>
                      <p className="text-white">{formatDate(selectedApplication.appliedDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Reason for Application</h3>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-300 whitespace-pre-wrap">{selectedApplication.reason}</p>
                  </div>
                </div>

                {/* Status & Actions */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Status & Actions</h3>
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedApplication.status)}`}>
                      {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                    </span>
                    
                    {selectedApplication.status === 'pending' && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleApprove(selectedApplication.id)}
                          className="bg-green-500/20 text-green-400 hover:bg-green-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve Application</span>
                        </button>
                        <button
                          onClick={() => handleReject(selectedApplication.id)}
                          className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject Application</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {selectedApplication.status === 'approved' && selectedApplication.inviteCode && (
                    <div className="mt-4 bg-gray-700 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-2">Generated Invite Code</div>
                      <div className="text-white font-mono text-lg">{selectedApplication.inviteCode}</div>
                      <div className="text-xs text-gray-500 mt-1">Share this code with the applicant to complete their membership</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApplications;