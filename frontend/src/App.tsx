import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createTicket } from './api/client';
import { TicketComposer } from './components/TicketComposer';
import { ChatView } from './components/ChatView';
import type { Ticket, TicketDraft } from './types/ticket';

type Theme = 'dark' | 'light';

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => localStorage.getItem('ai-support-theme') === 'light' ? 'light' : 'dark');
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('ai-support-theme', theme);
  }, [theme]);

  const submitTicket = async (draft: TicketDraft) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      setActiveTicket(await createTicket(draft));
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Не удалось создать обращение');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 transition-colors duration-200 dark:bg-[#0B0C10] dark:text-gray-100">
      <main>
        <AnimatePresence mode="wait" initial={false}>
          {activeTicket ? (
            <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
              <ChatView key={activeTicket.id} ticket={activeTicket} theme={theme} onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} onNewTicket={() => setActiveTicket(null)} onTicketUpdate={setActiveTicket} />
            </motion.div>
          ) : (
            <motion.div key="composer" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.99 }} transition={{ duration: 0.2 }}>
              <TicketComposer theme={theme} onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} onSubmit={submitTicket} isSubmitting={isSubmitting} submitError={submitError} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
