
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Calendar, BookOpen, GraduationCap } from 'lucide-react';
import { Button, EmptyState } from '@/shared/components/ui';
import { useMasterProfileStore, Education } from '@/store';

export const EducationManager: React.FC = () => {
  const { education, addEducation, updateEducation, deleteEducation } = useMasterProfileStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Education>>({
    school: '',
    degree: '',
    fieldOfStudy: '',
    startDate: new Date(),
    endDate: undefined,
    description: ''
  });

  const handleSave = () => {
    if (!formData.school?.trim() || !formData.degree?.trim()) return;

    if (editingId) {
      updateEducation(editingId, formData);
      setEditingId(null);
    } else {
      addEducation({
        id: Date.now().toString(),
        school: formData.school,
        degree: formData.degree,
        fieldOfStudy: formData.fieldOfStudy || '',
        startDate: formData.startDate || new Date(),
        endDate: formData.endDate,
        description: formData.description || ''
      });
    }
    setFormData({
      school: '',
      degree: '',
      fieldOfStudy: '',
      startDate: new Date(),
      endDate: undefined,
      description: ''
    });
    setIsAdding(false);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Present';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          Education
        </h2>
        <Button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {isAdding ? 'Cancel' : 'Add Education'}
        </Button>
      </div>

      {isAdding && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.fieldOfStudy}
                onChange={(e) => setFormData({ ...formData, fieldOfStudy: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, endDate: new Date(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Relevant coursework, honors, activities..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setIsAdding(false); setEditingId(null); }}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      )}

      {education.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="No education added yet"
            description="Add your education history to your profile"
          />
        ) : (
        <div className="space-y-4">
          {education.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map((edu) => (
            <div key={edu.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <GraduationCap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{edu.degree} in {edu.fieldOfStudy}</h3>
                    <p className="text-md text-gray-600">{edu.school}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                    </div>
                    {edu.description && (
                      <p className="text-sm text-gray-700 mt-3 leading-relaxed">{edu.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditingId(edu.id); setFormData(edu); setIsAdding(true); }}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteEducation(edu.id)}
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

