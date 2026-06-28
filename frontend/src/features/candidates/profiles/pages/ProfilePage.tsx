import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Link as LinkIcon,
  Camera,
  Save,
  FileText,
  Download,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    location: '',
    bio: '',
    website: '',
    linkedin: '',
    github: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(formData);
    toast.success('Profile updated successfully!');
    setIsEditing(false);
  };

  const skills = ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker'];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-900 mb-2">My Profile</h1>
        <p className="text-dark-600">Manage your profile and preferences</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <div className="card text-center">
            <div className="relative inline-block mb-4">
              <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center mx-auto">
                <User className="h-12 w-12 text-primary-600" />
              </div>
              <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-dark-100 flex items-center justify-center border-2 border-white">
                <Camera className="h-4 w-4 text-dark-600" />
              </button>
            </div>
            <h2 className="text-xl font-semibold text-dark-900">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-dark-500 mb-4">Software Developer</p>
            <div className="flex flex-wrap justify-center gap-2">
              {skills.map((skill) => (
                <span key={skill} className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="md:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-dark-900">Personal Information</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary text-sm"
                >
                  Edit Profile
                </button>
              ) : null}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="input pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Add phone number"
                      className="input pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-400" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Add location"
                      className="input pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">
                    Website
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-400" />
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Add website"
                      className="input pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-dark-700 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="input resize-none"
                />
              </div>

              {isEditing && (
                <div className="flex gap-3 mt-6">
                  <button type="submit" className="btn btn-primary">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}