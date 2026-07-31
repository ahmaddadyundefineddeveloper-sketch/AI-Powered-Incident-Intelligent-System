import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { submitReport } from '../api/reports.api';
import ImageUpload from '../components/form/ImageUpload';
import LocationPicker from '../components/form/LocationPicker';
import VoiceInput from '../components/form/VoiceInput';

const SOURCE_TYPES = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'officer', label: 'Field Officer' },
  { value: 'other', label: 'Other' },
];

const PIPELINE_STEPS = [
  { key: 'analyze', label: 'Gemma Vision Analysis…', icon: 'psychology' },
  { key: 'search', label: 'Searching similar incidents…', icon: 'search' },
  { key: 'fuse', label: 'Incident Fusion…', icon: 'merge' },
  { key: 'brief', label: 'Generating operational briefing…', icon: 'auto_awesome' },
];

const DATA_STREAM_LINES = [
  'ANALYZING IMAGE DATA...',
  'EXTRACTING FEATURES... [OK]',
  'SEARCHING INCIDENT DATABASE...',
  'FUSING SENSOR FEEDS...',
  'CORRELATING HISTORICAL DATA...',
  'GENERATING BRIEFING...',
  'PIPELINE COMPLETE.',
];

export default function SubmitReport() {
  const navigate = useNavigate();

  const [uploadedImage, setUploadedImage] = useState(null);
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState('other');
  const [language, setLanguage] = useState('en');
  const [location, setLocation] = useState(null);
  const [voiceModality, setVoiceModality] = useState(false); // true if voice was used

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [streamLines, setStreamLines] = useState([]);
  const [resultIncidentId, setResultIncidentId] = useState(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!submitting) return;
    let step = 0;
    setActiveStep(0);
    setCompletedSteps([]);
    const interval = setInterval(() => {
      setCompletedSteps((prev) => [...prev, step]);
      step++;
      if (step < PIPELINE_STEPS.length) setActiveStep(step);
      else { setActiveStep(-1); clearInterval(interval); }
    }, 2500);
    return () => clearInterval(interval);
  }, [submitting]);

  useEffect(() => {
    if (!submitting) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < DATA_STREAM_LINES.length) {
        setStreamLines((prev) => [...prev, DATA_STREAM_LINES[i]]);
        i++;
        if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
      } else clearInterval(interval);
    }, 900);
    return () => clearInterval(interval);
  }, [submitting]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location?.coordinates) {
      toast.error('Please set a location — search by name, tap "My Location", or click the map.');
      return;
    }
    setSubmitting(true);
    setStreamLines([]);
    try {
      // Determine modality
      const hasImage = !!uploadedImage;
      const hasVoice = voiceModality;
      const modality = hasImage && (hasVoice || description)
        ? 'multimodal'
        : hasVoice ? 'voice'
        : hasImage ? 'image'
        : 'text';

      const payload = {
        sourceType,
        reporterType: sourceType === 'officer' ? 'field_officer' : 'citizen',
        description,
        language,
        input: {
          text: description,
          language,
          modality,
        },
        location,
        timestamp: new Date().toISOString(),
        mediaAssets: uploadedImage ? [{ url: uploadedImage.url, mimeType: uploadedImage.mimeType }] : [],
      };
      const result = await submitReport(payload);
      setResultIncidentId(result.report?.incidentId || null);
      setSubmitted(true);
      toast.success('Report submitted and queued for AI analysis!');
    } catch (err) {
      toast.error(err.message || 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  // Called when Gemini transcribes voice — append to description
  const handleTranscript = ({ transcript, detectedLanguage }) => {
    setDescription((prev) => prev ? `${prev} ${transcript}` : transcript);
    setLanguage(detectedLanguage || 'en');
    setVoiceModality(true);
    toast.success(`Voice transcribed in ${detectedLanguage?.toUpperCase() || 'unknown language'} by Gemini`);
  };

  const handleReset = () => {
    setSubmitted(false);
    setSubmitting(false);
    setUploadedImage(null);
    setDescription('');
    setLocation(null);
    setVoiceModality(false);
    setActiveStep(-1);
    setCompletedSteps([]);
    setStreamLines([]);
    setResultIncidentId(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-[1440px] mx-auto">

      {/* Page header */}
      <div className="mb-5">
        <h2 className="text-xl md:text-2xl font-bold text-[#191c1e] tracking-tight mb-1">Submit Intelligence Report</h2>
        <p className="text-xs md:text-sm text-[#434655]">Provide raw data for AI fusion and operational briefing generation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Left: Form ── */}
        <div className="bg-white border border-[#c3c6d7] rounded-xl shadow-sm p-6 flex flex-col gap-5">

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Image upload */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#191c1e]">
                Evidence Image
                <span className="ml-1 text-[#737686] font-normal">(optional — Gemma will analyze it)</span>
              </label>
              <ImageUpload value={uploadedImage} onUpload={setUploadedImage} />
            </div>

            {/* Voice input */}
            <VoiceInput onTranscript={handleTranscript} disabled={submitting || submitted} />

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#191c1e]">
                Description
                <span className="ml-1 text-[#737686] font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter observed details, field notes, or witness account…"
                rows={3}
                className="w-full bg-white border border-[#c3c6d7] rounded-lg p-3 text-sm text-[#191c1e] placeholder-[#737686] focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-colors resize-none"
              />
            </div>

            {/* Source + Language */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[#191c1e]">Source Type</label>
                <div className="relative">
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                    className="w-full bg-white border border-[#c3c6d7] rounded-lg p-2.5 pr-8 text-sm text-[#191c1e] focus:outline-none focus:border-[#004ac6] appearance-none transition-colors"
                  >
                    {SOURCE_TYPES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[#434655] pointer-events-none" style={{ fontSize: '18px' }}>expand_more</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[#191c1e]">Language</label>
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-white border border-[#c3c6d7] rounded-lg p-2.5 pr-8 text-sm text-[#191c1e] focus:outline-none focus:border-[#004ac6] appearance-none transition-colors"
                  >
                    <option value="en">English</option>
                    <option value="ha">Hausa</option>
                    <option value="ar">Arabic</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[#434655] pointer-events-none" style={{ fontSize: '18px' }}>expand_more</span>
                </div>
              </div>
            </div>

            {/* Location */}
            <LocationPicker value={location} onChange={setLocation} />

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || submitted}
              className="w-full bg-[#004ac6] hover:bg-[#003ea8] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg h-11 flex items-center justify-center gap-2 transition-colors shadow-sm mt-2"
            >
              {submitting && !submitted ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Submitting…
                </>
              ) : submitted ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Submitted — AI Processing
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_awesome</span>
                  Analyze with Gemma
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── Right: AI Processing Panel ── */}
        <div className="bg-[#2d3133] rounded-xl shadow-sm flex flex-col items-center justify-center relative overflow-hidden min-h-[500px]">

          {/* Grid decoration */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(rgba(180,197,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(180,197,255,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

          <div className="relative z-10 max-w-sm w-full p-8 flex flex-col items-center text-center">

            {/* Gemma icon */}
            <div className={`w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-6 ${submitting ? 'ai-pulse' : ''}`}>
              <span className="material-symbols-outlined text-[#b4c5ff]" style={{ fontSize: '36px', fontVariationSettings: "'FILL' 1" }}>
                memory
              </span>
            </div>

            {/* Idle state */}
            {!submitting && !submitted && (
              <>
                <h2 className="text-lg font-semibold text-[#eff1f3] mb-2">Gemma 4 Ready</h2>
                <p className="text-sm text-[#c3c6d7] leading-relaxed mb-6">
                  Submit your report to trigger the AI intelligence pipeline.
                </p>
                <div className="w-full bg-white/5 rounded-xl border border-white/10 p-4 flex flex-col gap-3">
                  {PIPELINE_STEPS.map((step) => (
                    <div key={step.key} className="flex items-center gap-3 opacity-35">
                      <span className="material-symbols-outlined text-[#b4c5ff]" style={{ fontSize: '18px' }}>{step.icon}</span>
                      <span className="font-mono text-xs text-[#eff1f3]">{step.label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Processing state */}
            {submitting && !submitted && (
              <>
                <h2 className="text-lg font-semibold text-[#eff1f3] mb-2">Processing…</h2>
                <p className="text-sm text-[#c3c6d7] mb-5">Extracting intelligence from your report.</p>
                <div className="w-full bg-white/5 rounded-xl border border-white/10 p-4 flex flex-col gap-3 mb-5">
                  {PIPELINE_STEPS.map((step, i) => {
                    const isDone = completedSteps.includes(i);
                    const isActive = activeStep === i;
                    return (
                      <div key={step.key} className={`flex items-center gap-3 transition-opacity ${isDone || isActive ? 'opacity-100' : 'opacity-30'}`}>
                        {isDone
                          ? <span className="material-symbols-outlined text-[#b4c5ff]" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          : isActive
                          ? <div className="w-4 h-4 rounded-full border-2 border-[#b4c5ff] border-t-transparent animate-spin flex-shrink-0" />
                          : <span className="material-symbols-outlined text-[#737686]" style={{ fontSize: '18px' }}>radio_button_unchecked</span>
                        }
                        <span className={`font-mono text-xs ${isDone || isActive ? 'text-[#eff1f3]' : 'text-[#737686]'}`}>{step.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div ref={streamRef} className="w-full h-24 overflow-hidden text-left opacity-25" style={{ maskImage: 'linear-gradient(to bottom, black 60%, transparent)' }}>
                  <div className="font-mono text-[10px] text-[#b4c5ff] leading-relaxed tracking-wider space-y-0.5">
                    {streamLines.map((line, i) => <div key={i}>{line}</div>)}
                  </div>
                </div>
              </>
            )}

            {/* Success state */}
            {submitted && (
              <>
                <div className="w-14 h-14 rounded-full bg-[#004ac6]/20 border border-[#004ac6]/40 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[#b4c5ff]" style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <h2 className="text-lg font-semibold text-[#eff1f3] mb-2">Report Submitted!</h2>
                <p className="text-sm text-[#c3c6d7] mb-5 leading-relaxed">
                  Queued for AI processing. The intelligence pipeline is running in the background.
                </p>
                <div className="flex flex-col gap-2 w-full">
                  <button
                    onClick={() => navigate('/')}
                    className="w-full bg-[#004ac6] hover:bg-[#003ea8] text-white text-sm font-semibold rounded-lg h-10 flex items-center justify-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>dashboard</span>
                    View Dashboard
                  </button>
                  {resultIncidentId && (
                    <button
                      onClick={() => navigate(`/incidents/${resultIncidentId}`)}
                      className="w-full bg-white/10 hover:bg-white/20 text-[#eff1f3] text-sm font-semibold rounded-lg h-10 flex items-center justify-center gap-2 transition-colors border border-white/20"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                      View Incident
                    </button>
                  )}
                  <button onClick={handleReset} className="text-xs text-[#c3c6d7] hover:text-[#eff1f3] transition-colors mt-1">
                    Submit another report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
