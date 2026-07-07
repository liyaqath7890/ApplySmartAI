import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Calendar as CalendarIcon, Download, ChevronLeft, ChevronRight, Plus, MapPin, Clock, Tag } from 'lucide-react';
import { PageHeader, Button, EmptyState, Skeleton } from '@/shared/components/ui';
import { useCalendarStore, CalendarEvent } from '@/store/calendarStore';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, addMonths, subMonths, isToday } from 'date-fns';

export default function CalendarPage() {
  const { events, isLoading, fetchEvents, filterType, setFilterType, exportIcs } = useCalendarStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const filteredEvents = React.useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter(e => e.type === filterType);
  }, [events, filterType]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleExport = async () => {
    try {
      await exportIcs();
      toast.success('iCalendar (.ics) downloaded successfully!');
    } catch (err) {
      toast.error('Download failed');
    }
  };

  const getEventBg = (type: string) => {
    switch (type) {
      case 'interview': return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
      case 'recruiter_follow_up': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'application_follow_up': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'networking_follow_up': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  const dayEvents = (day: Date) => {
    return filteredEvents.filter(event => isSameDay(new Date(event.start), day));
  };

  return (
    <div className="space-y-6 p-6 bg-app-bg text-app-primary min-h-screen">
      <PageHeader title="Smart Calendar" subtitle="Synchronize interviews, learning deadlines, and outreach schedules." icon={CalendarIcon}>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-app-border rounded-lg text-xs bg-app-card text-app-primary focus:outline-none"
          >
            <option value="all">All Events</option>
            <option value="interview">Interviews</option>
            <option value="recruiter_follow_up">Recruiter follow ups</option>
            <option value="application_follow_up">Application follow ups</option>
            <option value="networking_follow_up">Networking outreach</option>
          </select>
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-1.5"><Download className="h-4 w-4" />Google Calendar Export</Button>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[600px] rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Calendar View */}
          <div className="lg:col-span-3 glass-card p-6">
            {/* Header / Month selectors */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-200">{format(currentDate, 'MMMM yyyy')}</h3>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={handlePrevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setCurrentDate(new Date())}>Today</Button>
                <Button size="sm" variant="ghost" onClick={handleNextMonth}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-app-secondary uppercase tracking-wider">
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Pad previous month days */}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="h-28 rounded-lg bg-slate-900/10 border border-transparent" />
              ))}

              {/* Month days */}
              {days.map((day) => {
                const eventsOnDay = dayEvents(day);
                return (
                  <div
                    key={day.toString()}
                    className={`h-28 p-2 rounded-lg border flex flex-col justify-between transition-colors ${
                      isToday(day)
                        ? 'bg-blue-600/5 border-blue-500/50'
                        : 'bg-app-card border-app-border'
                    }`}
                  >
                    <span className={`text-xs font-bold ${isToday(day) ? 'text-blue-400' : 'text-slate-350'}`}>{format(day, 'd')}</span>
                    
                    <div className="flex-1 overflow-y-auto space-y-1 mt-1 scrollbar-none">
                      {eventsOnDay.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          title={event.title}
                          className={`text-[9px] px-1.5 py-0.5 rounded truncate font-medium ${getEventBg(event.type)}`}
                        >
                          {event.title.replace(/Interview: |Follow Up: /g, '')}
                        </div>
                      ))}
                      {eventsOnDay.length > 3 && (
                        <div className="text-[8px] text-app-secondary text-right font-medium">+{eventsOnDay.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* List of upcoming events */}
          <div className="glass-card p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">Upcoming Events</h3>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {filteredEvents.length === 0 ? (
                  <EmptyState title="No events" description="No scheduled actions found for this period." icon={CalendarIcon} />
                ) : (
                  filteredEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="p-3 border border-app-border rounded-xl bg-app-card space-y-2">
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${getEventBg(event.type)}`}>
                          {event.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="font-semibold text-xs text-slate-200">{event.title}</h4>
                      <p className="text-[10px] text-app-secondary leading-relaxed">{event.description}</p>
                      
                      <div className="flex items-center gap-1.5 text-[10px] text-app-secondary">
                        <Clock className="h-3.5 w-3.5 text-blue-400" />
                        <span>{new Date(event.start).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="border-t border-app-border pt-4 mt-6 text-center text-xs text-app-secondary">
              Calendar updates real time from recruiter CRM logs and scheduled interviews.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
