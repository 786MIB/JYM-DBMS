import React, { useState } from 'react';
import { translations } from '../translations';
import { Sparkles, BrainCircuit, AlertCircle, RefreshCw, GraduationCap, ScrollText, CheckCircle2 } from 'lucide-react';
import { StaffRole } from '../types';

interface GeminiAIProps {
  activeRole: StaffRole;
  lang: 'en' | 'ur';
}

export const GeminiAISummary: React.FC<GeminiAIProps> = ({ activeRole, lang }) => {
  const [report, setReport] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const generateReport = async () => {
    setLoading(true);
    setError('');
    setReport('');

    try {
      const res = await fetch('/api/reports/generate-ai-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lang }),
      });

      if (!res.ok) {
        throw new Error('API server returned status failure on AI generation.');
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setReport(data.report || 'No content returned from AI analyzer.');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to complete server-side analysis. Check server environment keys.');
    } finally {
      setLoading(false);
    }
  };

  // Custom Inline Markdown parser for stunning Playfair/Emerald output matching our design principles
  const renderParsedReport = (rawText: string) => {
    if (!rawText) return null;

    const lines = rawText.split('\n');
    let inList = false;
    const listItems: string[] = [];
    const elements: React.ReactNode[] = [];

    const flushList = (keyIdx: number) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${keyIdx}`} className="space-y-2.5 my-4 pl-4 border-l-2 border-emerald-500 bg-emerald-50/10 p-3.5 rounded-r-lg">
            {listItems.map((item, idX) => (
              <li key={`li-${idX}`} className="text-xs text-slate-700 leading-relaxed flex items-start gap-2">
                <span className="text-emerald-700 font-bold shrink-0 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
        listItems.length = 0; // empty Array
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Heading 2: `## Title`
      if (trimmed.startsWith('## ')) {
        flushList(index);
        inList = false;
        const text = trimmed.slice(3).replace(/\*\*/g, '');
        elements.push(
          <h3 key={index} className="text-base font-serif font-bold text-emerald-800 border-b border-emerald-100 pb-2.5 mt-6 mb-3 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 shrink-0 text-emerald-600" />
            {text}
          </h3>
        );
      } 
      // Heading 3: `### Title` or `* Title` if used as bullet heading
      else if (trimmed.startsWith('### ')) {
        flushList(index);
        inList = false;
        const text = trimmed.slice(4).replace(/\*\*/g, '');
        elements.push(
          <h4 key={index} className="text-xs font-bold text-slate-700 font-mono uppercase tracking-wider mt-4 mb-2">
            {text}
          </h4>
        );
      }
      // Bullet Items: `* Item` or `- Item`
      else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        inList = true;
        const text = trimmed.slice(2);
        
        // Inline bold format `**text**` handles inside bullets
        const parsedTextParts = parseBoldText(text);
        listItems.push(parsedTextParts as any);
      }
      // Standard Text Paragraphs
      else if (trimmed.length > 0) {
        flushList(index);
        inList = false;
        const parsedParagraph = parseBoldText(trimmed);
        elements.push(
          <p key={index} className="text-xs text-slate-600 leading-relaxed my-3">
            {parsedParagraph}
          </p>
        );
      } else {
        flushList(index);
        inList = false;
      }
    });

    // Flush any trailing lists
    flushList(lines.length + 99);

    return <div className="space-y-1 font-sans">{elements}</div>;
  };

  // Helper utility to parse standard bold `**text**` strings correctly
  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    if (parts.length === 1) return text;
    
    return parts.map((part, index) => {
      // Every odd index is inside the double stars
      if (index % 2 === 1) {
        return <strong key={index} className="font-bold text-slate-900">{part}</strong>;
      }
      return part;
    });
  };

  const hasAccess = activeRole === 'Admin' || activeRole === 'Finance' || activeRole === 'Teacher';

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-6 animate-fade-in" id="gemini-ai-summary-portal" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      
      {/* Upper banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-serif font-bold text-slate-800 flex items-center gap-1.5">
            <BrainCircuit className="w-5 h-5 text-emerald-700 font-extrabold shrink-0" />
            {translations[lang].gemini}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {translations[lang].geminiSubtitle || "Leverage Google GenAI server-side intelligence to critique financial trends, syllabus pacing, and attendance compliance."}
          </p>
        </div>
        
        {hasAccess && !loading && (
          <button
            id="trigger-ai-report-btn"
            onClick={generateReport}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            {translations[lang].generateReport || "Generate Real-Time Report"}
          </button>
        )}
      </div>

      {/* Role access check */}
      {!hasAccess && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-800 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-bold">{translations[lang].accessLevelRestricted || "Access Level Restricted"}</p>
            <p className="mt-1 leading-relaxed">
              {translations[lang].activeSessionRestriction} <strong>{translations[lang][activeRole] || activeRole}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Loading state reassurance screen */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto animate-pulse" id="loading-report-screen">
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 relative">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <Sparkles className="w-4 h-4 absolute top-2 right-2 text-emerald-600 animate-bounce" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 font-serif">Compiling Register Logs...</h4>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Connecting safely via process SECRETS to Google Gemini models. Analyzing cohort metrics, active curriculum syllabus rates, and outstanding financial pending balances.
            </p>
            <div className="bg-emerald-50 border border-emerald-100/50 text-emerald-800 text-[10px] p-2 rounded mt-4">
              "Allah will raise those who have believed among you and those who were given knowledge, by degrees."
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl space-y-2 text-rose-800 text-xs flex gap-3 items-start" id="report-error-block">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-bold">Report Compile Failure</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Render generated report markdown styled container */}
      {report && !loading && (
        <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 shadow-xs space-y-4 max-w-4xl mx-auto" id="report-output-canvas">
          
          {/* Header watermark */}
          <div className="flex justify-between items-center bg-white p-4 border border-slate-100 rounded-lg shadow-2xs">
            <div className="flex items-center gap-2">
              <ScrollText className="w-4.5 h-4.5 text-emerald-700" />
              <div>
                <span className="text-[9px] uppercase font-mono text-slate-400 tracking-wider">Automated Summary ID</span>
                <h5 className="text-[11px] font-bold font-mono text-slate-800">AN-AI-REPV.{new Date().getFullYear()}.{new Date().getMonth()+1}</h5>
              </div>
            </div>

            <div className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 rounded font-bold text-[10px] font-mono border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5" /> APPROVED BY AI ANALYST
            </div>
          </div>

          <div className="bg-white p-6 border border-slate-150 rounded-xl shadow-xs leading-relaxed prose">
            {renderParsedReport(report)}
          </div>

          <div className="text-center text-[10px] text-slate-400 font-mono italic">
            This analytics assessment was compiled server-side on port 3000 using the Gemini 3.5 Flash Model using direct database register feeds.
          </div>

        </div>
      )}

      {/* Initial state instruction */}
      {!report && !loading && !error && hasAccess && (
        <div className="py-12 border border-slate-100/80 bg-slate-50/50 rounded-xl text-center space-y-4 flex flex-col items-center justify-center">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100/50">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="max-w-xs space-y-1">
            <h4 className="text-sm font-semibold font-serif text-slate-700">Ready to audit academy health?</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Upon clicking the button, Gemini will safely parse our students lists, dues rosters, and curriculum coverages to yield recommendations suitable for school directors.
            </p>
          </div>
          <button
            onClick={generateReport}
            className="flex items-center gap-1.5 px-4.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            Perform Analysis Cycle
          </button>
        </div>
      )}

    </div>
  );
};
