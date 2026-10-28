'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePdm } from '@/lib/store';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Cpu, 
  RotateCcw, 
  ChevronRight, 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle,
  Maximize2,
  Minimize2
} from 'lucide-react';

export function AeroCopilot() {
  const { 
    isChatbotOpen, 
    setIsChatbotOpen, 
    chatMessages, 
    sendChatMessage, 
    clearChatMessages, 
    selectedEngine, 
    currentTelemetryPoint,
    setActiveScreen
  } = usePdm();

  const [inputVal, setInputVal] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatbotOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatbotOpen]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;
    sendChatMessage(inputVal.trim());
    setInputVal('');
  };

  const handleChipClick = (promptText: string) => {
    sendChatMessage(promptText);
  };

  const currentRul = currentTelemetryPoint?.predictedRul ?? selectedEngine?.predictedRul ?? 50;
  const currentStatus = currentTelemetryPoint?.status ?? selectedEngine?.status ?? 'NOMINAL';

  return (
    <>
      {/* Floating Launcher Button */}
      {!isChatbotOpen && (
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xl shadow-cyan-950/60 border border-cyan-400/40 hover:scale-105 active:scale-95 transition-all group"
        >
          <div className="relative">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          </div>
          <span className="text-xs font-bold tracking-wide">AeroCopilot AI</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/80 border border-cyan-400/30 text-cyan-200 font-mono">
            FD001
          </span>
        </button>
      )}

      {/* Slide-Over AI Drawer */}
      {isChatbotOpen && (
        <div className={`fixed bottom-4 right-4 z-50 flex flex-col rounded-2xl bg-slate-950/95 border border-slate-800 backdrop-blur-xl shadow-2xl shadow-cyan-950/40 transition-all duration-300 ${
          isExpanded ? 'w-[92vw] sm:w-[650px] h-[85vh]' : 'w-[92vw] sm:w-[460px] h-[620px]'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80 rounded-t-2xl">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center border border-cyan-300/30 shadow-md shadow-cyan-900/40">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-xs font-bold tracking-wider text-slate-100 uppercase">
                    AeroCopilot Advisor
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  C-MAPSS Gas-Path Diagnostics &amp; Airworthiness Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 text-slate-400">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={clearChatMessages}
                className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                title="Reset Session"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsChatbotOpen(false)}
                className="p-1.5 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Close Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Context Bar */}
          <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center space-x-2 text-slate-300">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>Unit #{selectedEngine?.unitId ?? 1} ({selectedEngine?.aircraftModel ?? 'B777-200ER'})</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                currentStatus === 'CRITICAL'
                  ? 'bg-red-950 text-red-300 border border-red-800'
                  : currentStatus === 'WARNING'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                RUL: {currentRul}c ({currentStatus})
              </span>
            </div>
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[88%] p-3.5 rounded-xl border leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-100 rounded-br-none'
                    : 'bg-slate-900/90 border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                }`}>
                  {/* Format message lines */}
                  <div className="space-y-1.5">
                    {msg.content.split('\n\n').map((paragraph, pIdx) => {
                      if (paragraph.startsWith('### ')) {
                        return (
                          <h4 key={pIdx} className="font-bold text-cyan-300 text-xs mt-1 border-b border-slate-800 pb-1">
                            {paragraph.replace('### ', '')}
                          </h4>
                        );
                      }
                      if (paragraph.startsWith('#### ')) {
                        return (
                          <h5 key={pIdx} className="font-semibold text-slate-100 text-[11px]">
                            {paragraph.replace('#### ', '')}
                          </h5>
                        );
                      }
                      return (
                        <p key={pIdx} className="text-slate-300 whitespace-pre-line leading-relaxed">
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>

                  {/* Timestamp */}
                  <div className="mt-2 text-[9px] text-slate-500 font-mono text-right">
                    {msg.timestamp}
                  </div>
                </div>

                {/* Suggested Action Chips (if any) */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[88%]">
                    {msg.suggestedActions.map((action, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => handleChipClick(action)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-cyan-400 hover:bg-cyan-950/60 hover:border-cyan-700 transition-all font-mono"
                      >
                        <span>{action}</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Bar */}
          <div className="px-3 py-1.5 bg-slate-900/60 border-t border-slate-800/80 flex items-center space-x-1.5 overflow-x-auto text-[10px]">
            <span className="text-slate-500 font-mono shrink-0">Quick:</span>
            {[
              `Diagnose Unit #${selectedEngine?.unitId ?? 1}`,
              'Why is Ps30 the top sensor?',
              'Explain NASA Asymmetric Loss',
              'Parts staging recommendation',
            ].map((chip, cIdx) => (
              <button
                key={cIdx}
                onClick={() => handleChipClick(chip)}
                className="shrink-0 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950 rounded-b-2xl flex items-center space-x-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={`Ask AeroCopilot about Unit #${selectedEngine?.unitId ?? 1} or C-MAPSS fleet...`}
              className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="p-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white disabled:opacity-40 disabled:hover:scale-100 hover:scale-105 active:scale-95 transition-all shadow-md shadow-cyan-950/50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
