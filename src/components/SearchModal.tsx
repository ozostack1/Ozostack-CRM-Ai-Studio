import React, { useState } from 'react';
import { Search, X, Briefcase, Users, FileText, CheckSquare, ArrowRight, Mail, MessageSquare, ListTodo, StickyNote } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RECENT_DEALS, OVERDUE_TASKS, INVOICES, INITIAL_LEADS } from '../data/mockData';
import { loadTemplates } from '../data/templateData';
import { loadAllTodos, loadAllNotes } from '../data/personalNotesTodosData';
import { useSystemCurrency, formatMoney } from '../data/currencyService';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { theme, setActiveNav } = useTheme();
  const { currentUser } = useAuth();
  const { currency } = useSystemCurrency();
  const isLight = theme === 'white-sky';
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const myCleanName = (currentUser?.name || '')
    .replace(/\s*\([^)]*\)/g, '')
    .trim()
    .toLowerCase();

  const myTodos = query
    ? loadAllTodos()
        .filter(
          (t) =>
            (t.ownerName || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase() === myCleanName &&
            (t.title.toLowerCase().includes(query.toLowerCase()) ||
              (t.notes && t.notes.toLowerCase().includes(query.toLowerCase())) ||
              (t.category && t.category.toLowerCase().includes(query.toLowerCase())))
        )
        .slice(0, 5)
    : [];

  const myNotes = query
    ? loadAllNotes()
        .filter(
          (n) =>
            (n.ownerName || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase() === myCleanName &&
            (n.title.toLowerCase().includes(query.toLowerCase()) ||
              n.content.toLowerCase().includes(query.toLowerCase()) ||
              n.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())))
        )
        .slice(0, 5)
    : [];

  const storedLeads = (() => {
    try {
      const raw = localStorage.getItem('ozostack_leads_v2');
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_LEADS;
  })();

  const leads = storedLeads.filter(
    (l) =>
      l.name.toLowerCase().includes(query.toLowerCase()) ||
      l.company.toLowerCase().includes(query.toLowerCase()) ||
      l.email.toLowerCase().includes(query.toLowerCase())
  );

  const storedDeals = (() => {
    try {
      const raw = localStorage.getItem('ozostack_deals_v2');
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return null;
  })();

  const deals = (storedDeals || RECENT_DEALS).filter(
    (d: any) =>
      (d.dealName || d.project || '').toLowerCase().includes(query.toLowerCase()) ||
      (d.company || d.client || '').toLowerCase().includes(query.toLowerCase())
  );

  const storedTasks = (() => {
    try {
      const raw = localStorage.getItem('ozostack_tasks_v2');
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return null;
  })();

  const tasks = (storedTasks || OVERDUE_TASKS).filter(
    (t: any) =>
      (t.taskName || t.title || '').toLowerCase().includes(query.toLowerCase()) ||
      (t.project || '').toLowerCase().includes(query.toLowerCase())
  );

  const invoices = INVOICES.filter(
    (i) =>
      i.invoiceNumber.toLowerCase().includes(query.toLowerCase()) ||
      i.client.toLowerCase().includes(query.toLowerCase())
  );

  const templatesList = query
    ? loadTemplates().filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.category.toLowerCase().includes(query.toLowerCase()) ||
          (t.subject && t.subject.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isLight
            ? 'bg-white border-sky-100 text-slate-800'
            : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-sky-100/30 gap-3">
          <Search className="w-5 h-5 text-sky-500 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search deals, clients, tasks, or invoices..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="p-3 max-h-96 overflow-y-auto space-y-3">
          {/* Leads */}
          {leads.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                Leads ({leads.length})
              </div>
              <div className="space-y-1">
                {leads.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => {
                      setActiveNav('Leads');
                      onClose();
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-sky-500/10 transition-colors ${
                      isLight ? 'hover:bg-sky-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">{l.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {l.title} · {l.company}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xs tabular-nums text-emerald-500">
                        {currency.symbol}{l.value.toLocaleString()}
                      </div>
                      <span className="text-[9px] text-slate-400">{l.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deals */}
          {deals.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                Deals ({deals.length})
              </div>
              <div className="space-y-1">
                {deals.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => {
                      setActiveNav('Deals');
                      onClose();
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-sky-500/10 transition-colors ${
                      isLight ? 'hover:bg-sky-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">{d.dealName}</div>
                        <div className="text-[10px] text-slate-400">
                          {d.company} · {d.stage}
                        </div>
                      </div>
                    </div>
                    <span className="font-bold text-xs tabular-nums text-sky-500">
                      {formatMoney(d.value, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {tasks.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                Tasks ({tasks.length})
              </div>
              <div className="space-y-1">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setActiveNav('Tasks');
                      onClose();
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-sky-500/10 transition-colors ${
                      isLight ? 'hover:bg-sky-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                        <CheckSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">{t.taskName}</div>
                        <div className="text-[10px] text-slate-400">
                          {t.project} · {t.assignee}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-rose-500 font-semibold tabular-nums">
                      {t.dueDate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices */}
          {invoices.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                Invoices ({invoices.length})
              </div>
              <div className="space-y-1">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      setActiveNav('Invoices');
                      onClose();
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-sky-500/10 transition-colors ${
                      isLight ? 'hover:bg-sky-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">{inv.invoiceNumber}</div>
                        <div className="text-[10px] text-slate-400">{inv.client}</div>
                      </div>
                    </div>
                    <span className="font-bold text-xs tabular-nums text-emerald-500">
                      {formatMoney(inv.amount, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outreach Templates */}
          {templatesList.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                Outreach Templates ({templatesList.length})
              </div>
              <div className="space-y-1">
                {templatesList.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setActiveNav('Templates');
                      onClose();
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-sky-500/10 transition-colors ${
                      isLight ? 'hover:bg-sky-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-1.5 rounded-lg ${
                          t.channel === 'whatsapp'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-sky-500/10 text-sky-500'
                        }`}
                      >
                        {t.channel === 'whatsapp' ? (
                          <MessageSquare className="w-4 h-4" />
                        ) : (
                          <Mail className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold">{t.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {t.channel === 'whatsapp' ? 'WhatsApp' : 'Cold Email'} &bull; {t.category}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xs tabular-nums text-emerald-500">
                        {t.responseRatePct || 25}% reply
                      </span>
                      <div className="text-[9px] text-slate-400">{t.useCount} uses</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personal To-Dos */}
          {myTodos.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-sky-500 uppercase tracking-wider px-2 mb-1 flex items-center gap-1.5">
                <ListTodo className="w-3 h-3" />
                <span>My To-Dos ({myTodos.length})</span>
              </div>
              <div className="space-y-1">
                {myTodos.map((td) => (
                  <div
                    key={td.id}
                    onClick={() => {
                      setActiveNav('To Do & Notes');
                      onClose();
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-sky-500/10 transition-colors ${
                      isLight ? 'hover:bg-sky-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-1.5 rounded-lg ${
                          td.completed
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-sky-500/10 text-sky-500'
                        }`}
                      >
                        <ListTodo className="w-4 h-4" />
                      </div>
                      <div>
                        <div
                          className={`text-xs font-bold ${
                            td.completed ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {td.title}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {td.category || 'Work'} &bull; Due {td.dueDate || 'No date'}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        td.priority === 'High'
                          ? 'bg-rose-500/10 text-rose-500'
                          : td.priority === 'Medium'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-slate-500/10 text-slate-400'
                      }`}
                    >
                      {td.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personal Notes */}
          {myNotes.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider px-2 mb-1 flex items-center gap-1.5">
                <StickyNote className="w-3 h-3" />
                <span>My Notes ({myNotes.length})</span>
              </div>
              <div className="space-y-1">
                {myNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => {
                      setActiveNav('To Do & Notes');
                      onClose();
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-sky-500/10 transition-colors ${
                      isLight ? 'hover:bg-sky-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
                        <StickyNote className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">{note.title}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1 max-w-xs">
                          {note.content}
                        </div>
                      </div>
                    </div>
                    {note.pinned && (
                      <span className="text-[10px] font-semibold text-amber-500 px-1.5 py-0.5 rounded-md bg-amber-500/10">
                        Pinned
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {leads.length === 0 &&
            deals.length === 0 &&
            tasks.length === 0 &&
            invoices.length === 0 &&
            templatesList.length === 0 &&
            myTodos.length === 0 &&
            myNotes.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                No results found for "{query}"
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
