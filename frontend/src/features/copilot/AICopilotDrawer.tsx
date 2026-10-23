'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Zap,
  ShieldAlert,
  FileText,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Search,
  Scale
} from 'lucide-react';
import { queryCopilot } from '../../lib/api';
import { CopilotResponse, CopilotAction } from '../../types';

interface Message {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  responseMeta?: CopilotResponse;
  timestamp: string;
}

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
  onSelectAccount: (accountId: string) => void;
  activeTab?: string;
  focusedAccountId?: string;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onSelectAccount,
  activeTab,
  focusedAccountId,
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedActionId, setCopiedActionId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'copilot',
      text: `### 🛡️ Welcome to FraudTrace AI Cyber Copilot

I provide **instant, 100% grounded investigation intelligence** extracted directly from live police FIR records, suspect accounts, NCRP 1930 tickets, and the **Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023**.

#### ⚡ Quick Inquiries you can run:
* **"Tell me about the electricity bill phishing case (FIR 89/2026)"**
* **"Who is accused Manoj Kumar Mandal and where was he arrested?"**
* **"What is the pass-through ratio and risk score of ACC-4321?"**
* **"Draft a Section 106 BNSS debit freeze notice for SBI"**
* **"How much total money has been recovered across all solved cases?"**`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (customQuery?: string) => {
    const textToSend = (customQuery || query).trim();
    if (!textToSend || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setQuery('');
    setIsLoading(true);

    try {
      const response = await queryCopilot(textToSend, {
        active_tab: activeTab,
        focused_account_id: focusedAccountId,
      });

      const copilotMsg: Message = {
        id: `copilot-${Date.now()}`,
        sender: 'copilot',
        text: response.answer,
        responseMeta: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'copilot',
        text: `⚠️ **Investigation Query Error:** ${err.message || 'Unable to connect to AI Copilot engine.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (action: CopilotAction, actionKey: string) => {
    if (action.action_type === 'open_account') {
      onSelectAccount(action.payload);
      onSelectTab('network');
    } else if (action.action_type === 'open_tab') {
      onSelectTab(action.payload);
    } else if (action.action_type === 'open_case') {
      onSelectTab('solved-cases');
    } else if (action.action_type === 'copy_legal_notice') {
      navigator.clipboard.writeText(action.payload);
      setCopiedActionId(actionKey);
      setTimeout(() => setCopiedActionId(null), 2500);
    }
  };

  const quickPrompts = [
    { label: '⚡ Electricity Phish (FIR 89)', query: 'Tell me the story of the Electricity Bill Phishing case (FIR 89/2026)' },
    { label: '👤 Accused Manoj Mandal', query: 'Who is accused Manoj Kumar Mandal and what was seized?' },
    { label: '🔍 Audit Mule ACC-4321', query: 'What is the risk score and pass through ratio of ACC-4321?' },
    { label: '⚖️ Section 106 BNSS Notice', query: 'Draft a Section 106 BNSS debit freeze notice for State Bank of India' },
    { label: '💰 Total Funds Recovered', query: 'How many cases have been solved and how much total money recovered?' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[540px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-wide">FraudTrace AI Copilot</h3>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Grounded Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">CCSU & NCRP Investigation Intelligence</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setMessages([messages[0]])}
            title="Clear Chat History"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2.5 bg-slate-950/50 border-b border-slate-800/80 overflow-x-auto flex space-x-2 scrollbar-thin">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p.query)}
            disabled={isLoading}
            className="whitespace-nowrap px-3 py-1 rounded-full bg-slate-800/80 hover:bg-blue-600 hover:text-white text-slate-300 text-[11px] font-medium border border-slate-700/60 transition flex items-center space-x-1 shrink-0"
          >
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isCopilot = m.sender === 'copilot';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isCopilot ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[95%] rounded-2xl p-4 text-xs leading-relaxed ${
                  isCopilot
                    ? 'bg-slate-800/90 text-slate-200 border border-slate-700 shadow-md'
                    : 'bg-blue-600 text-white font-medium shadow-md'
                }`}
              >
                {/* Markdown text formatted rendering */}
                <div className="space-y-2 whitespace-pre-wrap font-sans">
                  {m.text}
                </div>

                {/* Copilot Ground Truth Metadata & Performance */}
                {isCopilot && m.responseMeta && (
                  <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                    <div className="flex items-center gap-1.5 font-mono text-emerald-400">
                      <Zap className="w-3 h-3" />
                      <span>{m.responseMeta.response_time_ms}ms</span>
                      <span>•</span>
                      <span>Confidence: {Math.round(m.responseMeta.confidence * 100)}%</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {m.responseMeta.ground_truth_sources.map((src, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 text-[9px]"
                        >
                          {src}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interactive Action Buttons */}
                {isCopilot && m.responseMeta?.suggested_actions && m.responseMeta.suggested_actions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex flex-wrap gap-2">
                    {m.responseMeta.suggested_actions.map((action, i) => {
                      const actionKey = `${m.id}-${i}`;
                      const isCopied = copiedActionId === actionKey;
                      const isLegal = action.action_type === 'copy_legal_notice';

                      return (
                        <button
                          key={i}
                          onClick={() => handleAction(action, actionKey)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center space-x-1.5 transition shadow-sm ${
                            isLegal
                              ? isCopied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-amber-600/90 hover:bg-amber-500 text-white'
                              : 'bg-blue-600 hover:bg-blue-500 text-white'
                          }`}
                        >
                          {isLegal ? (
                            isCopied ? <Check className="w-3.5 h-3.5" /> : <Scale className="w-3.5 h-3.5" />
                          ) : (
                            <ExternalLink className="w-3.5 h-3.5" />
                          )}
                          <span>{isCopied ? 'Notice Copied!' : action.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs w-max animate-pulse">
            <Bot className="w-4 h-4 text-blue-400 animate-spin" />
            <span>Consulting FIR records, graph topology & Section 106 BNSS...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 bg-slate-950/90 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about cases, accused profiles, accounts, or Section 106 BNSS..."
            disabled={isLoading}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3.5 pr-12 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="absolute right-1.5 p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 mt-2">
          <span>Official Police Grounded AI • Zero Hallucination Mode</span>
          <span>Shortcut: <strong>Ctrl+J</strong></span>
        </div>
      </div>
    </div>
  );
};
