
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Calendar, Award, ExternalLink } from 'lucide-react';
import { Button, EmptyState } from '@/shared/components/ui';
import { useMasterProfileStore, Certification } from '@/store';

export const CertificationManager: React.FC = () => {
  const { certifications, addCertification, updateCertification, deleteCertification } = useMasterProfileStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Certification>>({
    name: '',
    issuingOrganization: '',
    issueDate: new Date(),
    expirationDate: undefined,
    credentialId: '',
    credentialUrl: ''
  });

  const handleSave = () => {
    if (!formData.name?.trim() || !formData.issuingOrganization?.trim()) return;

    if (editingId) {
      updateCertification(editingId, formData);
      setEditingId(null);
    } else {
      addCertification({
        id: Date.now().toString(),
        name: formData.name,
        issuingOrganization: formData.issuingOrganization,
        issueDate: formData.issueDate || new Date(),
        expirationDate: formData.expirationDate,
        credentialId: formData.credentialId,
        credentialUrl: formData.credentialUrl
      });
    }
    setFormData({
      name: '',
      issuingOrganization: '',
      issueDate: new Date(),
      expirationDate: undefined,
      credentialId: '',
      credentialUrl: ''
    });
    setIsAdding(false);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'No Expiration';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          Certifications
        </h2>
        <Button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {isAdding ? 'Cancel' : 'Add Certification'}
        </Button>
      </div>

      {isAdding && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certification Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Organization</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.issuingOrganization}
                onChange={(e) => setFormData({ ...formData, issuingOrganization: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.issueDate ? new Date(formData.issueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, issueDate: new Date(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.expirationDate ? new Date(formData.expirationDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, expirationDate: new Date(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credential ID</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.credentialId}
                onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credential URL</label>
              <input
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.credentialUrl}
                onChange={(e) => setFormData({ ...formData, credentialUrl: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setIsAdding(false); setEditingId(null); }}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      )}

      {certifications.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="No certifications added yet"
            description="Add certifications to boost your profile"
          />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certifications.map((cert) => (
            <div key={cert.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{cert.name}</h3>
                    <p className="text-md text-gray-600">{cert.issuingOrganization}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Calendar className="h-4 w-4" />
                      Issued: {formatDate(cert.issueDate)}
                    </div>
                    {cert.expirationDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Calendar className="h-4 w-4" />
                        Expires: {formatDate(cert.expirationDate)}
                      </div>
                    )}
                    {cert.credentialId && (
                      <p className="text-sm text-gray-600 mt-2">ID: {cert.credentialId}</p>
                    )}
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1 mt-2"
                      >
                        View Credential <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditingId(cert.id); setFormData(cert); setIsAdding(true); }}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteCertification(cert.id)}
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

