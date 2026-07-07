import React, { useState, useEffect } from 'react';
import { PageHeader, Button, StatsCard } from '@/shared/components/ui';
import { Activity, ShieldAlert, Cpu, Database, DatabaseZap, Terminal, Sparkles, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const TOOLTIP_STYLE = { backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.8rem', color: '#f1f5f9' };

export default function AdminMonitoringPage() {
  const [latencyData, setLatencyData] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Generate mock real-time latency points
  useEffect(() => {
    const data = [];
    const baseTime = new Date();
    for (let i = 24; i >= 0; i--) {
      const time = new Date(baseTime.getTime() - i * 30 * 60 * 1000);
      data.push({
        time: time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
        latency: Math.floor(45 + Math.random() * 60),
        database: Math.floor(12 + Math.random() * 25),
        redis: Math.floor(2 + Math.random() * 5),
      });
    }
    setLatencyData(data);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Shift and add new point
      setLatencyData((prev) => {
        const next = [...prev.slice(1)];
        const time = new Date();
        next.push({
          time: time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
          latency: Math.floor(45 + Math.random() * 60),
          database: Math.floor(12 + Math.random() * 25),
          redis: Math.floor(2 + Math.random() * 5),
        });
        return next;
      });
      setIsRefreshing(false);
    }, 800);
  };

  const queueStats = [
    { name: 'Job Scraper Worker', status: 'Active', active: 0, completed: 184, failed: 2 },
    { name: 'ATS Evaluator Queue', status: 'Active', active: 0, completed: 96, failed: 0 },
    { name: 'Email Digest Cron', status: 'Idle', active: 0, completed: 24, failed: 1 },
    { name: 'Outreach Copilot Queue', status: 'Active', active: 0, completed: 42, failed: 0 },
  ];

  return (
    <div className="space-y-6 p-6 bg-app-bg text-app-primary min-h-screen animate-fade-in">
      <PageHeader
        title="Infrastructure Monitor"
        subtitle="Real-time operations log showing queue statuses, database response times, and LLM token consumptions."
        icon={Activity}
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Stats
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="API Gateway Latency" value={`${latencyData[latencyData.length - 1]?.latency || 55} ms`} icon={Cpu} description="Average" />
        <StatsCard title="Postgres DB Connection" value="Healthy" icon={Database} description="12ms query response" />
        <StatsCard title="BullMQ Redis Queue" value="4 workers active" icon={DatabaseZap} description="Redis host:6379" />
        <StatsCard title="Total Error Count" value="3 alerts" icon={ShieldAlert} description="Last 24 hours" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latency Area Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-1.5">
            <Activity className="h-5 w-5 text-blue-400" /> Server Gateway Response Curves
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} unit="ms" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="latency" name="Overall Gateway" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                <Area type="monotone" dataKey="database" name="PostgreSQL query" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.05} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI tokens logs */}
        <div className="lg:col-span-1 glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-amber-400" /> AI LLM Token Consumption
            </h3>
            <div className="space-y-4 text-xs text-slate-350">
              <div className="p-3 bg-app-bg border border-app-border rounded-xl">
                <div className="flex justify-between">
                  <span>Prompt input tokens</span>
                  <span className="font-semibold text-slate-200">142.4k tokens</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '70%' }} />
                </div>
              </div>
              <div className="p-3 bg-app-bg border border-app-border rounded-xl">
                <div className="flex justify-between">
                  <span>Completion output tokens</span>
                  <span className="font-semibold text-slate-200">38.9k tokens</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '40%' }} />
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-app-border pt-4 mt-6 text-xs text-app-secondary">
            <span className="font-semibold text-slate-300">Estimated cost today:</span>
            <span className="text-slate-200 font-bold ml-2">$0.28 USD</span>
          </div>
        </div>
      </div>

      {/* Queue Workers Table */}
      <div className="glass-card p-6 overflow-x-auto">
        <h3 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-1.5">
          <Terminal className="h-5 w-5 text-indigo-400" /> Background Sync Queues (BullMQ)
        </h3>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-app-border text-app-secondary font-semibold">
              <th className="pb-3">Queue Name</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-center">Active Jobs</th>
              <th className="pb-3 text-center">Completed</th>
              <th className="pb-3 text-center">Failed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border text-slate-300">
            {queueStats.map((q, idx) => (
              <tr key={idx} className="hover:bg-slate-900/10">
                <td className="py-3.5 font-medium text-slate-200">{q.name}</td>
                <td className="py-3.5">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    q.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/15 text-slate-400'
                  }`}>
                    {q.status}
                  </span>
                </td>
                <td className="py-3.5 text-center">{q.active}</td>
                <td className="py-3.5 text-center text-emerald-450 font-bold">{q.completed}</td>
                <td className="py-3.5 text-center text-rose-455 font-bold">{q.failed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
