import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Users, MessageSquare, Mail, Linkedin, Search, Plus, Calendar, Edit2, Trash2, Sparkles } from 'lucide-react';
import { PageHeader, Button, EmptyState, Skeleton, Badge } from '@/shared/components/ui';
import { useRecruitersStore, useCompaniesStore, useJobPipelineStore } from '@/store';
import axios from '@/api/axios';

export default function RecruitersPage() {
  const { recruiters, searchQuery, setSearchQuery, fetchRecruiters, createRecruiter, updateRecruiter, deleteRecruiter, isLoading } = useRecruitersStore();
  const { companies, fetchCompanies } = useCompaniesStore();
  const { applications, fetchPipeline } = useJobPipelineStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    name: '', role: '', company: '', email: '', linkedinUrl: '', type: 'recruiter', status: 'active', priority: 'medium',
    notes: '', followUpDate: '', companyId: '', applicationId: '', tags: []
  });

  const [outreachModalOpen, setOutreachModalOpen] = useState(false);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachMessage, setOutreachMessage] = useState<{ subject: string; content: string } | null>(null);
  const [outreachChannel, setOutreachChannel] = useState<'email' | 'linkedin'>('email');
  const [activeRecruiterForOutreach, setActiveRecruiterForOutreach] = useState<any>(null);

  useEffect(() => {
    fetchRecruiters();
    fetchCompanies?.();
    fetchPipeline?.();
  }, [fetchRecruiters, fetchCompanies, fetchPipeline]);

  const handleOpenAdd = () => {
    setSelectedRecruiter(null);
    setFormData({
      name: '', role: '', company: '', email: '', linkedinUrl: '', type: 'recruiter', status: 'active', priority: 'medium',
      notes: '', followUpDate: '', companyId: '', applicationId: '', tags: []
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: any) => {
    setSelectedRecruiter(rec);
    setFormData({
      ...rec,
      followUpDate: rec.followUpDate ? rec.followUpDate.split('T')[0] : '',
      tags: rec.tags || []
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    
    // Auto-map company name if companyId is selected
    if (formData.companyId) {
      const targetCo = companies.find(c => c.id === formData.companyId);
      if (targetCo) formData.company = targetCo.name;
    }

    try {
      if (selectedRecruiter) {
        await updateRecruiter(selectedRecruiter.id, formData);
        toast.success('Recruiter updated successfully');
      } else {
        await createRecruiter(formData);
        toast.success('Recruiter logged successfully');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Error saving recruiter details');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this recruiter from your CRM?')) return;
    try {
      await deleteRecruiter(id);
      toast.success('Recruiter deleted');
    } catch (err) {
      toast.error('Failed to delete recruiter');
    }
  };

  const handleGenerateOutreach = async (rec: any, channel = 'email') => {
    setActiveRecruiterForOutreach(rec);
    setOutreachChannel(channel as any);
    setOutreachModalOpen(true);
    setOutreachLoading(true);

    try {
      // Find target role from linked application if exists
      const targetRole = rec.linkedApplication?.jobTitle || 'Software Engineer';
      const res = await axios.post(`/v2/recruiters/${rec.id}/generate-message`, {
        recruiterId: rec.id,
        role: targetRole,
        channel
      });
      if (res.data.success) {
        setOutreachMessage(res.data.message);
      }
    } catch (err) {
      toast.error('Error generating outreach template');
    } finally {
      setOutreachLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return recruiters;
    return recruiters.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      (r.company || '').toLowerCase().includes(q) ||
      (r.role || '').toLowerCase().includes(q)
    );
  }, [recruiters, searchQuery]);

  const priorityColor = (pri: string) => {
    switch (pri) {
      case 'critical': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'high': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'medium': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 p-6 bg-app-bg text-app-primary min-h-screen">
      <PageHeader title="Recruiter CRM" subtitle="Manage your direct developer relations, outreach records, and interview loops." icon={Users}>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-secondary" />
            <input
              type="text"
              placeholder="Search recruiters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-app-border rounded-lg text-sm bg-app-card text-app-primary focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <Button onClick={handleOpenAdd} className="flex items-center gap-1.5"><Plus className="h-4 w-4" />Add Recruiter</Button>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No recruiters logged" description="Start logging recruiter contacts to keep track of interviews and conversations." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((recruiter) => (
            <div key={recruiter.id} className="bg-app-card rounded-xl border border-app-border p-6 hover:border-blue-400/50 hover:shadow-lg transition duration-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-200">{recruiter.name}</h3>
                  <p className="text-xs text-blue-400">{recruiter.role} at {recruiter.company}</p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <Badge variant={recruiter.status === 'engaged' ? 'success' : 'default'}>{recruiter.status}</Badge>
                  {recruiter.priority && (
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${priorityColor(recruiter.priority)}`}>
                      {recruiter.priority}
                    </span>
                  )}
                </div>
              </div>

              {recruiter.notes && (
                <p className="text-xs text-app-secondary line-clamp-3 bg-slate-900/30 p-2.5 rounded-lg mb-4 border border-app-border">
                  {recruiter.notes}
                </p>
              )}

              {/* Links and Actions */}
              <div className="flex gap-3 mb-4 text-xs text-app-secondary">
                {recruiter.email && (
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{recruiter.email}</span>
                )}
                {recruiter.linkedinUrl && (
                  <a href={recruiter.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-blue-400"><Linkedin className="h-3.5 w-3.5" />Profile</a>
                )}
              </div>

              {recruiter.linkedApplication && (
                <div className="p-2.5 rounded-lg bg-slate-900/50 border border-app-border text-[11px] mb-4">
                  <span className="text-app-secondary">Linked Application:</span>
                  <div className="font-semibold text-slate-350">{recruiter.linkedApplication.jobTitle}</div>
                </div>
              )}

              <div className="border-t border-app-border pt-4 flex justify-between items-center">
                <span className="text-[10px] text-app-secondary flex items-center gap-1">
                  {recruiter.followUpDate ? (
                    <>
                      <Calendar className="h-3.5 w-3.5 text-blue-400" />
                      Follow up: {new Date(recruiter.followUpDate).toLocaleDateString()}
                    </>
                  ) : (
                    'No follow up set'
                  )}
                </span>
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={() => handleGenerateOutreach(recruiter)} className="flex items-center gap-1"><Sparkles className="h-3 w-3" />Outreach</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(recruiter)}><Edit2 className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" className="hover:text-red-500" onClick={() => handleDelete(recruiter.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-app-card border border-app-border rounded-xl shadow-2xl overflow-hidden p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-slate-200 mb-4">{selectedRecruiter ? 'Edit Recruiter Contact' : 'Log Recruiter Connection'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Recruiter Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-app-border rounded-lg text-sm bg-app-bg text-app-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Job Title / Role</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-app-border rounded-lg text-sm bg-app-bg text-app-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Company Name</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 border border-app-border rounded-lg text-sm bg-app-bg text-app-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-app-border rounded-lg text-sm bg-app-bg text-app-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">LinkedIn Profile URL</label>
                  <input
                    type="text"
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-app-border rounded-lg text-sm bg-app-bg text-app-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Linked Company Details</label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    className="w-full px-3 py-2 border border-app-border rounded-lg text-sm bg-app-bg text-app-primary focus:outline-none"
                  >
                    <option value="">-- None --</option>
                    {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Linked Application Loop</label>
                  <select
                    value={formData.applicationId}
                    onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
                    className="w-full px-3 py-2 border border-app-border rounded-lg text-sm bg-app-bg text-app-primary focus:outline-none"
                  >
                    <option value="">-- None --</option>
                    {applications.map((a) => <option key={a.id} value={a.id}>{a.jobTitle} at {a.companyName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-app-border rounded-lg text-sm bg-app-bg text-app-primary focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="engaged">Engaged / Talking</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e: any) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-app-border rounded-lg text-sm bg-app-bg text-app-primary focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Follow Up Reminder Date</label>
                  <input
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                    className="w-full px-3 py-2 border border-app-border rounded-lg text-sm bg-app-bg text-app-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-app-secondary mb-1">Outreach Log Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-app-border rounded-lg text-sm bg-app-bg text-app-primary focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Save Recruiter</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Outreach Generate Modal */}
      {outreachModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOutreachModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-app-card border border-app-border rounded-xl shadow-2xl p-6 overflow-hidden animate-slide-up">
            <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-1.5"><Sparkles className="h-5 w-5 text-blue-400" /> AI Outreach Generator</h3>
            
            {/* Channel Toggle */}
            <div className="flex gap-2 mb-4 bg-app-bg border border-app-border rounded-xl p-1">
              <button
                type="button"
                onClick={() => handleGenerateOutreach(activeRecruiterForOutreach, 'email')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${outreachChannel === 'email' ? 'bg-blue-600 text-white' : 'text-app-secondary hover:text-slate-200'}`}
              >
                Email Template
              </button>
              <button
                type="button"
                onClick={() => handleGenerateOutreach(activeRecruiterForOutreach, 'linkedin')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${outreachChannel === 'linkedin' ? 'bg-blue-600 text-white' : 'text-app-secondary hover:text-slate-200'}`}
              >
                LinkedIn Message
              </button>
            </div>

            {outreachLoading ? (
              <div className="py-8 text-center space-y-3">
                <div className="h-8 w-8 text-blue-400 animate-spin mx-auto border-4 border-blue-500/20 border-t-blue-500 rounded-full" />
                <p className="text-xs text-app-secondary">Generating personalized connection message...</p>
              </div>
            ) : outreachMessage ? (
              <div className="space-y-4">
                {outreachChannel === 'email' && (
                  <div>
                    <label className="block text-xs font-semibold text-app-secondary mb-1">Subject</label>
                    <input
                      type="text"
                      readOnly
                      value={outreachMessage.subject}
                      className="w-full px-3 py-2 border border-app-border rounded-lg text-xs bg-slate-900/50 text-slate-350 focus:outline-none"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Message Content</label>
                  <textarea
                    rows={8}
                    readOnly
                    value={outreachMessage.content}
                    className="w-full px-3 py-2 border border-app-border rounded-lg text-xs bg-slate-900/50 text-slate-350 focus:outline-none resize-none font-mono"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setOutreachModalOpen(false)}>Close</Button>
                  <Button variant="primary" onClick={() => {
                    navigator.clipboard.writeText(outreachMessage.content);
                    toast.success('Message content copied to clipboard!');
                    setOutreachModalOpen(false);
                  }}>Copy Message</Button>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-app-secondary">Failed to generate outreach message template.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
