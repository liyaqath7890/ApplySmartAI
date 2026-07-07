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
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaStep, setMfaStep] = useState<'disabled' | 'setup' | 'enabled'>('disabled');
  const [otpCode, setOtpCode] = useState('');

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

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length === 6) {
      setMfaStep('enabled');
      setMfaEnabled(true);
      toast.success('Multi-Factor Authentication enabled successfully!');
    } else {
      toast.error('Invalid verification code. Please enter 6 digits.');
    }
  };

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={`w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-primary-600' : 'bg-gray-300'}`}>
      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <div className="space-y-6 text-app-primary">
      <PageHeader title="Settings" subtitle="Manage your account and preferences" icon={Settings} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="glass-card p-4">
            <nav className="space-y-1">
              {SECTIONS.map((item) => {
                const Icon = item.icon;
                if (item.id === 'billing') {
                  return (
                    <Link key={item.id} to="/app/billing" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-app-secondary hover:bg-app-hover hover:text-app-primary transition-colors">
                      <Icon className="h-5 w-5" /><span>{item.title}</span>
                    </Link>
                  );
                }
                return (
                  <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeSection === item.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-app-secondary hover:bg-app-hover hover:text-app-primary'}`}>
                    <Icon className="h-5 w-5" /><span>{item.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {activeSection === 'account' && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-app-primary mb-4">Account Settings</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-app-secondary mb-1">First Name</label>
                    <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-app-primary focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-app-secondary mb-1">Last Name</label>
                    <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-app-primary focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-secondary mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-app-primary focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                </div>
              </div>
              <div className="mt-6"><Button onClick={handleSave}>Save Changes</Button></div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-app-primary mb-4">Notifications</h3>
              <div className="space-y-4">
                {[
                  { label: 'Email Notifications', desc: 'Receive updates via email', enabled: emailNotifications, toggle: () => setEmailNotifications(!emailNotifications) },
                  { label: 'Push Notifications', desc: 'Receive push notifications', enabled: pushNotifications, toggle: () => setPushNotifications(!pushNotifications) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div><div className="font-medium text-app-primary">{item.label}</div><div className="text-sm text-app-secondary">{item.desc}</div></div>
                    <Toggle enabled={item.enabled} onChange={item.toggle} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-app-primary mb-4">Appearance</h3>
              <div className="flex items-center justify-between">
                <div><div className="font-medium text-app-primary">Dark Mode</div><div className="text-sm text-app-secondary">Toggle dark theme</div></div>
                <Toggle enabled={darkMode} onChange={toggleDarkMode} />
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-6">
              {/* MFA Card */}
              <div className="glass-card p-6 bg-app-card border border-app-border rounded-xl">
                <h3 className="text-lg font-semibold text-slate-200 mb-2">Multi-Factor Authentication (MFA)</h3>
                <p className="text-xs text-app-secondary mb-4 leading-relaxed">
                  Add an extra layer of security to your account by configuring a 6-digit one-time password code from Google Authenticator.
                </p>

                {mfaStep === 'disabled' && (
                  <Button variant="primary" onClick={() => setMfaStep('setup')}>Configure Authenticator App</Button>
                )}

                {mfaStep === 'setup' && (
                  <div className="p-4 border border-app-border rounded-xl bg-slate-900/30 space-y-4 animate-slide-up">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <div className="w-32 h-32 bg-white p-2 rounded-lg flex items-center justify-center border border-gray-300">
                        <div className="w-28 h-28 bg-[repeating-conic-gradient(#000_0_25%,#fff_0_50%)] bg-[size:10px_10px]" title="Mock QR code authenticator setup" />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <h4 className="font-semibold text-xs text-slate-250 uppercase tracking-wider">Step 1: Scan QR Code</h4>
                        <p className="text-xs text-app-secondary">Scan this code using Google Authenticator or Authy, or enter key: <code className="text-blue-450 font-bold bg-slate-950 px-1 py-0.5 rounded text-[10px]">OSMFA SECURE KEY</code></p>
                      </div>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="border-t border-app-border pt-4 space-y-3">
                      <h4 className="font-semibold text-xs text-slate-200 uppercase tracking-wider">Step 2: Enter Verification Code</h4>
                      <div className="flex gap-2 max-w-xs">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="e.g. 123456"
                          value={otpCode}
                          onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-1.5 border border-app-border rounded-lg bg-app-bg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <Button size="sm" type="submit">Verify Code</Button>
                      </div>
                    </form>
                  </div>
                )}

                {mfaStep === 'enabled' && (
                  <div className="p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-xl text-xs text-slate-200 flex justify-between items-center animate-slide-up">
                    <div>
                      <p className="font-semibold text-emerald-450">✓ Google Authenticator MFA Active</p>
                      <p className="text-app-secondary mt-0.5">Secure logins enabled via 2FA verification.</p>
                    </div>
                    <Button variant="ghost" size="sm" className="hover:text-red-500" onClick={() => {
                      setMfaStep('disabled');
                      setMfaEnabled(false);
                      setOtpCode('');
                      toast.success('MFA disabled');
                    }}>Disable MFA</Button>
                  </div>
                )}
              </div>

              {/* Login Session History List */}
              <div className="glass-card p-6 bg-app-card border border-app-border rounded-xl">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">Device Login History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-app-border text-app-secondary font-semibold">
                        <th className="pb-3">Device / Browser</th>
                        <th className="pb-3">Location</th>
                        <th className="pb-3">Last Access</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-app-border text-slate-350">
                      <tr>
                        <td className="py-3 font-semibold text-slate-200">Chrome (Windows)</td>
                        <td className="py-3">California, USA</td>
                        <td className="py-3">Just now</td>
                        <td className="py-3 text-emerald-450 font-bold">Active</td>
                      </tr>
                      <tr>
                        <td className="py-3">Authy Client (Mobile)</td>
                        <td className="py-3">California, USA</td>
                        <td className="py-3">2 hours ago</td>
                        <td className="py-3 text-app-secondary">Logged Out</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {(activeSection === 'career' || activeSection === 'jobs') && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-app-primary mb-4 capitalize">{activeSection.replace('-', ' ')} Settings</h3>
              <p className="text-sm text-app-secondary mb-4">Configure your {activeSection} preferences below.</p>
              <Link to="/app/master-profile"><Button variant="outline">Edit Master Profile</Button></Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
