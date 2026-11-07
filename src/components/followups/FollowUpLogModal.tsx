import React, { useState } from 'react';
import { X, CheckCircle2, Send, Phone, MessageSquare, Mail, Video, Clock } from 'lucide-react';
import { FollowUp } from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';

interface FollowUpLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  followUp: FollowUp | null;
  onComplete: (followUpId: string, outcome: string) => void;
}

const OUTCOME_PRESETS = [
  'Connected — Meeting was productive & agreed on next steps.',
  'Shared revised proposal & pricing matrix with stakeholders.',
  'Left voicemail / Sent reminder message to reschedule.',
  'Contract & terms approved — moving to signature.',
  'Client requested follow-up in 2 weeks for budget clearance.',
];

export const FollowUpLogModal: React.FC<FollowUpLogModalProps> = ({
  isOpen,
  onClose,
  followUp,
  onComplete,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';

  const [outcome, setOutcome] = useState(OUTCOME_PRESETS[0]);
  const [customNotes, setCustomNotes] = useState('');

  if (!isOpen || !followUp) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalOutcome = customNotes.trim()
      ? `${outcome} Details: ${customNotes.trim()}`
      : outcome;
    onComplete(followUp.id, finalOutcome);
    onClose();
  };

  const Icon =
    followUp.type === 'Call'
      ? Phone
      : followUp.type === 'WhatsApp'
      ? MessageSquare
      : followUp.type === 'Email'
      ? Mail
      : Video;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden z-10 flex flex-col ${
          isLight ? 'bg-white border-sky-100 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Log Touchpoint Outcome
              </h2>
              <p className="text-xs text-slate-400">
                Mark interaction with {followUp.contact} as completed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Summary Banner */}
          <div className="p-3 rounded-xl border border-sky-100 dark:border-slate-800 bg-sky-50/40 dark:bg-slate-800/40 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 dark:text-white block text-sm">
                {followUp.contact}
              </span>
              <span className="text-slate-400 text-xs">
                {followUp.company} {followUp.dealName ? `· ${followUp.dealName}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 font-semibold">
              <Icon className="w-4 h-4" />
              <span>{followUp.type}</span>
            </div>
          </div>

          {/* Preset Outcomes */}
          <div>
            <label className="block font-semibold mb-2 text-slate-600 dark:text-slate-300">
              Select Outcome Summary
            </label>
            <div className="space-y-1.5">
              {OUTCOME_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setOutcome(preset)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between ${
                    outcome === preset
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : isLight
                      ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                      : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <span>{preset}</span>
                  {outcome === preset && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Details */}
          <div>
            <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
              Additional Meeting Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Specific objections, agreed delivery dates, or technical clarifications..."
              className={`w-full text-xs p-2.5 rounded-lg border outline-none font-medium ${
                isLight
                  ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                  : 'bg-slate-800 border-slate-700 text-slate-100 focus:border-sky-400'
              }`}
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-sky-100/30">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                isLight
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark as Completed</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

