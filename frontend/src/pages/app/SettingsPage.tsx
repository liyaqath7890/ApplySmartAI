import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, User, Bell, Lock, Palette, Briefcase, MapPin, CreditCard } from 'lucide-react';
import { PageHeader, Button } from '@/shared/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import toast from 'react-hot-toast';

const SECTIONS = [
  { id: 'account', title: 'Account', icon: User },
  { id: 'notifications', title: 'Notifications', icon: Bell },
  { id: 'career', title: 'Career Preferences', icon: Briefcase },
  { id: 'jobs', title: 'Job Preferences', icon: MapPin },
  { id: 'appearance', title: 'Appearance', icon: Palette },
  { id: 'security', title: 'Security', icon: Lock },
  { id: 'billing', title: 'Billing', icon: CreditCard },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { darkMode, toggleDarkMode } = useUIStore();
  const [activeSection, setActiveSection] = useState('account');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
  });

  const handleSave = () => {
    updateUser({ firstName: form.firstName, lastName: form.lastName, email: form.email });
    toast.success('Settings saved successfully!');
  };

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={`w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-primary-600' : 'bg-gray-300'}`}>
      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your account and preferences" icon={Settings} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <nav className="space-y-1">
              {SECTIONS.map((item) => {
                const Icon = item.icon;
                if (item.id === 'billing') {
                  return (
                    <Link key={item.id} to="/app/billing" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                      <Icon className="h-5 w-5" /><span>{item.title}</span>
                    </Link>
                  );
                }
                return (
                  <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeSection === item.id ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                    <Icon className="h-5 w-5" /><span>{item.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {activeSection === 'account' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div className="mt-6"><Button onClick={handleSave}>Save Changes</Button></div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
              <div className="space-y-4">
                {[
                  { label: 'Email Notifications', desc: 'Receive updates via email', enabled: emailNotifications, toggle: () => setEmailNotifications(!emailNotifications) },
                  { label: 'Push Notifications', desc: 'Receive push notifications', enabled: pushNotifications, toggle: () => setPushNotifications(!pushNotifications) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div><div className="font-medium text-gray-900">{item.label}</div><div className="text-sm text-gray-600">{item.desc}</div></div>
                    <Toggle enabled={item.enabled} onChange={item.toggle} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h3>
              <div className="flex items-center justify-between">
                <div><div className="font-medium text-gray-900">Dark Mode</div><div className="text-sm text-gray-600">Toggle dark theme</div></div>
                <Toggle enabled={darkMode} onChange={toggleDarkMode} />
              </div>
            </div>
          )}

          {(activeSection === 'career' || activeSection === 'jobs' || activeSection === 'security') && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">{activeSection.replace('-', ' ')} Settings</h3>
              <p className="text-sm text-gray-600 mb-4">Configure your {activeSection} preferences below.</p>
              <Link to="/app/master-profile"><Button variant="outline">Edit Master Profile</Button></Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
