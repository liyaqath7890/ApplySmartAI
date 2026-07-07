import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Share2, Users, Search, Plus, Linkedin, Github, Globe, Twitter, Mail, Calendar, Eye, Edit2, Trash2 } from 'lucide-react';
import { PageHeader, Button, EmptyState, Skeleton, Badge } from '@/shared/components/ui';
import { useNetworkingStore, NetworkingContact } from '@/store/networkingStore';

export default function NetworkingPage() {
  const { contacts, searchQuery, setSearchQuery, fetchContacts, addContact, updateContact, deleteContact, isLoading } = useNetworkingStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<NetworkingContact | null>(null);
  const [classification, setClassification] = useState('');
  const [formData, setFormData] = useState<Partial<NetworkingContact>>({
    name: '', title: '', company: '', linkedinUrl: '', githubUrl: '', twitterUrl: '', websiteUrl: '', notes: '',
    status: 'connection_request_sent', priority: 'medium', followUpDate: ''
  });

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleOpenAdd = () => {
    setSelectedContact(null);
    setClassification('');
    setFormData({
      name: '', title: '', company: '', linkedinUrl: '', githubUrl: '', twitterUrl: '', websiteUrl: '', notes: '',
      status: 'connection_request_sent', priority: 'medium', followUpDate: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (contact: NetworkingContact) => {
    setSelectedContact(contact);
    const matched = contact.title?.match(/^\[(.*?)\]/);
    const parsedClass = matched ? matched[1] : '';
    const cleanTitle = contact.title?.replace(/^\[.*?\]\s*/, '') || '';
    
    setClassification(parsedClass);
    setFormData({ ...contact, title: cleanTitle });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error('Name is required');
      return;
    }
    
    const finalTitle = classification ? `[${classification}] ${formData.title || ''}`.trim() : formData.title || '';
    const payload = { ...formData, title: finalTitle };

    try {
      if (selectedContact) {
        await updateContact(selectedContact.id, payload);
        toast.success('Contact updated');
      } else {
        await addContact(payload);
        toast.success('Contact added');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Error saving contact');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this contact?')) return;
    try {
      await deleteContact(id);
      toast.success('Contact deleted');
    } catch (err) {
      toast.error('Failed to delete contact');
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.title || '').toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  const statusVariant = (status: string) => {
    switch (status) {
      case 'connected': return 'success';
      case 'referral_received': return 'success';
      case 'referral_requested': return 'warning';
      case 'cold_outreach_sent': return 'info';
      case 'replied': return 'success';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6 p-6 bg-app-bg text-app-primary min-h-screen animate-fade-in">
      <PageHeader title="Networking CRM" subtitle="Manage Stanford alumni, tech mentors, hiring managers, and active referrals." icon={Share2}>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-secondary" />
            <input
              type="text"
              placeholder="Search connections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-app-border rounded-lg text-sm bg-app-card text-app-primary focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <Button onClick={handleOpenAdd} className="flex items-center gap-1.5"><Plus className="h-4 w-4" />Add Contact</Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 bg-gradient-to-br from-indigo-950/10 to-blue-950/10 border border-blue-500/10">
          <h4 className="text-xs font-semibold text-app-secondary uppercase tracking-wider">Total Connections</h4>
          <p className="text-2xl font-bold text-slate-200 mt-1">{contacts.length}</p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-indigo-950/10 to-blue-950/10 border border-blue-500/10">
          <h4 className="text-xs font-semibold text-app-secondary uppercase tracking-wider">Connected</h4>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{contacts.filter(c => c.status === 'connected').length}</p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-indigo-950/10 to-blue-950/10 border border-blue-500/10">
          <h4 className="text-xs font-semibold text-app-secondary uppercase tracking-wider">Referral Pending</h4>
          <p className="text-2xl font-bold text-amber-500 mt-1">{contacts.filter(c => c.status === 'referral_requested').length}</p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-indigo-950/10 to-blue-950/10 border border-blue-500/10">
          <h4 className="text-xs font-semibold text-app-secondary uppercase tracking-wider">Follow Ups Due</h4>
          <p className="text-2xl font-bold text-blue-400 mt-1">{contacts.filter(c => c.followUpDate).length}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No connections logged" description="Add your first contact to get started with networking CRM." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((contact) => (
            <div key={contact.id} className="bg-app-card rounded-xl border border-app-border p-6 hover:border-blue-400/50 hover:shadow-lg transition duration-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-200">{contact.name}</h3>
                  {(() => {
                    const matched = contact.title?.match(/^\[(.*?)\]/);
                    const parsedClass = matched ? matched[1] : '';
                    const cleanTitle = contact.title?.replace(/^\[.*?\]\s*/, '') || contact.title || 'No Title';
                    
                    return (
                      <div className="space-y-1 mt-1">
                        {parsedClass && (
                          <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            parsedClass === 'Hiring Manager' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            parsedClass === 'Alumni' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            parsedClass === 'Mentor' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}>
                            {parsedClass}
                          </span>
                        )}
                        <p className="text-sm text-slate-350">{cleanTitle}</p>
                      </div>
                    );
                  })()}
                  <p className="text-xs text-app-secondary mt-1">{contact.company || 'No Company'}</p>
                </div>
                <Badge variant={statusVariant(contact.status)}>{contact.status.replace(/_/g, ' ')}</Badge>
              </div>

              {contact.notes && (
                <p className="text-xs text-app-secondary line-clamp-2 bg-slate-900/30 p-2.5 rounded-lg mb-4 border border-app-border">
                  {contact.notes}
                </p>
              )}

              {/* Social icons */}
              <div className="flex gap-3 mb-4 text-app-secondary">
                {contact.linkedinUrl && (
                  <a href={contact.linkedinUrl} target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors"><Linkedin className="h-4 w-4" /></a>
                )}
                {contact.githubUrl && (
                  <a href={contact.githubUrl} target="_blank" rel="noreferrer" className="hover:text-slate-100 transition-colors"><Github className="h-4 w-4" /></a>
                )}
                {contact.twitterUrl && (
                  <a href={contact.twitterUrl} target="_blank" rel="noreferrer" className="hover:text-sky-400 transition-colors"><Twitter className="h-4 w-4" /></a>
                )}
                {contact.websiteUrl && (
                  <a href={contact.websiteUrl} target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors"><Globe className="h-4 w-4" /></a>
                )}
              </div>

              <div className="border-t border-app-border pt-4 flex justify-between items-center">
                <span className="text-[10px] text-app-secondary flex items-center gap-1">
                  {contact.followUpDate ? (
                    <>
                      <Calendar className="h-3.5 w-3.5 text-blue-400" />
                      Follow up: {new Date(contact.followUpDate).toLocaleDateString()}
                    </>
                  ) : (
                    'No follow up'
                  )}
                </span>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(contact)}><Edit2 className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="hover:text-red-500" onClick={() => handleDelete(contact.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
            <h3 className="text-lg font-bold text-slate-200 mb-4">{selectedContact ? 'Edit Connection' : 'Add Connection'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-app-border rounded-lg text-sm bg-app-bg text-app-primary focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Classification</label>
                  <select
                    value={classification}
                    onChange={(e) => setClassification(e.target.value)}
                    className="w-full px-3 py-2 border border-app-border rounded-lg text-sm bg-app-bg text-app-primary focus:outline-none"
                  >
                    <option value="">-- None --</option>
                    <option value="Hiring Manager">Hiring Manager</option>
                    <option value="Alumni">Alumni</option>
                    <option value="Mentor">Mentor</option>
                    <option value="Employee">Employee</option>
                    <option value="Referral Source">Referral Source</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Job Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-app-border rounded-lg text-sm bg-app-bg text-app-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
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
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Github URL</label>
                  <input
                    type="text"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-app-border rounded-lg text-sm bg-app-bg text-app-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Website URL</label>
                  <input
                    type="text"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-app-border rounded-lg text-sm bg-app-bg text-app-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Follow Up Date</label>
                  <input
                    type="date"
                    value={formData.followUpDate ? formData.followUpDate.split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                    className="w-full px-3 py-2 border border-app-border rounded-lg text-sm bg-app-bg text-app-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-app-border rounded-lg text-sm bg-app-bg text-app-primary focus:outline-none"
                  >
                    <option value="connection_request_sent">Request Sent</option>
                    <option value="connected">Connected</option>
                    <option value="referral_requested">Referral Requested</option>
                    <option value="referral_received">Referral Received</option>
                    <option value="cold_outreach_sent">Cold Outreach Sent</option>
                    <option value="replied">Replied</option>
                    <option value="other">Other</option>
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-app-secondary mb-1">Conversation Notes / History</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-app-border rounded-lg text-sm bg-app-bg text-app-primary focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
