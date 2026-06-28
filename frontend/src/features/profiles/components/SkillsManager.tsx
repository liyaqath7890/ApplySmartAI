
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { Button, EmptyState } from '@/shared/components/ui';
import { useMasterProfileStore, Skill } from '@/store';

interface SkillsManagerProps {
  skills?: Skill[];
}

export const SkillsManager: React.FC<SkillsManagerProps> = ({}) => {
  const { skills, addSkill, updateSkill, deleteSkill, setLoading } = useMasterProfileStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Skill>>({
    name: '',
    category: '',
    proficiency: 'intermediate',
    yearsOfExperience: 1
  });

  const handleSave = () => {
    if (!formData.name?.trim()) return;
    
    if (editingId) {
      updateSkill(editingId, formData);
      setEditingId(null);
    } else {
      addSkill({
        id: Date.now().toString(),
        name: formData.name,
        category: formData.category || '',
        proficiency: formData.proficiency || 'intermediate',
        yearsOfExperience: formData.yearsOfExperience || 0
      });
    }
    setFormData({ name: '', category: '', proficiency: 'intermediate', yearsOfExperience: 1 });
    setIsAdding(false);
  };

  const getProficiencyColor = (proficiency: string) => {
    switch (proficiency) {
      case 'beginner': return 'bg-yellow-100 text-yellow-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      case 'expert': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          Skills
        </h2>
        <Button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {isAdding ? 'Cancel' : 'Add Skill'}
        </Button>
      </div>

      {isAdding && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skill Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.proficiency}
                onChange={(e) => setFormData({ ...formData, proficiency: e.target.value as any })}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Years Experience</label>
              <input
                type="number"
                min="0"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.yearsOfExperience}
                onChange={(e) => setFormData({ ...formData, yearsOfExperience: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setIsAdding(false); setFormData({ name: '', category: '', proficiency: 'intermediate', yearsOfExperience: 1 }); }}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      )}

      {skills.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="No skills added yet"
            description="Add your skills to improve your job match score"
          />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill) => (
            <div key={skill.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{skill.name}</h3>
                  {skill.category && (
                    <p className="text-sm text-gray-500 mt-1">{skill.category}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditingId(skill.id); setFormData(skill); setIsAdding(true); }}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteSkill(skill.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getProficiencyColor(skill.proficiency)}`}>
                  {skill.proficiency}
                </span>
                <span className="text-sm text-gray-600">
                  {skill.yearsOfExperience} {skill.yearsOfExperience === 1 ? 'year' : 'years'} exp
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

