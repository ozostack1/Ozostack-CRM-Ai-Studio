import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Plus,
  Search,
  Filter,
  Copy,
  Check,
  Edit2,
  Trash2,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  Zap,
} from 'lucide-react';
import {
  OutreachTemplate,
  TemplateChannel,
  TemplateCategory,
} from '../../types/template';
import { useOutreachTemplates, INITIAL_TEMPLATES } from '../../data/templateData';
import { useTheme } from '../../context/ThemeContext';
import { TemplateModal } from './TemplateModal';
import { TemplatePreviewModal } from './TemplatePreviewModal';

const CATEGORIES: TemplateCategory[] = [
  'Cold Outreach',
  'Follow-Up',
  'Meeting Booking',
  'Re-engagement',
  'Custom',
];

export const TemplatesView: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const isDark = theme === 'midnight';

  const {
    templates,
    saveTemplate,
    deleteTemplate,
    duplicateTemplate,
    incrementUseCount,
  } = useOutreachTemplates();

  // Active channel tab
  const [selectedChannel, setSelectedChannel] = useState<'all' | 'email' | 'whatsapp'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OutreachTemplate | null>(null);
  const [modalDefaultChannel, setModalDefaultChannel] = useState<TemplateChannel>('email');

  const [previewTemplate, setPreviewTemplate] = useState<OutreachTemplate | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const safeTemplates: OutreachTemplate[] = useMemo(() => {
    return Array.isArray(templates) && templates.length > 0 ? templates : INITIAL_TEMPLATES;
  }, [templates]);

  // Aggregate Stats
  const stats = useMemo(() => {
    let emailCount = 0;
    let whatsappCount = 0;
    let totalUses = 0;
    let totalResponseRate = 0;

    safeTemplates.forEach((t) => {
      if (t.channel === 'whatsapp') whatsappCount++;
      else emailCount++;

      totalUses += t.useCount || 0;
      totalResponseRate += t.responseRatePct || 25;
    });

    const avgResponse =
      safeTemplates.length > 0
        ? (totalResponseRate / safeTemplates.length).toFixed(1)
        : '0.0';

    return {
      total: safeTemplates.length,
      emailCount,
      whatsappCount,
      totalUses,
      avgResponse,
    };
  }, [safeTemplates]);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return safeTemplates.filter((t) => {
      // Channel filter
      if (selectedChannel !== 'all' && t.channel !== selectedChannel) return false;

      // Category filter
      if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (t.name || '').toLowerCase().includes(q);
        const matchSubject = (t.subject || '').toLowerCase().includes(q);
        const matchBody = (t.body || '').toLowerCase().includes(q);
        const matchTags = t.tags?.some((tag) => tag.toLowerCase().includes(q));
        if (!matchName && !matchSubject && !matchBody && !matchTags) return false;
      }

      return true;
    });
  }, [safeTemplates, selectedChannel, selectedCategory, searchQuery]);

  // Actions
  const handleCreateNew = (channel: TemplateChannel = 'email') => {
    setEditingTemplate(null);
    setModalDefaultChannel(channel);
    setIsModalOpen(true);
  };

  const handleEdit = (tpl: OutreachTemplate) => {
    setEditingTemplate(tpl);
    setModalDefaultChannel(tpl.channel);
    setIsModalOpen(true);
  };

  const handleSave = (tpl: OutreachTemplate) => {
    saveTemplate(tpl);
    showToast(`Template "${tpl.name}" saved.`);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete template "${name}"?`)) {
      deleteTemplate(id);
      showToast('Template deleted.');
    }
  };

  const handleDuplicate = (tpl: OutreachTemplate) => {
    const copy = duplicateTemplate(tpl);
    showToast(`Duplicated as "${copy.name}".`);
  };

  const handleQuickCopy = (tpl: OutreachTemplate) => {
    navigator.clipboard.writeText(tpl.body);
    incrementUseCount(tpl.id);
    showToast('Template body copied to clipboard.');
  };

  return (
    <div className="space-y-5">
      {/* Top Banner Navigation & Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border bg-gradient-to-r from-sky-500/10 via-emerald-500/5 to-transparent border-sky-200/60 dark:border-sky-500/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveNav('Dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 shadow-xs hover:bg-sky-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>CEO Command Center</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center gap-1 text-sky-500">
                  <Mail className="w-5 h-5" />
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                </span>
                Email & WhatsApp Outreach Templates
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                {stats.total} Templates Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cold email hooks, WhatsApp lead follow-ups, dynamic merge tags & 1-click personalized dispatch
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => handleCreateNew('whatsapp')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors shadow-2xs"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
            <span>+ WhatsApp Template</span>
          </button>
          <button
            onClick={() => handleCreateNew('email')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all hover:shadow"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>+ Email Template</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Cold Email Templates</span>
            <Mail className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {stats.emailCount}
            </span>
            <span className="text-xs text-slate-400">templates</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">Pain-point hooks & referrals</div>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">WhatsApp Lead Templates</span>
            <MessageSquare className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.whatsappCount}
            </span>
            <span className="text-xs text-slate-400">templates</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">Direct chat & meeting confirmation</div>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Outreach Messages Sent</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {stats.totalUses}
            </span>
            <span className="text-xs text-slate-400">dispatches</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">Across Email & WhatsApp Web</div>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Avg Lead Response Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.avgResponse}%
            </span>
            <span className="text-xs text-slate-400">positive replies</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">Optimized with personalized tags</div>
        </div>
      </div>

      {/* Main Filter Bar */}
      <div
        className={`p-4 rounded-2xl border space-y-3 transition-all ${
          isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Channel Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setSelectedChannel('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedChannel === 'all'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>All ({stats.total})</span>
            </button>
            <button
              onClick={() => setSelectedChannel('email')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedChannel === 'email'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email ({stats.emailCount})</span>
            </button>
            <button
              onClick={() => setSelectedChannel('whatsapp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedChannel === 'whatsapp'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp ({stats.whatsappCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by template name, subject, or keywords..."
              className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border outline-none font-medium transition-colors ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-sky-500 focus:bg-white'
              }`}
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-700/60">
          <span className="text-[11px] text-slate-400 font-medium mr-1">Intent Category:</span>
          {['All', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}

          {(selectedCategory !== 'All' || selectedChannel !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedChannel('all');
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="ml-auto text-[11px] font-medium text-rose-500 hover:text-rose-600 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.length === 0 ? (
          <div
            className={`col-span-full p-12 text-center rounded-2xl border ${
              isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <Mail className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No outreach templates found
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Try adjusting your category or search filters, or create a new template.
            </div>
          </div>
        ) : (
          filteredTemplates.map((tpl) => {
            const isWA = tpl.channel === 'whatsapp';

            return (
              <div
                key={tpl.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between hover:shadow-md ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                    : 'bg-white border-slate-200 hover:border-sky-300 shadow-xs'
                }`}
              >
                <div>
                  {/* Channel & Category Badges */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          isWA
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                        }`}
                      >
                        {isWA ? (
                          <MessageSquare className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Mail className="w-3 h-3 text-sky-500" />
                        )}
                        <span>{isWA ? 'WhatsApp' : 'Cold Email'}</span>
                      </span>

                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
                        {tpl.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400">
                      <button
                        onClick={() => handleEdit(tpl)}
                        title="Edit Template"
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors hover:text-slate-700 dark:hover:text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(tpl)}
                        title="Duplicate Template"
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors hover:text-slate-700 dark:hover:text-white"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tpl.id, tpl.name)}
                        title="Delete Template"
                        className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-rose-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Template Title */}
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 mb-1.5">
                    {tpl.name}
                  </h3>

                  {/* Email Subject if available */}
                  {tpl.subject && (
                    <div className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/30 px-2.5 py-1 rounded-lg border border-sky-100 dark:border-sky-900/40 truncate mb-2">
                      Subject: {tpl.subject}
                    </div>
                  )}

                  {/* Message Body Preview */}
                  <div className="text-xs text-slate-600 dark:text-slate-300 font-mono bg-slate-50/60 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 line-clamp-5 whitespace-pre-wrap leading-relaxed text-[11px]">
                    {tpl.body}
                  </div>

                  {/* Tags */}
                  {tpl.tags && tpl.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {tpl.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Bottom Actions & Stats */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                  <div className="text-slate-400 font-medium">
                    Used <strong className="text-slate-700 dark:text-slate-300">{tpl.useCount}x</strong> &bull;{' '}
                    <span className="text-emerald-600 font-semibold">{tpl.responseRatePct}% reply</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleQuickCopy(tpl)}
                      title="Quick Copy Body"
                      className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewTemplate(tpl)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold text-white shadow-2xs transition-all active:scale-95 ${
                        isWA
                          ? 'bg-emerald-600 hover:bg-emerald-500'
                          : 'bg-sky-500 hover:bg-sky-600'
                      }`}
                    >
                      <Send className="w-3 h-3" />
                      <span>Test & Send</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Template Modal */}
      <TemplateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTemplate(null);
        }}
        onSave={handleSave}
        templateToEdit={editingTemplate}
        defaultChannel={modalDefaultChannel}
      />

      {/* Personalized Tester & Send Modal */}
      <TemplatePreviewModal
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        template={previewTemplate}
        onUsed={(id) => incrementUseCount(id)}
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 font-medium text-xs shadow-xl animate-fade-in border border-slate-700 dark:border-sky-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

