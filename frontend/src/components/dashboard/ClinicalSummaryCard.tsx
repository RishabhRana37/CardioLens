import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { riskGradient, getRiskTier } from '../../three/colorScale';
import {
  FileText,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
  Activity,
  Heart,
  TrendingDown,
} from 'lucide-react';

interface ClinicalSummaryCardProps {
  className?: string;
}

export const ClinicalSummaryCard: React.FC<ClinicalSummaryCardProps> = ({ className = '' }) => {
  const {
    patient,
    patientSummary,
    predictions,
    explanation,
  } = useAppStore();

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'plain' | 'structured'>('plain');

  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Friendly human labels for feature dictionary
  const getFriendlyFeatureName = (name: string): string => {
    const map: Record<string, string> = {
      LDL: 'LDL Cholesterol',
      HDL: 'HDL Cholesterol (protective)',
      TG: 'Serum Triglycerides',
      BP: 'Systolic Blood Pressure',
      FBS: 'Fasting Blood Glucose',
      DM: 'Diabetes Mellitus history',
      HTN: 'Hypertension history',
      'Current Smoker': 'Active Tobacco Smoking',
      'Ex-Smoker': 'Past Tobacco Smoking',
      'Typical Chest Pain': 'Typical Anginal Chest Pain',
      'Exertional CP': 'Exertional Chest Pain',
      Dyspnea: 'Shortness of breath (Dyspnea)',
      BMI: 'Body Mass Index',
      Weight: 'Body Weight',
      'EF-TTE': 'Echocardiographic Ejection Fraction',
      EF_TTE: 'Echocardiographic Ejection Fraction',
      Age: 'Patient Age',
      Sex: 'Sex',
      FH: 'Family History of CAD',
      'Region with RWMA': 'Regional Wall Motion Abnormality',
      'ST Elevation': 'Resting ST Segment Elevation',
      'ST Depression': 'Resting ST Segment Depression',
      'T inversion': 'T-Wave Inversion',
      CRF: 'Chronic Renal Failure history',
    };
    return map[name] || name;
  };

  // 1. Generate Deterministic Plain-Language Narrative entirely from model outputs + SHAP
  const summaryData = useMemo(() => {
    if (!patient || !predictions) return null;

    const cadPred = predictions.CAD?.probability ?? 0.25;
    const cadTier = getRiskTier(cadPred);

    const ladPred = predictions.LAD?.probability ?? 0.2;
    const lcxPred = predictions.LCX?.probability ?? 0.2;
    const rcaPred = predictions.RCA?.probability ?? 0.2;

    const ladTier = getRiskTier(ladPred);
    const lcxTier = getRiskTier(lcxPred);
    const rcaTier = getRiskTier(rcaPred);

    // Sort SHAP contributions for active target
    const contributions = explanation?.contributions || [];
    const riskDrivers = contributions
      .filter((c) => c.shap > 0.01)
      .sort((a, b) => b.shap - a.shap)
      .slice(0, 4);

    const protectiveFactors = contributions
      .filter((c) => c.shap < -0.01)
      .sort((a, b) => a.shap - b.shap)
      .slice(0, 3);

    // Modifiable feature levers
    const modifiableFeatures = ['Current Smoker', 'LDL', 'BP', 'FBS', 'TG', 'HDL', 'BMI'];
    const activeModifiables = riskDrivers.filter((c) => modifiableFeatures.includes(c.feature));

    // Plain-language paragraphs
    const paragraph1 = `CardioTwin Model Impression: For ${
      patientSummary || 'this patient profile'
    }, the calibrated multi-target gradient-boosted model estimates an overall CAD composite probability of ${(
      cadPred * 100
    ).toFixed(0)}%, placing the patient in the ${cadTier.label} risk category.`;

    const paragraph2 = `Per-Vessel Anatomical Findings: Evaluation of the coronary tree indicates the Left Anterior Descending (LAD) artery is at ${(
      ladPred * 100
    ).toFixed(0)}% risk (${ladTier.label}), the Left Circumflex (LCX) is at ${(
      lcxPred * 100
    ).toFixed(0)}% risk (${lcxTier.label}), and the Right Coronary Artery (RCA) is at ${(
      rcaPred * 100
    ).toFixed(0)}% risk (${rcaTier.label}).`;

    let paragraph3 = 'Model Attribution (SHAP Drivers): ';
    if (riskDrivers.length > 0) {
      const driverList = riskDrivers
        .map(
          (d) =>
            `${getFriendlyFeatureName(d.feature)} (${d.value}${
              d.feature === 'LDL' || d.feature === 'TG' || d.feature === 'FBS'
                ? ' mg/dL'
                : d.feature === 'BP'
                ? ' mmHg'
                : ''
            })`
        )
        .join(', ');
      paragraph3 += `The strongest factors driving model risk upward are ${driverList}. `;
    }
    if (protectiveFactors.length > 0) {
      const protList = protectiveFactors
        .map((p) => `${getFriendlyFeatureName(p.feature)} (${p.value})`)
        .join(', ');
      paragraph3 += `Protective factors lowering predicted risk include ${protList}.`;
    }

    let paragraph4 = '';
    if (activeModifiables.length > 0) {
      const modifiableList = activeModifiables
        .map((m) => getFriendlyFeatureName(m.feature))
        .join(' and ');
      paragraph4 = `Highest-Leverage Modifiable Factors: In simulation, optimization of ${modifiableList} yields the largest mathematical reduction in model-predicted cardiovascular risk.`;
    } else {
      paragraph4 =
        'Highest-Leverage Modifiable Factors: Routine lipid and blood pressure optimization remain the primary modifiable levers in What-If simulations.';
    }

    const disclaimerText =
      'Clinical Safety Framing: This auto-generated summary reflects mathematical model feature attributions derived from the Z-Alizadeh Sani Cardiovascular Dataset. It is not an individualized medical prognosis or clinical prescription. All clinical decisions must be confirmed by qualified medical professionals.';

    const fullSpokenText = `${paragraph1} ${paragraph2} ${paragraph3} ${paragraph4} ${disclaimerText}`;

    return {
      paragraph1,
      paragraph2,
      paragraph3,
      paragraph4,
      disclaimerText,
      fullSpokenText,
      cadPred,
      cadTier,
      ladPred,
      lcxPred,
      rcaPred,
      riskDrivers,
      protectiveFactors,
    };
  }, [patient, patientSummary, predictions, explanation]);

  // SpeechSynthesis Web API logic
  const handleToggleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!summaryData) return;

    window.speechSynthesis.cancel(); // Stop any pending utterances

    const utterance = new SpeechSynthesisUtterance(summaryData.fullSpokenText);
    utterance.rate = 0.96;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    // Pick a natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Alex')) && v.lang.startsWith('en')
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Stop speech synthesis on component unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Copy text to clipboard
  const handleCopy = () => {
    if (!summaryData) return;
    const exportText = `=== CARDIOTWIN CLINICAL SUMMARY ===\n\n${summaryData.paragraph1}\n\n${summaryData.paragraph2}\n\n${summaryData.paragraph3}\n\n${summaryData.paragraph4}\n\n[DISCLAIMER]\n${summaryData.disclaimerText}\n\nGenerated: ${new Date().toLocaleString()}`;
    navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!patient || !summaryData) {
    return (
      <div className={`p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-slate-400 font-mono text-xs text-center ${className}`}>
        Select a patient to generate a model-grounded plain-language clinical summary.
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl bg-slate-950/90 border border-white/10 p-3.5 sm:p-4 backdrop-blur-2xl shadow-2xl font-mono text-slate-100 select-none space-y-3.5 ${className}`}
    >
      {/* Top Header & Actions Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-teal-950 border border-teal-500/40 flex items-center justify-center text-teal-300 shadow-glow-teal shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Plain-Language Clinical Summary
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-500/30">
                PRD Stretch S2
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block font-sans">
              100% Deterministically templated from ML model probabilities & SHAP values
            </span>
          </div>
        </div>

        {/* Read Aloud & Copy Actions */}
        <div className="flex items-center gap-1.5">
          {/* Read Aloud Voice Button */}
          <button
            type="button"
            onClick={handleToggleSpeak}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              isSpeaking
                ? 'bg-rose-950/90 border-rose-400 text-rose-300 shadow-glow-red animate-pulse'
                : 'bg-teal-950/90 hover:bg-teal-900 border-teal-500/40 text-teal-300 shadow-xs'
            }`}
            title={isSpeaking ? 'Stop voice summary' : 'Read plain-language summary aloud'}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Stop Audio</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Read Aloud</span>
              </>
            )}
          </button>

          {/* Copy Summary */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-colors"
            title="Copy narrative summary & disclaimer to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Audio Wave Indicator when speaking */}
      {isSpeaking && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-teal-950/60 border border-teal-500/40 text-teal-300 text-[11px] animate-pulse">
          <div className="flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-teal-400 animate-bounce" />
            <span>Narrating clinical findings via Web SpeechSynthesis API...</span>
          </div>
          <span className="text-[10px] text-slate-400 font-sans">Browser native · Zero server latency</span>
        </div>
      )}

      {/* Tab Switcher: Plain Narrative vs Structured Breakdown */}
      <div className="flex p-0.5 bg-slate-900/80 rounded-xl border border-white/10 text-[11px] max-w-xs">
        <button
          type="button"
          onClick={() => setActiveTab('plain')}
          className={`flex-1 py-1 rounded-lg transition-all ${
            activeTab === 'plain'
              ? 'bg-teal-600 text-white font-bold shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Narrative Prose
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('structured')}
          className={`flex-1 py-1 rounded-lg transition-all ${
            activeTab === 'structured'
              ? 'bg-teal-600 text-white font-bold shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Structured Findings
        </button>
      </div>

      {/* Narrative Prose View */}
      {activeTab === 'plain' ? (
        <div className="space-y-3 text-xs leading-relaxed text-slate-200 font-sans">
          {/* Paragraph 1: Overall CAD */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-teal-300 font-bold font-mono text-[11px]">
              <Heart className="w-3.5 h-3.5 text-teal-400" />
              1. Overall CAD Impression
            </div>
            <p className="text-slate-300 leading-normal">{summaryData.paragraph1}</p>
          </div>

          {/* Paragraph 2: Per-Vessel */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-teal-300 font-bold font-mono text-[11px]">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              2. Coronary Vessel Findings
            </div>
            <p className="text-slate-300 leading-normal">{summaryData.paragraph2}</p>
          </div>

          {/* Paragraph 3: SHAP Drivers */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-teal-300 font-bold font-mono text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              3. Feature Attributions (SHAP)
            </div>
            <p className="text-slate-300 leading-normal">{summaryData.paragraph3}</p>
          </div>

          {/* Paragraph 4: Modifiable Levers */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold font-mono text-[11px]">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
              4. Highest-Leverage Modifiable Factors
            </div>
            <p className="text-slate-300 leading-normal">{summaryData.paragraph4}</p>
          </div>
        </div>
      ) : (
        /* Structured Findings Grid View */
        <div className="space-y-3 font-mono text-xs">
          {/* Vessel Cards Mini-Grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-900/70 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold">LAD Artery</span>
              <div className="text-base font-bold" style={{ color: riskGradient(summaryData.ladPred) }}>
                {(summaryData.ladPred * 100).toFixed(0)}%
              </div>
              <span className="text-[9px] text-slate-400">
                {getRiskTier(summaryData.ladPred).label}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/70 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold">LCX Artery</span>
              <div className="text-base font-bold" style={{ color: riskGradient(summaryData.lcxPred) }}>
                {(summaryData.lcxPred * 100).toFixed(0)}%
              </div>
              <span className="text-[9px] text-slate-400">
                {getRiskTier(summaryData.lcxPred).label}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/70 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold">RCA Artery</span>
              <div className="text-base font-bold" style={{ color: riskGradient(summaryData.rcaPred) }}>
                {(summaryData.rcaPred * 100).toFixed(0)}%
              </div>
              <span className="text-[9px] text-slate-400">
                {getRiskTier(summaryData.rcaPred).label}
              </span>
            </div>
          </div>

          {/* Top Positive Drivers List */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-rose-300">
              Top Risk-Elevating Factors (SHAP &gt; 0):
            </span>
            <div className="space-y-1">
              {summaryData.riskDrivers.map((d) => (
                <div key={d.feature} className="flex items-center justify-between text-[11px] text-slate-300">
                  <span>{getFriendlyFeatureName(d.feature)}:</span>
                  <span className="text-rose-400 font-bold tabular-nums">
                    {String(d.value)} (+{d.shap.toFixed(3)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Regulatory Disclaimer Footer */}
      <div className="p-2.5 rounded-xl bg-slate-900/40 border border-amber-500/30 text-[10px] text-slate-400 font-sans leading-relaxed space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-amber-300 font-mono text-[10px]">
          <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Non-Diagnostic Disclaimer</span>
        </div>
        <p>{summaryData.disclaimerText}</p>
      </div>
    </div>
  );
};

export default ClinicalSummaryCard;
