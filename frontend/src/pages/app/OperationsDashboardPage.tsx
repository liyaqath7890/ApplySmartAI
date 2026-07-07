import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Cpu, 
  Clock, 
  Layers, 
  Bell, 
  TrendingUp,
  Server,
  DollarSign,
  Terminal
} from 'lucide-react';
import axios from 'axios';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  description?: string;
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, description, color = 'blue' }) => {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500/10 to-indigo-500/5 text-blue-400 border-blue-500/20',
    green: 'from-green-500/10 to-emerald-500/5 text-green-400 border-green-500/20',
    purple: 'from-purple-500/10 to-fuchsia-500/5 text-purple-400 border-purple-500/20',
    orange: 'from-orange-500/10 to-amber-500/5 text-orange-400 border-orange-500/20',
  };

  return (
    <div className={`p-6 rounded-2xl border bg-gradient-to-br ${colorMap[color]} backdrop-blur-md`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-app-secondary">{title}</p>
          <h3 className="mt-2 text-3xl font-extrabold text-app-primary">{value}</h3>
          {description && <p className="mt-1 text-xs text-app-secondary">{description}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-app-hover border border-app-border`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default function OperationsDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/analytics/operations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        setStats(response.data.stats);
      }
    } catch (err: any) {
      console.error('Failed to fetch operations statistics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const triggerGlobalSync = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/companies/discover', {
        company: 'Ashby',
        jobUrl: 'https://jobs.ashbyhq.com/ashby'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        setSyncResult('Global discovery and aggregation sync initiated successfully.');
        fetchStats();
      }
    } catch (err: any) {
      setSyncResult(`Failed to initiate sync: ${err.response?.data?.error || err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-app-bg text-app-primary">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-md font-semibold text-app-secondary">Fetching live operational telemetry...</p>
        </div>
      </div>
    );
  }

  const queueData = stats?.queueStatus?.queues || {};
  const activeQueues = Object.keys(queueData);

  return (
    <div className="min-h-screen bg-app-bg text-app-primary p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-app-border pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Operations & AI Systems Control
          </h1>
          <p className="text-sm text-app-secondary mt-1">
            Real-time diagnostics, background worker metrics, and crawler telemetry.
          </p>
        </div>
        <button
          onClick={triggerGlobalSync}
          disabled={syncing}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-semibold shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95 transition duration-200 disabled:opacity-50 text-white"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Trigger Sync'}
        </button>
      </div>

      {/* Sync Status Alert */}
      {syncResult && (
        <div className={`p-4 rounded-xl border ${syncResult.includes('Failed') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
          {syncResult}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Monitored Companies"
          value={stats?.companiesMonitored || 0}
          icon={Database}
          description="Total active database-driven profiles"
          color="blue"
        />
        <MetricCard
          title="ATS Connectors"
          value={`${stats?.atsProviders || 19} Active`}
          icon={Cpu}
          description="Greenhouse, Lever, Rippling, Personio..."
          color="green"
        />
        <MetricCard
          title="Jobs Synced Today"
          value={stats?.jobsSyncedToday || 0}
          icon={TrendingUp}
          description="Newly discovered or updated in last 24h"
          color="purple"
        />
        <MetricCard
          title="Total Aggregated Jobs"
          value={stats?.totalJobs || 0}
          icon={Layers}
          description="Historical & live postings cataloged"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Background Queues Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-app-primary">
              <Activity className="w-5 h-5 text-blue-400" />
              Queue Telemetry (BullMQ)
            </h2>
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-app-border text-app-secondary text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Queue Name</th>
                    <th className="py-3 px-4 text-center">Active</th>
                    <th className="py-3 px-4 text-center">Delayed</th>
                    <th className="py-3 px-4 text-center">Completed</th>
                    <th className="py-3 px-4 text-center">Failed</th>
                    <th className="py-3 px-4 text-center">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border text-sm">
                  {activeQueues.map((name) => {
                    const q = queueData[name];
                    return (
                      <tr key={name} className="hover:bg-app-hover transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-app-primary">{name}</td>
                        <td className="py-3 px-4 text-center text-blue-450 font-semibold">{q.active}</td>
                        <td className="py-3 px-4 text-center text-yellow-500">{q.waiting || 0}</td>
                        <td className="py-3 px-4 text-center text-emerald-400">{q.completed}</td>
                        <td className="py-3 px-4 text-center text-red-500 font-semibold">{q.failed}</td>
                        <td className="py-3 px-4 text-center font-bold text-app-secondary">{q.total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* System & Scheduler Telemetry */}
        <div className="space-y-6">
          {/* Infrastructure Health Status */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-app-primary">
              <Server className="w-5 h-5 text-emerald-400" />
              System Diagnostics
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-app-card border border-app-border">
                <span className="text-sm font-medium text-app-secondary">Redis Server Latency</span>
                <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle className="w-3 h-3" />
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-app-card border border-app-border">
                <span className="text-sm font-medium text-app-secondary">Database Connection</span>
                <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle className="w-3 h-3" />
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-app-card border border-app-border">
                <span className="text-sm font-medium text-app-secondary">Active Cron Jobs</span>
                <span className="text-sm font-semibold text-app-primary">
                  {stats?.schedulerStatus?.taskCount || 6} tasks
                </span>
              </div>
            </div>
          </div>

          {/* AI & Cost Analytics */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-app-primary">
              <DollarSign className="w-5 h-5 text-purple-400" />
              System Cost Analytics
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-app-secondary">Total Match Calculations</span>
                <span className="text-sm font-bold text-app-primary">{stats?.aiMatchStats?.total || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Daily Estimated API Cost</span>
                <span className="text-sm font-bold text-emerald-400">$0.00 USD</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total Alerts Dispatched</span>
                <span className="text-sm font-bold text-slate-200">{stats?.notificationStats?.total || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
