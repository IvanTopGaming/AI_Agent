import { Sparkles, Sun, Moon, Plus, ShieldCheck } from 'lucide-react';
import type { Ticket } from '../types/ticket';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  activeTicket: Ticket | null;
  onNewTicket: () => void;
}

export function Header({
  theme,
  onToggleTheme,
  activeTicket,
  onNewTicket,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/80 backdrop-blur-xl transition-colors duration-200 dark:border-white/10 dark:bg-[#0B0C10]/80">
      <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white sm:text-base">
                AI Support
              </span>
              <span className="rounded border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/20 dark:text-indigo-300">
                AI ACTIVE
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400/90">Нейросеть на связи</span>
            </div>
          </div>
        </div>

        {activeTicket && (
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-100/80 px-3 py-1.5 font-mono text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 md:flex">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">#{activeTicket.number}</span>
            <span className="h-1 w-1 rounded-full bg-slate-400 dark:bg-gray-600" />
            <span className="max-w-[180px] truncate text-slate-700 dark:text-gray-200">{activeTicket.title}</span>
            <span className="h-1 w-1 rounded-full bg-slate-400 dark:bg-gray-600" />
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> В работе
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {activeTicket && (
            <button
              type="button"
              onClick={onNewTicket}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
              title="Создать новое обращение"
            >
              <Plus className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" aria-hidden="true" />
              <span className="hidden sm:inline">Новое обращение</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Сменить тему оформления"
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100"
            title={theme === 'dark' ? 'Включить светлую тему' : 'Включить темную тему'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-500" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
