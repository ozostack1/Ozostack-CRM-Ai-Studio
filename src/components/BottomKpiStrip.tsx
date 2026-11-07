import React from 'react';
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
      {BOTTOM_SUMMARY_KPIS.map((kpi, idx) => {
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
