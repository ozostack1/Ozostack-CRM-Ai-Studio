import React, { useState, useEffect } from 'react';
import {
  X,
  Briefcase,
  Building2,
  DollarSign,
  User,
  Calendar,
  Check,
  Award,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSystemCurrency } from '../../data/currencyService';
import { EmploymentType, JobRequisition } from './teamMockData';

interface JobModalProps {
  isOpen: boolean;
  job: JobRequisition | null;
  onClose: () => void;
  onSave: (job: JobRequisition) => void;
  departments: string[];
  existingManagers: string[];
}

export const JobModal: React.FC<JobModalProps> = ({
  isOpen,
  job,
  onClose,
  onSave,
  departments,
  existingManagers,
}) => {
  const { theme } = useTheme();
  const currency = useSystemCurrency();
  const isLight = theme === 'white-sky';

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState(departments[0] || 'Engineering');
  const [type, setType] = useState<EmploymentType>('Full-Time');
  const [experienceLevel, setExperienceLevel] = useState('3+ years');
  const [salaryBand, setSalaryBand] = useState(`${currency.symbol}120k - ${currency.symbol}145k`);
  const [openings, setOpenings] = useState(1);
  const [applicantsCount, setApplicantsCount] = useState(0);
  const [stage, setStage] = useState<JobRequisition['stage']>('Sourcing');
  const [hiringManager, setHiringManager] = useState(existingManagers[0] || 'Sayed (CEO)');
  const [error, setError] = useState('');

  useEffect(() => {
    if (job) {
      setTitle(job.title);
      setDepartment(job.department);
      setType(job.type);
      setExperienceLevel(job.experienceLevel);
      setSalaryBand(job.salaryBand);
      setOpenings(job.openings);
      setApplicantsCount(job.applicantsCount);
      setStage(job.stage);
      setHiringManager(job.hiringManager);
    } else {
      setTitle('');
      setDepartment(departments[0] || 'Engineering');
      setType('Full-Time');
      setExperienceLevel('3+ years');
      setSalaryBand(`${currency.symbol}120k - ${currency.symbol}145k`);
      setOpenings(1);
      setApplicantsCount(0);
      setStage('Sourcing');
      setHiringManager(existingManagers[0] || 'Sayed (CEO)');
    }
    setError('');
  }, [job, isOpen, departments, existingManagers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Job title is required.');
      return;
    }

    const newOrUpdatedJob: JobRequisition = {
      id: job ? job.id : `job-${Date.now()}`,
      title: title.trim(),
      department,
      type,
      experienceLevel: experienceLevel.trim(),
      salaryBand: salaryBand.trim(),
      openings: Number(openings) || 1,
      applicantsCount: Number(applicantsCount) || 0,
      stage,
      hiringManager,
      postedDate: job ? job.postedDate : new Date().toISOString().split('T')[0],
    };

    onSave(newOrUpdatedJob);
    onClose();
  };

  const modalBg = isLight ? 'bg-white text-slate-800' : 'bg-[#0f172a] text-slate-100';
  const inputBg = isLight
    ? 'bg-slate-50 border-sky-200/80 focus:bg-white text-slate-900 placeholder-slate-400'
    : 'bg-slate-800/80 border-slate-700 focus:bg-slate-800 text-slate-100 placeholder-slate-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden my-8 ${modalBg} ${
          isLight ? 'border-sky-100' : 'border-slate-800'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight ? 'border-sky-100 bg-sky-50/50' : 'border-slate-800 bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {job ? 'Edit Job Requisition' : 'Post New Hiring Requisition'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Define open position requirements, compensation, and hiring manager
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Job Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Senior Security Architect, Product Marketing Lead"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              required
            />
            {error && <p className="text-xs text-rose-500 mt-1 font-medium">{error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Employment Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EmploymentType)}
                className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contractor">Contractor</option>
                <option value="Intern">Intern</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Experience Level
              </label>
              <input
                type="text"
                placeholder="e.g. 4+ years, Senior"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Compensation / Salary Band
              </label>
              <input
                type="text"
                placeholder={`e.g. ${currency.symbol}130k - ${currency.symbol}160k`}
                value={salaryBand}
                onChange={(e) => setSalaryBand(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Openings
              </label>
              <input
                type="number"
                min="1"
                value={openings}
                onChange={(e) => setOpenings(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Applicants
              </label>
              <input
                type="number"
                min="0"
                value={applicantsCount}
                onChange={(e) => setApplicantsCount(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hiring Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as JobRequisition['stage'])}
                className={`w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              >
                <option value="Sourcing">Sourcing</option>
                <option value="Interviewing">Interviewing</option>
                <option value="Final Review">Final Review</option>
                <option value="Offer Extended">Offer Extended</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Hiring Manager
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <select
                value={hiringManager}
                onChange={(e) => setHiringManager(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/20 ${inputBg}`}
              >
                {existingManagers.map((mgr) => (
                  <option key={mgr} value={mgr}>
                    {mgr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            className={`pt-4 border-t flex items-center justify-end gap-2.5 ${
              isLight ? 'border-sky-100' : 'border-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-md shadow-purple-500/20 transition-all"
            >
              <Check className="w-4 h-4" />
              {job ? 'Save Changes' : 'Publish Requisition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

