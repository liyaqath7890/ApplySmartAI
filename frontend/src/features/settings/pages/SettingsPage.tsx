import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  User,
  Bell,
  Lock,
  Shield,
  Mail,
  Save,
  ToggleLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState({
    email: true,
    jobAlerts: true,
    applicationUpdates: true,
    newsletters: false,
  });

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-900 mb-2">Settings</h1>
        <p className="text-dark-600">Manage your account preferences</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <User className="h-5 w-5 text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-dark-900">Profile</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-dark-500">Name</label>
              <p className="text-dark-900">{user?.firstName} {user?.lastName}</p>
            </div>
            <div>
              <label className="text-sm text-dark-500">Email</label>
              <p className="text-dark-900">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm text-dark-500">Role</label>
              <p className="text-dark-900 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Bell className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-dark-900">Notifications</h2>
          </div>
          <div className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-dark-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <button
                  onClick={() => setNotifications((prev) => ({ ...prev, [key]: !value }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? 'bg-primary-600' : 'bg-dark-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Lock className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-dark-900">Security</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-dark-500">Password</label>
              <p className="text-dark-900">••••••••</p>
              <button className="text-sm text-primary-600 hover:text-primary-700 mt-1">
                Change password
              </button>
            </div>
            <div>
              <label className="text-sm text-dark-500">Two-Factor Authentication</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="badge badge-success">Enabled</span>
                <button className="text-sm text-primary-600 hover:text-primary-700">
                  Manage
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-dark-500">Email Verified</label>
              <div className="flex items-center gap-2 mt-1">
                {user?.isEmailVerified ? (
                  <span className="badge badge-success">Verified</span>
                ) : (
                  <span className="badge badge-warning">Not Verified</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button onClick={handleSave} className="btn btn-primary">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </button>
      </div>
    </div>
  );
}