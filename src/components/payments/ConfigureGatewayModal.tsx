import React, { useState, useEffect } from 'react';
import { X, Zap, Shield, CheckCircle2, Lock } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSystemCurrency } from '../../data/currencyService';
import { PaymentGateway } from '../../types/crm';

interface ConfigureGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  gateway: PaymentGateway | null;
  onSave: (updatedGateway: PaymentGateway) => void;
}

export const ConfigureGatewayModal: React.FC<ConfigureGatewayModalProps> = ({
  isOpen,
  onClose,
  gateway,
  onSave,
}) => {
  const { theme } = useTheme();
  const { symbol } = useSystemCurrency();
  const isLight = theme === 'white-sky';

  const [environment, setEnvironment] = useState<'Live' | 'Test'>('Live');
  const [status, setStatus] = useState<'Active' | 'Connected' | 'Action Needed' | 'Disabled'>('Connected');
  const [feeStructure, setFeeStructure] = useState('');
  const [apiKey, setApiKey] = useState('pk_live_51MzoStackEnterpriseRails993201');
  const [webhookSecret, setWebhookSecret] = useState('whsec_88492040182aae4928103c80');

  useEffect(() => {
    if (gateway) {
      setEnvironment(gateway.environment);
      setStatus(gateway.status);
      setFeeStructure(gateway.feeStructure);
      setApiKey(
        gateway.environment === 'Live'
          ? `pk_live_${gateway.id}_${Math.random().toString(36).substring(2, 8)}`
          : `pk_test_${gateway.id}_${Math.random().toString(36).substring(2, 8)}`
      );
    }
  }, [gateway, isOpen]);

  if (!isOpen || !gateway) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...gateway,
      environment,
      status,
      feeStructure: feeStructure.trim() || gateway.feeStructure,
    });
    onClose();
  };

  const inputClass = isLight
    ? 'w-full px-3 py-2 text-xs rounded-xl border border-sky-100 bg-sky-50/40 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 font-mono'
    : 'w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900/70 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono';

  const labelClass = 'block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-4 ${
          isLight ? 'bg-white border-sky-200' : 'bg-[#0f172a] border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Configure {gateway.name}
              </h3>
              <p className="text-[11px] text-slate-500">
                Payment gateway credentials, environment toggle, and fee schedules
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
          {/* Environment Mode */}
          <div>
            <label className={labelClass}>Operating Environment</label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold">
              <button
                type="button"
                onClick={() => setEnvironment('Live')}
                className={`py-1.5 rounded-lg text-center transition-all ${
                  environment === 'Live'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Live Production
              </button>
              <button
                type="button"
                onClick={() => setEnvironment('Test')}
                className={`py-1.5 rounded-lg text-center transition-all ${
                  environment === 'Test'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Test / Sandbox
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Gateway Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className={inputClass}
              >
                <option value="Active">Active</option>
                <option value="Connected">Connected</option>
                <option value="Action Needed">Action Needed</option>
                <option value="Disabled">Disabled</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Contract Fee Structure</label>
              <input
                type="text"
                value={feeStructure}
                onChange={(e) => setFeeStructure(e.target.value)}
                placeholder={`e.g. 2.9% + ${symbol}0.30 per tx`}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>API Publishable Key</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className={`${inputClass} pl-8`}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Webhook Signing Secret</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className={`${inputClass} pl-8`}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Supported Currencies:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {gateway.currencySupported.join(', ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Webhook Endpoint:</span>
              <span className="font-mono text-sky-600 dark:text-sky-400">
                https://api.ozostack.com/webhooks/{gateway.gatewayKey.toLowerCase().replace(/\s+/g, '-')}
              </span>
            </div>
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
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

