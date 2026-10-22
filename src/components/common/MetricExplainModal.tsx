import React from 'react';
import { X, Calculator, ShieldCheck, CheckCircle2, Clock, Database, Info, ExternalLink } from 'lucide-react';

export interface MetricCalculationDetail {
  name: string;
  value: string | number;
  source: string;
  updatedAt: string;
  formula: string;
  components?: {
    label: string;
    weight: string;
    score: string | number;
    status: 'pass' | 'warning' | 'pending';
    detail: string;
  }[];
  explanation: string;
  verifiedMethod: string;
}

interface MetricExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail: MetricCalculationDetail | null;
}

export const MetricExplainModal: React.FC<MetricExplainModalProps> = ({
  isOpen,
  onClose,
  detail
}) => {
  if (!isOpen || !detail) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-[#DADCE0] rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-[#DADCE0] flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#202124]">
                How is this calculated?
              </h3>
              <p className="text-xs text-[#5F6368]">
                Metric: <span className="font-semibold text-[#1A73E8]">{detail.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] rounded-lg transition-colors"
            aria-label="Close calculation breakdown"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Current Value & Source Meta */}
          <div className="bg-[#F8F9FA] border border-[#DADCE0] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-[#5F6368] uppercase tracking-wider block">
                Current Reported Value
              </span>
              <span className="text-2xl font-bold text-[#202124] mt-0.5 block">
                {detail.value}
              </span>
            </div>
            <div className="text-left sm:text-right space-y-1">
              <div className="flex items-center sm:justify-end gap-1.5 text-xs text-[#202124] font-medium">
                <Database className="w-3.5 h-3.5 text-[#1A73E8]" />
                <span>Source: <strong>{detail.source}</strong></span>
              </div>
              <div className="flex items-center sm:justify-end gap-1.5 text-[11px] text-[#5F6368]">
                <Clock className="w-3 h-3 text-[#80868B]" />
                <span>Updated: {detail.updatedAt}</span>
              </div>
            </div>
          </div>

          {/* Mathematical Formula / Calculation Definition */}
          <div>
            <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider mb-1.5">
              Exact Formula / Algorithm
            </h4>
            <div className="p-3.5 bg-[#F1F3F4] rounded-xl font-mono text-xs text-[#202124] border border-[#E8EAED] leading-relaxed">
              {detail.formula}
            </div>
          </div>

          {/* Component Weights Breakdown (if applicable) */}
          {detail.components && detail.components.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider mb-2">
                Weighted Components Breakdown
              </h4>
              <div className="border border-[#DADCE0] rounded-xl divide-y divide-[#F1F3F4] overflow-hidden text-xs">
                {detail.components.map((comp, idx) => (
                  <div key={idx} className="p-3 flex items-start justify-between gap-3 bg-white hover:bg-[#F8F9FA]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#202124]">{comp.label}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#E8F0FE] text-[#1A73E8]">
                          Weight: {comp.weight}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5F6368]">{comp.detail}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-[#202124]">{comp.score}</span>
                      <span
                        className={`block text-[10px] font-semibold ${
                          comp.status === 'pass'
                            ? 'text-[#137333]'
                            : comp.status === 'warning'
                            ? 'text-[#B06000]'
                            : 'text-[#C5221F]'
                        }`}
                      >
                        {comp.status === 'pass' ? '✓ Complete' : comp.status === 'warning' ? '⚠ Partial' : '✕ Missing'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation narrative */}
          <div>
            <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider mb-1.5">
              Verification & Methodology
            </h4>
            <p className="text-xs text-[#3C4043] leading-relaxed bg-[#F8F9FA] p-3.5 rounded-xl border border-[#E8EAED]">
              {detail.explanation}
            </p>
          </div>

          {/* Compliance & Zero Fake Data Guarantee */}
          <div className="p-3.5 bg-[#E6F4EA] border border-[#CEEAD6] rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#137333] shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-[#137333] block">
                Production Real-Data Standard Enforced
              </span>
              <p className="text-[#137333]/90 text-[11px] mt-0.5">
                {detail.verifiedMethod} Every data point is computed deterministically from active API connections or explicit configuration audit logs.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#DADCE0] bg-[#F8F9FA] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Got it, close
          </button>
        </div>
      </div>
    </div>
  );
};
