
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Calendar, MapPin, Building2 } from 'lucide-react';
import { Button, EmptyState } from '@/shared/components/ui';
import { useMasterProfileStore, Experience } from '@/store';

export const ExperienceManager: React.FC = () => {
  const { experience, addExperience, updateExperience, deleteExperience } = useMasterProfileStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Experience>>({
    company: '',
    position: '',
    location: '',
    startDate: new Date(),
    endDate: undefined,
    isCurrent: false,
    description: ''
  });

  const handleSave = () => {
    if (!formData.company?.trim() || !formData.position?.trim()) return;
    
    if (editingId) {
      updateExperience(editingId, formData);
      setEditingId(null);
    } else {
      addExperience({
        company: formData.company,
        position: formData.position,
        location: formData.location || '',
        startDate: formData.startDate || new Date(),
        endDate: formData.isCurrent ? undefined : formData.endDate,
        isCurrent: formData.isCurrent || false,
        description: formData.description || ''
      });
    }
    setFormData({
      company: '',
      position: '',
      location: '',
      startDate: new Date(),
      endDate: undefined,
      isCurrent: false,
      description: ''
    });
    setIsAdding(false);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Present';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  return (
    <div className="bg-app-card rounded-xl border border-app-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-app-primary flex items-center gap-2">
          Work Experience
        </h2>
        <Button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {isAdding ? 'Cancel' : 'Add Experience'}
        </Button>
      </div>

      {isAdding && (
        <div className="mb-6 p-4 bg-app-hover rounded-lg border border-app-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-app-secondary mb-1">Company Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-app-border rounded-lg bg-app-bg text-app-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-app-secondary mb-1">Position</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-app-border rounded-lg bg-app-bg text-app-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-app-secondary mb-1">Location</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-app-border rounded-lg bg-app-bg text-app-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-app-secondary mb-1">Start Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-app-border rounded-lg bg-app-bg text-app-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="isCurrent"
              checked={formData.isCurrent}
              onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked, endDate: e.target.checked ? undefined : formData.endDate })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isCurrent" className="text-sm font-medium text-app-secondary">I currently work here</label>
          </div>
          {!formData.isCurrent && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-app-secondary mb-1">End Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-app-border rounded-lg bg-app-bg text-app-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, endDate: new Date(e.target.value) })}
              />
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-app-secondary mb-1">Description</label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-app-border rounded-lg bg-app-bg text-app-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your roles and responsibilities..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setIsAdding(false); setEditingId(null); }}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      )}

      {experience.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="No work experience added yet"
            description="Add your work experience to build a strong profile"
          />
        ) : (
        <div className="space-y-4">
          {experience.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map((exp) => (
            <div key={exp.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{exp.position}</h3>
                    <p className="text-md text-gray-600">{exp.company}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                    </div>
                    {exp.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <MapPin className="h-4 w-4" />
                        {exp.location}
                      </div>
                    )}
                    {exp.description && (
                      <p className="text-sm text-gray-700 mt-3 leading-relaxed">{exp.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditingId(exp.id); setFormData(exp); setIsAdding(true); }}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteExperience(exp.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


