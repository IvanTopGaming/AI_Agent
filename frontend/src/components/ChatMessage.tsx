import { useState } from 'react';
import { Bot, Check, Clock, Copy, FileText, Sparkles, ThumbsDown, ThumbsUp, User } from 'lucide-react';
import { CategoryBadge, PriorityBadge } from './Badge';
import type { ChatMessage as ChatMessageType } from '../types/ticket';
import type { ReactNode } from 'react';

interface ChatMessageProps {
  message: ChatMessageType;
  onActionClick?: (action: string) => void;
  showActions?: boolean;
}

function InlineText({ children }: { children: string }) {
  const parts = children.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index} className="font-semibold text-slate-950 dark:text-white">{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-indigo-700 dark:bg-white/10 dark:text-indigo-300">{part.slice(1, -1)}</code>;
    return part;
  });
}

export function ChatMessage({ message, onActionClick, showActions = false }: ChatMessageProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [messageCopied, setMessageCopied] = useState(false);
  const [feedback, setFeedback] = useState<'liked' | 'disliked' | null>(null);

  const copyText = async (text: string, index?: number) => {
    await navigator.clipboard.writeText(text);
    if (index === undefined) {
      setMessageCopied(true);
      window.setTimeout(() => setMessageCopied(false), 1800);
    } else {
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1800);
    }
  };

  const renderText = (text: string): ReactNode => {
    return text.split('\n').map((line, index) => {
      if (!line) return <span key={index} className="block h-2" />;
      if (line.startsWith('### ')) return <strong key={index} className="mt-3 block text-sm font-semibold text-slate-950 dark:text-white"><InlineText>{line.slice(4)}</InlineText></strong>;
      if (/^\d+\. /.test(line)) return <span key={index} className="block pl-1"><InlineText>{line}</InlineText></span>;
      if (line.startsWith('- ') || line.startsWith('* ')) return <span key={index} className="flex gap-2 pl-1"><span className="text-indigo-500">•</span><span><InlineText>{line.slice(2)}</InlineText></span></span>;
      return <span key={index} className="block"><InlineText>{line}</InlineText></span>;
    });
  };

  const renderFormattedContent = (text: string) => {
    return text.split(/(```[\s\S]*?```)/g).map((part, index) => {
      if (!part.startsWith('```')) return <span key={index}>{renderText(part)}</span>;
      const lines = part.slice(3, -3).trim().split('\n');
      const language = /^[a-zA-Z0-9_-]+$/.test(lines[0] ?? '') ? lines[0] : '';
      const code = (language ? lines.slice(1) : lines).join('\n');
      return (
        <div key={index} className="my-3 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 text-gray-100">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-gray-400">{language || 'code'}</span>
            <button type="button" onClick={() => void copyText(code, index)} className="flex items-center gap-1 text-[11px] text-gray-400 transition hover:text-white">
              {copiedIndex === index ? <><Check className="h-3.5 w-3.5 text-emerald-400" />Скопировано</> : <><Copy className="h-3.5 w-3.5" />Копировать</>}
            </button>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-xs leading-5 text-indigo-200"><code>{code}</code></pre>
        </div>
      );
    });
  };

  if (message.isInitialTicket && message.ticketMeta) {
    return (
      <article className="flex w-full justify-end py-3">
        <div className="w-full max-w-3xl rounded-2xl rounded-tr-sm border border-indigo-200 bg-indigo-50 p-4 shadow-sm dark:border-indigo-500/20 dark:bg-indigo-500/10 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3 dark:border-indigo-500/10">
            <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">#{message.ticketMeta.number}</span><CategoryBadge category={message.ticketMeta.category} size="sm" /><PriorityBadge priority={message.ticketMeta.priority} size="sm" /></div>
            <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-gray-500"><Clock className="h-3 w-3" />{message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-gray-200">{message.content}</p>
          {message.ticketMeta.attachments?.length ? <div className="mt-4 flex flex-wrap gap-2 border-t border-indigo-100 pt-3 dark:border-indigo-500/10">{message.ticketMeta.attachments.map((file) => <span key={file.id} className="flex items-center gap-1.5 rounded-md border border-indigo-100 bg-white/60 px-2.5 py-1 text-[11px] text-slate-600 dark:border-white/5 dark:bg-white/5 dark:text-gray-300"><FileText className="h-3 w-3 text-indigo-500" />{file.name}<span className="text-slate-400 dark:text-gray-500">{file.size}</span></span>)}</div> : null}
        </div>
      </article>
    );
  }

  if (message.sender === 'user') {
    return (
      <article className="flex w-full justify-end py-3">
        <div className="flex max-w-[92%] items-start gap-2.5 sm:max-w-3xl">
          <div className="rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-3 text-sm text-white shadow-md">
            <p className="whitespace-pre-wrap leading-6">{message.content}</p>
            {message.attachments?.length ? <div className="mt-2 flex flex-wrap gap-1.5 border-t border-white/15 pt-2">{message.attachments.map((file) => <span key={file.id} className="flex items-center gap-1 rounded bg-white/10 px-2 py-1 font-mono text-[10px]"><FileText className="h-3 w-3" />{file.name}</span>)}</div> : null}
            <p className="mt-1 text-right font-mono text-[10px] text-indigo-200/70">{message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-700 text-white"><User className="h-4 w-4" /></span>
        </div>
      </article>
    );
  }

  return (
    <article className="flex w-full justify-start py-3">
      <div className="flex w-full max-w-4xl items-start gap-3">
        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/20"><Bot className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm dark:border-white/10 dark:bg-[#161722] dark:text-gray-200 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-2 text-xs dark:border-white/5">
            <span className="flex items-center gap-1.5 font-medium text-indigo-600 dark:text-indigo-400"><Sparkles className="h-3.5 w-3.5" />AI-специалист</span>
            <span className="font-mono text-[10px] text-slate-400 dark:text-gray-500">{message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {message.isStreaming && !message.content ? (
            <div className="flex h-6 items-center gap-1" aria-label="AI печатает"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.3s]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.15s]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" /></div>
          ) : (
            <div className="leading-6">{renderFormattedContent(message.content)}{message.isStreaming && <span className="ml-1 inline-block h-4 w-1.5 animate-pulse bg-indigo-400 align-middle" />}</div>
          )}
          {!message.isStreaming && message.content && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-white/5">
              <div className="flex items-center gap-1 text-slate-400">
                <button type="button" onClick={() => setFeedback('liked')} aria-label="Ответ помог" className={`rounded-lg border p-1.5 transition ${feedback === 'liked' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500' : 'border-slate-200 hover:text-slate-700 dark:border-white/5 dark:hover:text-white'}`}><ThumbsUp className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => setFeedback('disliked')} aria-label="Ответ не помог" className={`rounded-lg border p-1.5 transition ${feedback === 'disliked' ? 'border-rose-500/30 bg-rose-500/10 text-rose-500' : 'border-slate-200 hover:text-slate-700 dark:border-white/5 dark:hover:text-white'}`}><ThumbsDown className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => void copyText(message.content)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] transition hover:text-slate-700 dark:border-white/5 dark:hover:text-white">{messageCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}{messageCopied ? 'Скопировано' : 'Копировать'}</button>
              </div>
              {showActions && onActionClick && <div className="flex flex-wrap gap-1.5"><button type="button" onClick={() => onActionClick('Решение помогло')} className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 transition hover:border-emerald-500/30 hover:text-emerald-600 dark:border-white/10 dark:text-gray-300">Решение помогло ✓</button><button type="button" onClick={() => onActionClick('Уточнить детали')} className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 transition hover:border-indigo-500/30 hover:text-indigo-600 dark:border-white/10 dark:text-gray-300">Уточнить детали</button><button type="button" onClick={() => onActionClick('Позвать человека-оператора')} className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 transition hover:border-amber-500/30 hover:text-amber-600 dark:border-white/10 dark:text-gray-300">Позвать оператора</button></div>}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
