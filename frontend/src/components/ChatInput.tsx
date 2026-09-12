import { useEffect, useRef, useState } from 'react';
import { CornerDownLeft, FileText, Paperclip, Send, Smile, X } from 'lucide-react';
import type { Attachment } from '../types/ticket';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (text: string, attachments?: Attachment[]) => void;
  disabled?: boolean;
}

const QUICK_PHRASES = ['Покажи подробнее', 'Какие логи прислать?', 'Подключить оператора'];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [text]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      const nextAttachments = Array.from(event.target.files).map((file, index) => ({
        id: `chat-att-${Date.now()}-${index}`,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type || 'application/octet-stream',
      }));
      setAttachments((current) => [...current, ...nextAttachments]);
    }
    event.target.value = '';
  };

  const submit = () => {
    if (disabled || (!text.trim() && !attachments.length)) return;
    onSendMessage(text.trim() || 'Прикрепил файлы для диагностики.', attachments.length ? attachments : undefined);
    setText('');
    setAttachments([]);
    setMenuOpen(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-[#161722] dark:shadow-black/30">
      {menuOpen && (
        <div className="absolute bottom-[calc(100%+8px)] left-3 z-10 flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#1E202E]">
          {QUICK_PHRASES.map((phrase) => (
            <button key={phrase} type="button" onClick={() => { setText(phrase); setMenuOpen(false); textareaRef.current?.focus(); }} className="rounded-lg px-3 py-2 text-left text-xs text-slate-600 transition hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-white/5">{phrase}</button>
          ))}
        </div>
      )}

      {attachments.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-2 border-b border-slate-100 pb-2.5 dark:border-white/5">
          {attachments.map((file) => (
            <span key={file.id} className="flex max-w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
              <FileText className="h-3.5 w-3.5 shrink-0 text-indigo-500" aria-hidden="true" />
              <span className="max-w-40 truncate font-mono text-[11px]">{file.name}</span>
              <button type="button" onClick={() => setAttachments((current) => current.filter((item) => item.id !== file.id))} aria-label={`Удалить ${file.name}`} className="ml-1 text-slate-400 transition hover:text-rose-500"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-1 sm:gap-2">
        <input ref={fileInputRef} type="file" multiple className="sr-only" onChange={handleFileChange} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={disabled} aria-label="Прикрепить файл" className="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-500 disabled:opacity-40 dark:hover:bg-white/5 dark:hover:text-indigo-400"><Paperclip className="h-4 w-4" /></button>
        <button type="button" onClick={() => setMenuOpen((current) => !current)} disabled={disabled} aria-label="Быстрые действия" aria-expanded={menuOpen} className="hidden shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-500 disabled:opacity-40 dark:hover:bg-white/5 dark:hover:text-indigo-400 sm:block"><Smile className="h-4 w-4" /></button>
        <textarea ref={textareaRef} rows={1} value={text} onChange={(event) => setText(event.target.value)} onKeyDown={handleKeyDown} disabled={disabled} placeholder={disabled ? 'AI формирует ответ...' : 'Напиши ответ или уточнение...'} aria-label="Сообщение" className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-5 text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60 dark:text-gray-100 dark:placeholder:text-gray-500" />
        <button type="submit" disabled={disabled || (!text.trim() && !attachments.length)} aria-label="Отправить сообщение" className="shrink-0 rounded-xl bg-indigo-600 p-2.5 text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-30"><Send className="h-4 w-4" /></button>
      </div>

      <div className="mt-2 flex items-center justify-between px-1 font-mono text-[10px] text-slate-400 dark:text-gray-500">
        <span className="flex items-center gap-1"><CornerDownLeft className="h-3 w-3" />Enter отправить · Shift+Enter новая строка</span>
        <span className="hidden text-indigo-500/80 sm:inline">AI ассистент онлайн</span>
      </div>
    </form>
  );
}
