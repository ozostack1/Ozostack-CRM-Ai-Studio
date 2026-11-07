import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  FolderKanban,
  UserCheck,
  Globe,
  Clock,
  Timer,
  Headphones,
  Repeat,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { BOTTOM_SUMMARY_KPIS } from '../data/mockData';

export const BottomKpiStrip: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const isLight = theme === 'white-sky';

  const readLive = () => {
    const parse = (key: string) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw !== null) {
          const p = JSON.parse(raw);
          if (Array.isArray(p)) return p;
        }
      } catch {}
      return null;
    };
    return {
      contacts: parse('ozostack_contacts_v1'),
      projects: parse('ozostack_projects'),
      team: parse('ozostack_team_members_v1'),
      timeEntries: parse('ozostack_time_entries_v1'),
    };
  };

  const [live, setLive] = useState(readLive);

  useEffect(() => {
    const sync = () => setLive(readLive());
    window.addEventListener('storage', sync);
    window.addEventListener('ozostack-crm-config-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('ozostack-crm-config-changed', sync);
    };
  }, []);

  const dynamicSummaryKpis = useMemo(() => {
    return BOTTOM_SUMMARY_KPIS.map((kpi) => {
      if (kpi.id === 'b1' && live.contacts !== null) {
        return { ...kpi, value: String(live.contacts.length), change: `${live.contacts.length} clients` };
      }
      if (kpi.id === 'b2' && live.projects !== null) {
        return { ...kpi, value: String(live.projects.length), change: `${live.projects.length} projects` };
      }
      if (kpi.id === 'b3' && live.team !== null) {
        return { ...kpi, value: String(live.team.length), change: `${live.team.length} members` };
      }
      if (kpi.id === 'b5' && live.timeEntries !== null) {
        const totalHrs = live.timeEntries.reduce((sum: number, entry: any) => sum + (Number(entry.hours) || 0), 0);
        return { ...kpi, value: totalHrs.toLocaleString(), change: `${live.timeEntries.length} logged shifts` };
      }
      if (kpi.id === 'b8' && live.contacts !== null) {
        const recurringCount = Math.round(live.contacts.length * 0.65);
        return { ...kpi, value: String(recurringCount), change: `${live.contacts.length > 0 ? '65%' : '0%'} recurring` };
      }
      return kpi;
    });
  }, [live]);

  const cardBg = isLight
    ? 'bg-white border-sky-100/80 shadow-xs'
    : 'bg-[#0f172a]/90 border-slate-800/80';

  const handleKpiClick = (id: string) => {
    switch (id) {
      case 'b1':
      case 'b8':
        setActiveNav('Clients');
        break;
      case 'b2':
        setActiveNav('Projects');
        break;
      case 'b3':
        setActiveNav('Team & HR');
        break;
      case 'b5':
        setActiveNav('Time Tracking');
        break;
      case 'b6':
      case 'b7':
        setActiveNav('Tasks');
        break;
      default:
        setActiveNav('Dashboard');
        break;
    }
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'Users':
        return Users;
      case 'FolderKanban':
        return FolderKanban;
      case 'UserGroup':
        return UserCheck;
      case 'Globe':
        return Globe;
      case 'Clock':
        return Clock;
      case 'Timer':
        return Timer;
      case 'Headphones':
        return Headphones;
      case 'Repeat':
        return Repeat;
      default:
        return Users;
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2.5 pt-1">
      {dynamicSummaryKpis.map((kpi, idx) => {
        const Icon = getIcon(kpi.icon);
        const iconBg = [
          'bg-sky-500/15 text-sky-500',
          'bg-blue-500/15 text-blue-500',
          'bg-emerald-500/15 text-emerald-500',
          'bg-indigo-500/15 text-indigo-500',
          'bg-amber-500/15 text-amber-500',
          'bg-purple-500/15 text-purple-500',
          'bg-rose-500/15 text-rose-500',
          'bg-teal-500/15 text-teal-500',
        ][idx % 8];

        return (
          <div
            key={kpi.id}
            onClick={() => handleKpiClick(kpi.id)}
            className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer hover:border-sky-400 hover:scale-[1.02] ${cardBg}`}
            title={`Inspect ${kpi.label}`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${iconBg}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={`text-[8px] font-bold tracking-wider uppercase truncate ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {kpi.label}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-extrabold text-sm tabular-nums tracking-tight">
                  {kpi.value}
                </span>
              </div>
              <div className="text-[9px] text-emerald-500 font-semibold truncate tabular-nums">
                {kpi.change}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
