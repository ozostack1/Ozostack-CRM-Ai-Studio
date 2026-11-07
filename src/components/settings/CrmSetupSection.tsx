import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Layers,
  Tag,
  Sliders,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import {
  useCrmConfig,
  DEFAULT_CRM_CONFIG,
  LeadSourceConfig,
  LeadStageConfig,
  PipelineStageConfig,
  CustomFieldConfig,
  CustomFieldEntity,
  CustomFieldType,
  migrateStoredLeads,
  migrateStoredDeals,
} from '../../data/crmConfig';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface CrmSetupSectionProps {
  onNotify: (msg: string) => void;
  onOpenFormBuilder?: () => void;
}

export const CrmSetupSection: React.FC<CrmSetupSectionProps> = ({ onNotify, onOpenFormBuilder }) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';
  const { logAudit } = useAuth();
  const { config, updateConfig } = useCrmConfig();

  // --- 1. Lead Source State ---
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceColor, setNewSourceColor] = useState('#0ea5e9');
  const [editingSource, setEditingSource] = useState<LeadSourceConfig | null>(null);

  // --- 2. Lead Stage State ---
  const [newLeadStageName, setNewLeadStageName] = useState('');
  const [newLeadStageColor, setNewLeadStageColor] = useState('#38bdf8');
  const [editingLeadStage, setEditingLeadStage] = useState<LeadStageConfig | null>(null);

  // --- 3. Pipeline Stage State ---
  const [newPipeName, setNewPipeName] = useState('');
  const [newPipeLabel, setNewPipeLabel] = useState('');
  const [newPipeProb, setNewPipeProb] = useState(40);
  const [newPipeColor, setNewPipeColor] = useState('#0ea5e9');
  const [newPipeDays, setNewPipeDays] = useState(7);
  const [editingPipeStage, setEditingPipeStage] = useState<PipelineStageConfig | null>(null);

  // --- 4. Custom Field Modal / Form State ---
  const [editingField, setEditingField] = useState<CustomFieldConfig | null>(null);
  const [cfLabel, setCfLabel] = useState('');
  const [cfEntity, setCfEntity] = useState<CustomFieldEntity>('Both');
  const [cfType, setCfType] = useState<CustomFieldType>('text');
  const [cfOptionsStr, setCfOptionsStr] = useState('');
  const [cfPlaceholder, setCfPlaceholder] = useState('');
  const [cfRequired, setCfRequired] = useState(false);

  const cardCls = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/95 border-slate-800';
  const inputCls = `w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none ${
    isLight
      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500'
      : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
  }`;

  // =========================================================================
  // 1. LEAD SOURCES HANDLERS
  // =========================================================================
  const handleAddLeadSource = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSourceName.trim();
    if (!name) return onNotify('Please enter a Lead Source name.');
    if (config.leadSources.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      return onNotify(`Lead Source "${name}" already exists.`);
    }
    const created: LeadSourceConfig = {
      id: `src-${Date.now()}`,
      name,
      color: newSourceColor,
    };
    updateConfig((prev) => ({
      ...prev,
      leadSources: [...prev.leadSources, created],
    }));
    setNewSourceName('');
    logAudit('Workspace', 'Added lead source', name);
    onNotify(`Added lead source "${name}".`);
  };

  const handleSaveEditSource = () => {
    if (!editingSource || !editingSource.name.trim()) return;
    const nextName = editingSource.name.trim();
    const oldItem = config.leadSources.find((s) => s.id === editingSource.id);
    if (oldItem && oldItem.name !== nextName) {
      migrateStoredLeads('source', oldItem.name, nextName);
    }
    updateConfig((prev) => ({
      ...prev,
      leadSources: prev.leadSources.map((s) =>
        s.id === editingSource.id ? { ...editingSource, name: nextName } : s
      ),
    }));
    logAudit('Workspace', 'Updated lead source', nextName);
    onNotify(`Updated lead source "${nextName}".`);
    setEditingSource(null);
  };

  const handleDeleteLeadSource = (item: LeadSourceConfig) => {
    if (config.leadSources.length <= 1) {
      return onNotify('At least one Lead Source must remain active.');
    }
    updateConfig((prev) => ({
      ...prev,
      leadSources: prev.leadSources.filter((s) => s.id !== item.id),
    }));
    logAudit('Workspace', 'Deleted lead source', item.name);
    onNotify(`Deleted lead source "${item.name}".`);
  };

  // =========================================================================
  // 2. LEAD STAGES HANDLERS
  // =========================================================================
  const handleAddLeadStage = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newLeadStageName.trim();
    if (!name) return onNotify('Please enter a Lead Stage name.');
    if (config.leadStages.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      return onNotify(`Lead Stage "${name}" already exists.`);
    }
    const created: LeadStageConfig = {
      id: `lst-${Date.now()}`,
      name,
      color: newLeadStageColor,
    };
    updateConfig((prev) => ({
      ...prev,
      leadStages: [...prev.leadStages, created],
    }));
    setNewLeadStageName('');
    logAudit('Workspace', 'Added lead stage', name);
    onNotify(`Added lead stage "${name}".`);
  };

  const handleSaveEditLeadStage = () => {
    if (!editingLeadStage || !editingLeadStage.name.trim()) return;
    const nextName = editingLeadStage.name.trim();
    const oldItem = config.leadStages.find((s) => s.id === editingLeadStage.id);
    if (oldItem && oldItem.name !== nextName) {
      migrateStoredLeads('status', oldItem.name, nextName);
    }
    updateConfig((prev) => ({
      ...prev,
      leadStages: prev.leadStages.map((s) =>
        s.id === editingLeadStage.id ? { ...editingLeadStage, name: nextName } : s
      ),
    }));
    logAudit('Workspace', 'Updated lead stage', nextName);
    onNotify(`Updated lead stage "${nextName}".`);
    setEditingLeadStage(null);
  };

  const handleMoveLeadStage = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= config.leadStages.length) return;
    updateConfig((prev) => {
      const next = [...prev.leadStages];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return { ...prev, leadStages: next };
    });
  };

  const handleDeleteLeadStage = (item: LeadStageConfig) => {
    if (config.leadStages.length <= 2) {
      return onNotify('Keep at least 2 lead stages in the funnel.');
    }
    updateConfig((prev) => ({
      ...prev,
      leadStages: prev.leadStages.filter((s) => s.id !== item.id),
    }));
    logAudit('Workspace', 'Deleted lead stage', item.name);
    onNotify(`Removed lead stage "${item.name}".`);
  };

  // =========================================================================
  // 3. PIPELINE STAGES HANDLERS
  // =========================================================================
  const handleAddPipelineStage = (e: React.FormEvent) => {
    e.preventDefault();
    const stageName = newPipeName.trim();
    if (!stageName) return onNotify('Please enter a Pipeline Stage name.');
    if (config.pipelineStages.some((p) => p.stage.toLowerCase() === stageName.toLowerCase())) {
      return onNotify(`Pipeline Stage "${stageName}" already exists.`);
    }
    const created: PipelineStageConfig = {
      id: `pst-${Date.now()}`,
      name: stageName,
      stage: stageName,
      label: newPipeLabel.trim() || stageName,
      prob: Math.max(0, Math.min(100, Number(newPipeProb) || 0)),
      color: newPipeColor,
      avgDays: Math.max(0, Number(newPipeDays) || 5),
    };
    updateConfig((prev) => ({
      ...prev,
      pipelineStages: [...prev.pipelineStages, created],
    }));
    setNewPipeName('');
    setNewPipeLabel('');
    setNewPipeProb(50);
    logAudit('Workspace', 'Added pipeline stage', `${created.label} (${created.prob}%)`);
    onNotify(`Added pipeline stage "${created.label}" (${created.prob}% probability).`);
  };

  const handleSaveEditPipelineStage = () => {
    if (!editingPipeStage || !editingPipeStage.stage.trim()) return;
    const nextStage = editingPipeStage.stage.trim();
    const nextLabel = editingPipeStage.label.trim() || nextStage;
    const oldItem = config.pipelineStages.find((p) => p.id === editingPipeStage.id);
    if (oldItem && oldItem.stage !== nextStage) {
      migrateStoredDeals(oldItem.stage, nextStage);
    }
    updateConfig((prev) => ({
      ...prev,
      pipelineStages: prev.pipelineStages.map((p) =>
        p.id === editingPipeStage.id
          ? {
              ...editingPipeStage,
              stage: nextStage,
              label: nextLabel,
              prob: Math.max(0, Math.min(100, Number(editingPipeStage.prob) || 0)),
            }
          : p
      ),
    }));
    logAudit('Workspace', 'Updated pipeline stage', `${nextLabel} (${editingPipeStage.prob}%)`);
    onNotify(`Updated pipeline stage "${nextLabel}".`);
    setEditingPipeStage(null);
  };

  const handleMovePipelineStage = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= config.pipelineStages.length) return;
    updateConfig((prev) => {
      const next = [...prev.pipelineStages];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return { ...prev, pipelineStages: next };
    });
  };

  const handleDeletePipelineStage = (item: PipelineStageConfig) => {
    if (config.pipelineStages.length <= 2) {
      return onNotify('Keep at least 2 stages in the Deal Pipeline.');
    }
    updateConfig((prev) => ({
      ...prev,
      pipelineStages: prev.pipelineStages.filter((p) => p.id !== item.id),
    }));
    logAudit('Workspace', 'Deleted pipeline stage', item.label);
    onNotify(`Deleted pipeline stage "${item.label}".`);
  };

  // =========================================================================
  // 4. CUSTOM FIELDS HANDLERS
  // =========================================================================
  const handleSaveCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    const label = cfLabel.trim();
    if (!label) return onNotify('Please enter a Custom Field label.');
    const key = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    const options =
      cfType === 'select'
        ? cfOptionsStr
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean)
        : [];

    if (cfType === 'select' && options.length === 0) {
      return onNotify('Please provide comma-separated dropdown options for a Select field.');
    }

    if (editingField) {
      const updated: CustomFieldConfig = {
        ...editingField,
        label,
        entity: cfEntity,
        type: cfType,
        options,
        placeholder: cfPlaceholder.trim() || `Enter ${label}`,
        required: cfRequired,
      };
      updateConfig((prev) => ({
        ...prev,
        customFields: prev.customFields.map((f) => (f.id === editingField.id ? updated : f)),
      }));
      logAudit('Workspace', 'Updated custom field', `${label} (${cfEntity})`);
      onNotify(`Updated custom field "${label}".`);
      setEditingField(null);
    } else {
      const created: CustomFieldConfig = {
        id: `cf-${Date.now()}`,
        key: `${key}_${Date.now().toString().slice(-3)}`,
        label,
        entity: cfEntity,
        type: cfType,
        options,
        placeholder: cfPlaceholder.trim() || `Enter ${label}`,
        required: cfRequired,
      };
      updateConfig((prev) => ({
        ...prev,
        customFields: [...prev.customFields, created],
      }));
      logAudit('Workspace', 'Created custom field', `${label} (${cfEntity})`);
      onNotify(`Added custom field "${label}" to ${cfEntity}.`);
    }

    setCfLabel('');
    setCfOptionsStr('');
    setCfPlaceholder('');
    setCfRequired(false);
  };

  const startEditCustomField = (field: CustomFieldConfig) => {
    setEditingField(field);
    setCfLabel(field.label);
    setCfEntity(field.entity);
    setCfType(field.type);
    setCfOptionsStr(field.options.join(', '));
    setCfPlaceholder(field.placeholder);
    setCfRequired(field.required);
  };

  const handleDeleteCustomField = (field: CustomFieldConfig) => {
    updateConfig((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((f) => f.id !== field.id),
    }));
    if (editingField?.id === field.id) setEditingField(null);
    logAudit('Workspace', 'Deleted custom field', field.label);
    onNotify(`Deleted custom field "${field.label}".`);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${cardCls}`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              CRM, Lead Sources, Funnel Stages &amp; Custom Fields Configuration
            </h3>
            <p className="text-xs text-slate-400">
              Changes made here immediately update Lead capture forms, Kanban boards, Deal modals, and Pipeline stages across the workspace.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenFormBuilder && (
            <button
              type="button"
              onClick={onOpenFormBuilder}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-xs transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Design Web-to-Lead Form &amp; Copy Link</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              updateConfig(DEFAULT_CRM_CONFIG);
              onNotify('Reset Lead Sources, Stages, Pipeline Stages, and Custom Fields to defaults.');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 hover:text-sky-500 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Grid Row 1: Lead Sources & Lead Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. LEAD SOURCES MANAGER */}
        <div className={`p-5 rounded-2xl border space-y-4 ${cardCls}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-sky-500" />
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Lead Sources ({config.leadSources.length})
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">Used in Leads &amp; Attribution</span>
          </div>

          {/* Add Lead Source Form */}
          <form onSubmit={handleAddLeadSource} className="flex items-center gap-2">
            <input
              type="color"
              value={newSourceColor}
              onChange={(e) => setNewSourceColor(e.target.value)}
              className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer shrink-0 bg-transparent p-0.5"
              title="Pick badge color"
            />
            <input
              type="text"
              value={newSourceName}
              onChange={(e) => setNewSourceName(e.target.value)}
              placeholder="New source name (e.g. Google Ads, Webinar, Partner)..."
              className={inputCls}
            />
            <button
              type="submit"
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </form>

          {/* Lead Sources List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {config.leadSources.map((src) => {
              const isEditing = editingSource?.id === src.id;
              return (
                <div
                  key={src.id}
                  className="p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="color"
                        value={editingSource.color}
                        onChange={(e) =>
                          setEditingSource({ ...editingSource, color: e.target.value })
                        }
                        className="w-7 h-7 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={editingSource.name}
                        onChange={(e) =>
                          setEditingSource({ ...editingSource, name: e.target.value })
                        }
                        className={`${inputCls} py-1`}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveEditSource}
                        className="p-1.5 rounded-lg bg-emerald-500 text-white"
                        title="Save"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSource(null)}
                        className="p-1.5 rounded-lg border text-slate-400"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: src.color }}
                        />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {src.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingSource(src)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit Lead Source"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLeadSource(src)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Delete Lead Source"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. LEAD STAGES MANAGER */}
        <div className={`p-5 rounded-2xl border space-y-4 ${cardCls}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Lead Stages ({config.leadStages.length})
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">Used in Leads List &amp; Kanban</span>
          </div>

          {/* Add Lead Stage Form */}
          <form onSubmit={handleAddLeadStage} className="flex items-center gap-2">
            <input
              type="color"
              value={newLeadStageColor}
              onChange={(e) => setNewLeadStageColor(e.target.value)}
              className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer shrink-0 bg-transparent p-0.5"
              title="Pick stage color"
            />
            <input
              type="text"
              value={newLeadStageName}
              onChange={(e) => setNewLeadStageName(e.target.value)}
              placeholder="New lead stage (e.g. Demo Scheduled, Technical Review)..."
              className={inputCls}
            />
            <button
              type="submit"
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </form>

          {/* Lead Stages List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {config.leadStages.map((stg, idx) => {
              const isEditing = editingLeadStage?.id === stg.id;
              return (
                <div
                  key={stg.id}
                  className="p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="color"
                        value={editingLeadStage.color}
                        onChange={(e) =>
                          setEditingLeadStage({ ...editingLeadStage, color: e.target.value })
                        }
                        className="w-7 h-7 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={editingLeadStage.name}
                        onChange={(e) =>
                          setEditingLeadStage({ ...editingLeadStage, name: e.target.value })
                        }
                        className={`${inputCls} py-1`}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveEditLeadStage}
                        className="p-1.5 rounded-lg bg-emerald-500 text-white"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingLeadStage(null)}
                        className="p-1.5 rounded-lg border text-slate-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-mono text-slate-400 w-4">
                          {idx + 1}.
                        </span>
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: stg.color }}
                        />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {stg.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveLeadStage(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 rounded text-slate-400 hover:text-sky-500 disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveLeadStage(idx, 1)}
                          disabled={idx === config.leadStages.length - 1}
                          className="p-1 rounded text-slate-400 hover:text-sky-500 disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingLeadStage(stg)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit Lead Stage"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLeadStage(stg)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Delete Lead Stage"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid Row 2: Pipeline Stages & Custom Fields Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* 3. DEAL PIPELINE STAGES MANAGER */}
        <div className={`lg:col-span-6 p-5 rounded-2xl border space-y-4 ${cardCls}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Deal &amp; Pipeline Stages ({config.pipelineStages.length})
                </h4>
                <p className="text-[11px] text-slate-400">
                  Syncs with Pipeline Kanban, Deals Board, Forecasting &amp; Win Probability
                </p>
              </div>
            </div>
          </div>

          {/* Add Pipeline Stage Form */}
          <form onSubmit={handleAddPipelineStage} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-4">
              <input
                type="text"
                value={newPipeName}
                onChange={(e) => {
                  setNewPipeName(e.target.value);
                  if (!newPipeLabel) setNewPipeLabel(e.target.value);
                }}
                placeholder="Stage Name (e.g. Legal Review)"
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-3">
              <input
                type="text"
                value={newPipeLabel}
                onChange={(e) => setNewPipeLabel(e.target.value)}
                placeholder="Display Label"
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <input
                type="number"
                min={0}
                max={100}
                value={newPipeProb}
                onChange={(e) => setNewPipeProb(Number(e.target.value))}
                placeholder="Prob %"
                title="Default Win Probability (%)"
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-1 flex items-center justify-center">
              <input
                type="color"
                value={newPipeColor}
                onChange={(e) => setNewPipeColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent"
                title="Stage Color"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full h-full flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </form>

          {/* Pipeline Stages List */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {config.pipelineStages.map((ps, idx) => {
              const isEditing = editingPipeStage?.id === ps.id;
              return (
                <div
                  key={ps.id}
                  className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 flex-1 items-center">
                      <input
                        type="text"
                        value={editingPipeStage.stage}
                        onChange={(e) =>
                          setEditingPipeStage({
                            ...editingPipeStage,
                            stage: e.target.value,
                            label: e.target.value,
                          })
                        }
                        className={`${inputCls} sm:col-span-5 py-1`}
                        placeholder="Stage Name"
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={editingPipeStage.prob}
                        onChange={(e) =>
                          setEditingPipeStage({
                            ...editingPipeStage,
                            prob: Number(e.target.value),
                          })
                        }
                        className={`${inputCls} sm:col-span-3 py-1`}
                        placeholder="Prob %"
                      />
                      <input
                        type="color"
                        value={editingPipeStage.color}
                        onChange={(e) =>
                          setEditingPipeStage({ ...editingPipeStage, color: e.target.value })
                        }
                        className="w-7 h-7 rounded cursor-pointer sm:col-span-1"
                      />
                      <div className="sm:col-span-3 flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          onClick={handleSaveEditPipelineStage}
                          className="p-1.5 rounded-lg bg-emerald-500 text-white"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPipeStage(null)}
                          className="p-1.5 rounded-lg border text-slate-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] font-mono text-slate-400 w-4">
                          {idx + 1}.
                        </span>
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: ps.color }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                              {ps.label}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400">
                              {ps.prob}% Win Prob
                            </span>
                          </div>
                          {ps.label !== ps.stage && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Key: {ps.stage}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMovePipelineStage(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 rounded text-slate-400 hover:text-sky-500 disabled:opacity-30"
                          title="Move Stage Left/Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMovePipelineStage(idx, 1)}
                          disabled={idx === config.pipelineStages.length - 1}
                          className="p-1 rounded text-slate-400 hover:text-sky-500 disabled:opacity-30"
                          title="Move Stage Right/Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPipeStage(ps)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit Pipeline Stage"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePipelineStage(ps)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Delete Pipeline Stage"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. CUSTOM FIELDS BUILDER (LEADS & DEALS) */}
        <div className={`lg:col-span-6 p-5 rounded-2xl border space-y-4 ${cardCls}`}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Custom Fields Builder ({config.customFields.length})
              </h4>
              <p className="text-[11px] text-slate-400">
                Add custom data fields to Lead and Deal creation/editing forms
              </p>
            </div>
            {editingField && (
              <button
                type="button"
                onClick={() => {
                  setEditingField(null);
                  setCfLabel('');
                  setCfOptionsStr('');
                  setCfPlaceholder('');
                  setCfRequired(false);
                }}
                className="text-xs font-bold text-rose-500 hover:underline"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSaveCustomField} className="space-y-3 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">
                  Field Label *
                </label>
                <input
                  type="text"
                  value={cfLabel}
                  onChange={(e) => setCfLabel(e.target.value)}
                  placeholder="e.g. Region, ARR Tier, CRM ID"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">
                  Applies To Module
                </label>
                <select
                  value={cfEntity}
                  onChange={(e) => setCfEntity(e.target.value as CustomFieldEntity)}
                  className={inputCls}
                >
                  <option value="Lead">Leads Only</option>
                  <option value="Deal">Deals &amp; Pipeline Only</option>
                  <option value="Both">Both Leads &amp; Deals</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">
                  Field Input Type
                </label>
                <select
                  value={cfType}
                  onChange={(e) => setCfType(e.target.value as CustomFieldType)}
                  className={inputCls}
                >
                  <option value="text">Text Input</option>
                  <option value="number">Number / Currency</option>
                  <option value="select">Dropdown Select</option>
                  <option value="date">Date Picker</option>
                  <option value="url">Website / URL</option>
                </select>
              </div>
            </div>

            {cfType === 'select' ? (
              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">
                  Dropdown Options (Comma-separated) *
                </label>
                <input
                  type="text"
                  value={cfOptionsStr}
                  onChange={(e) => setCfOptionsStr(e.target.value)}
                  placeholder="e.g. North America, EMEA, APAC, LATAM"
                  className={inputCls}
                />
              </div>
            ) : (
              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">
                  Placeholder Hint
                </label>
                <input
                  type="text"
                  value={cfPlaceholder}
                  onChange={(e) => setCfPlaceholder(e.target.value)}
                  placeholder="Optional placeholder text..."
                  className={inputCls}
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={cfRequired}
                  onChange={(e) => setCfRequired(e.target.checked)}
                  className="accent-sky-500"
                />
                <span>Required field when creating/editing records</span>
              </label>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{editingField ? 'Update Field' : 'Add Custom Field'}</span>
              </button>
            </div>
          </form>

          {/* Existing Custom Fields List */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {config.customFields.map((field) => (
              <div
                key={field.id}
                className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                      {field.label}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      {field.entity === 'Both' ? 'Leads & Deals' : field.entity}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                      {field.type}
                    </span>
                    {field.required && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-500">
                        Required
                      </span>
                    )}
                  </div>
                  {field.type === 'select' && field.options.length > 0 && (
                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      Options: {field.options.join(' • ')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEditCustomField(field)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Edit Custom Field"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomField(field)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Delete Custom Field"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

