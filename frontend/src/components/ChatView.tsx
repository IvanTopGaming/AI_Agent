import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Clock3, FileText, Moon, PanelRight, Plus, ShieldCheck, Sparkles, Sun } from 'lucide-react';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import { CategoryBadge, PriorityBadge } from './Badge';
import { CATEGORIES, generateAiResponse, generateFollowUpResponse, streamAiResponse } from '../utils/mockAi';
import type { Attachment, ChatMessage as ChatMessageType, Ticket } from '../types/ticket';

interface ChatViewProps {
  ticket: Ticket;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onNewTicket: () => void;
  onTicketUpdate: (ticket: Ticket) => void;
}

const STATUS_LABELS: Record<Ticket['status'], string> = {
  open: 'Открыто',
  ai_processing: 'Обрабатывается AI',
  ai_answered: 'AI ответил',
  resolved: 'Решено',
  escalated: 'Ожидает оператора',
};

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function TicketDetails({ ticket }: { ticket: Ticket }) {
  const category = CATEGORIES.find((item) => item.id === ticket.category);

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-gray-500">Обращение</p>
        <p className="text-sm font-medium leading-5 text-slate-900 dark:text-white">{ticket.title}</p>
        <p className="mt-2 font-mono text-xs text-indigo-600 dark:text-indigo-400">#{ticket.number}</p>
        <p className="mt-1 break-all font-mono text-[9px] leading-4 text-slate-400 dark:text-gray-600">UUID {ticket.id}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-gray-500">Статус</p>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"><ShieldCheck className="h-3.5 w-3.5" />{STATUS_LABELS[ticket.status]}</span>
        </div>
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-gray-500">Создано</p>
          <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-gray-300"><Clock3 className="h-3.5 w-3.5 text-slate-400" />{ticket.createdAt.toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-gray-500">Параметры</p>
        <div className="flex flex-wrap gap-2"><CategoryBadge category={ticket.category} /><PriorityBadge priority={ticket.priority} /></div>
        {category && <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-gray-400">{category.description}</p>}
      </div>
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-gray-500">Исходное описание</p>
        <p className="text-xs leading-5 text-slate-600 dark:text-gray-300">{ticket.description}</p>
      </div>
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-gray-500">Вложения · {ticket.attachments?.length ?? 0}</p>
        {ticket.attachments?.length ? <div className="space-y-2">{ticket.attachments.map((file) => <div key={file.id} className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/5 dark:bg-white/5"><FileText className="h-3.5 w-3.5 shrink-0 text-indigo-500" /><span className="min-w-0 flex-1 truncate font-mono text-[10px] text-slate-600 dark:text-gray-300">{file.name}</span><span className="text-[10px] text-slate-400 dark:text-gray-500">{file.size}</span></div>)}</div> : <p className="text-xs text-slate-400 dark:text-gray-500">Файлы не прикреплены</p>}
      </div>
    </div>
  );
}

export function ChatView({ ticket, theme, onToggleTheme, onNewTicket, onTicketUpdate }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>(() => [{
    id: `ticket-${ticket.id}`,
    sender: 'user',
    content: `${ticket.title}\n\n${ticket.description}`,
    timestamp: ticket.createdAt,
    isInitialTicket: true,
    ticketMeta: {
      id: ticket.id,
      number: ticket.number,
      category: ticket.category,
      priority: ticket.priority,
      attachments: ticket.attachments,
    },
  }]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cancelStreamRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const aiMessageId = createId('ai');
    let completed = false;
    setMessages((current) => [...current, { id: aiMessageId, sender: 'ai', content: '', timestamp: new Date(), isStreaming: true }]);
    setIsStreaming(true);

    const timeoutId = window.setTimeout(() => {
      cancelStreamRef.current = streamAiResponse(
        generateAiResponse(ticket),
        (chunk) => setMessages((current) => current.map((message) => message.id === aiMessageId ? { ...message, content: message.content + chunk } : message)),
        () => {
          completed = true;
          setMessages((current) => current.map((message) => message.id === aiMessageId ? { ...message, isStreaming: false } : message));
          setIsStreaming(false);
          onTicketUpdate({ ...ticket, status: 'ai_answered' });
        },
      );
    }, 450);

    return () => {
      window.clearTimeout(timeoutId);
      cancelStreamRef.current?.();
      if (!completed) setMessages((current) => current.filter((message) => message.id !== aiMessageId));
    };
  }, [ticket.id]);

  const sendMessage = (text: string, attachments?: Attachment[]) => {
    if (isStreaming) return;
    const userMessage: ChatMessageType = { id: createId('user'), sender: 'user', content: text, timestamp: new Date(), attachments };
    const aiMessageId = createId('ai');
    const aiMessage: ChatMessageType = { id: aiMessageId, sender: 'ai', content: '', timestamp: new Date(), isStreaming: true };
    setMessages((current) => [...current, userMessage, aiMessage]);
    setIsStreaming(true);

    let nextStatus = ticket.status;
    if (text.toLocaleLowerCase('ru-RU').includes('оператор')) nextStatus = 'escalated';
    if (text.toLocaleLowerCase('ru-RU').includes('решение помогло')) nextStatus = 'resolved';
    if (nextStatus !== ticket.status) onTicketUpdate({ ...ticket, status: nextStatus });

    cancelStreamRef.current = streamAiResponse(
      generateFollowUpResponse(ticket, text),
      (chunk) => setMessages((current) => current.map((message) => message.id === aiMessageId ? { ...message, content: message.content + chunk } : message)),
      () => {
        setMessages((current) => current.map((message) => message.id === aiMessageId ? { ...message, isStreaming: false } : message));
        setIsStreaming(false);
      },
    );
  };

  return (
    <section className="grid h-[100dvh] min-h-0 w-full grid-cols-1 overflow-hidden lg:min-h-[560px] lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="flex min-h-0 min-w-0 flex-col">
        <div className="border-b border-slate-200 bg-white/70 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-[#0B0C10]/70 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"><Sparkles className="h-3.5 w-3.5" /></span><span className="text-xs font-medium text-slate-500 dark:text-gray-400">Диалог с AI-поддержкой</span></div>
              <h1 className="mt-1 truncate text-sm font-semibold text-slate-950 dark:text-white sm:text-base">{ticket.title}</h1>
            </div>
            <div className="flex shrink-0 items-center gap-1 lg:hidden"><button type="button" onClick={onNewTicket} aria-label="Новое обращение" className="rounded-lg border border-indigo-200 bg-indigo-50 p-2 text-indigo-600 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-100 active:scale-95 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25"><Plus className="h-3.5 w-3.5" /></button><button type="button" onClick={onToggleTheme} aria-label="Сменить тему" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">{theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-indigo-500" />}</button><button type="button" onClick={() => setDetailsOpen((current) => !current)} aria-label="Параметры чата" aria-expanded={detailsOpen} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"><PanelRight className="h-3.5 w-3.5" />{detailsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</button></div>
          </div>
          <AnimatePresence initial={false}>
            {detailsOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden lg:hidden"><div className="mt-4 border-t border-slate-200 pt-4 dark:border-white/10"><TicketDetails ticket={ticket} /></div></motion.div>}
          </AnimatePresence>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6 lg:px-8">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div key={message.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
                <ChatMessage message={message} showActions={!isStreaming && index === messages.length - 1 && message.sender === 'ai'} onActionClick={sendMessage} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent px-4 pb-4 pt-3 dark:from-[#0B0C10] dark:via-[#0B0C10] sm:px-6 sm:pb-6 lg:px-8">
          <ChatInput onSendMessage={sendMessage} disabled={isStreaming} />
        </div>
      </div>

      <aside className="hidden overflow-y-auto border-l border-slate-200 bg-white px-6 py-7 dark:border-white/10 dark:bg-[#12131B] lg:block">
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-white/10"><div className="flex items-center gap-2"><PanelRight className="h-4 w-4 text-indigo-500" /><h2 className="text-sm font-semibold text-slate-900 dark:text-white">Параметры чата</h2></div><div className="flex items-center gap-1"><button type="button" onClick={onNewTicket} className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-2 text-xs font-medium text-indigo-600 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-100 active:scale-95 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25"><Plus className="h-3.5 w-3.5" />Новое</button><button type="button" onClick={onToggleTheme} aria-label="Сменить тему" className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5">{theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}</button></div></div>
        <TicketDetails ticket={ticket} />
      </aside>
    </section>
  );
}
