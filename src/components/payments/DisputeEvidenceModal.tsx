import React, { useState } from 'react';
import { X, ShieldAlert, CheckSquare, Square, FileText, Send, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { PaymentDispute } from '../../types/crm';

interface DisputeEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispute: PaymentDispute | null;
  onSubmitEvidence: (disputeId: string, evidenceSummary: string) => void;
}

const EVIDENCE_DOCUMENTS = [
  'Signed Master Services Agreement (MSA) & Statement of Work',
  'Verified Deliverable Signoff & Client Acceptance Protocol',
  'Server API Access Logs & IP Address Match Verification',
  'Billing Email Notification & Delivery Receipt Log',
  'Customer Support Communication & Ticket Resolution Transcript',
];

export const DisputeEvidenceModal: React.FC<DisputeEvidenceModalProps> = ({
  isOpen,
  onClose,
  dispute,
  onSubmitEvidence,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';

  const [selectedDocs, setSelectedDocs] = useState<string[]>([
    EVIDENCE_DOCUMENTS[0],
    EVIDENCE_DOCUMENTS[1],
  ]);
  const [rebuttalNotes, setRebuttalNotes] = useState(
    'Services were fully delivered as contracted under the Master Services Agreement. Deliverable was accepted by client executive. Attached logs prove continuous product access.'
  );

  if (!isOpen || !dispute) return null;

  const toggleDoc = (doc: string) => {
    setSelectedDocs((prev) =>
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitEvidence(dispute.id, rebuttalNotes);
    onClose();
  };

  const inputClass = isLight
    ? 'w-full px-3 py-2 text-xs rounded-xl border border-sky-100 bg-sky-50/40 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400'
    : 'w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900/70 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-4 ${
          isLight ? 'bg-white border-sky-200' : 'bg-[#0f172a] border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Submit Counter-Evidence: {dispute.disputeNumber}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {dispute.client} • Disputed: {dispute.amountFormatted}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-slate-700 dark:text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="font-semibold text-rose-700 dark:text-rose-300">Dispute Claim:</span>
              <span className="font-bold">{dispute.reason}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Card Network Response Deadline:</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                {dispute.evidenceDeadline}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Select Defense Evidence Documents *
            </label>
            <div className="space-y-2">
              {EVIDENCE_DOCUMENTS.map((doc) => {
                const isSelected = selectedDocs.includes(doc);
                return (
                  <div
                    key={doc}
                    onClick={() => toggleDoc(doc)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-sky-300 bg-sky-50/60 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="mt-0.5 text-sky-600 dark:text-sky-400 shrink-0">
                      {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </div>
                    <span className="text-[11.5px] leading-tight select-none">{doc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Rebuttal Defense Statement
            </label>
            <textarea
              rows={3}
              value={rebuttalNotes}
              onChange={(e) => setRebuttalNotes(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedDocs.length === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Proof & Rebuttal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

