import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bug,
  CornerDownLeft,
  CreditCard,
  FileText,
  HelpCircle,
  Paperclip,
  Moon,
  Sparkles,
  Sun,
  Webhook,
  Wrench,
  X,
} from 'lucide-react';
import { CATEGORIES, PRIORITIES } from '../data/supportOptions';
import type { CategoryId, PendingAttachment, PriorityId, TicketDraft } from '../types/ticket';
import type { ChangeEvent, ComponentType, DragEvent, FormEvent, KeyboardEvent } from 'react';

interface TicketComposerProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSubmit: (ticket: TicketDraft) => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}

interface QuickTemplate {
  label: string;
  title: string;
  category: CategoryId;
  description: string;
}

const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    label: 'Ошибка 500 при вызове API',
    title: 'Ошибка 500 при вызове API',
    category: 'technical',
    description: 'При отправке POST /v1/chat сервер возвращает 500 Internal Server Error. Ошибка воспроизводится на каждом запросе.',
  },
  {
    label: 'Не приходит код двухфакторной аутентификации',
    title: 'Не приходит код двухфакторной аутентификации',
    category: 'general',
    description: 'После входа код двухфакторной аутентификации не приходит ни по SMS, ни на резервную почту. Повторная отправка не помогает.',
  },
  {
    label: 'Ошибка в балансе / счете',
    title: 'Ошибка в балансе / счете',
    category: 'billing',
    description: 'Баланс в личном кабинете не совпадает с последним счетом. Нужна проверка начислений и проведенных операций.',
  },
  {
    label: 'Замедление ответа вебхуков',
    title: 'Замедление ответа вебхуков',
    category: 'integration',
    description: 'События вебхуков начали приходить с задержкой более пяти минут. Endpoint отвечает HTTP 200 без задержек.',
  },
];

const CATEGORY_ICONS: Record<CategoryId, ComponentType<{ className?: string }>> = {
  technical: Wrench,
  billing: CreditCard,
  bug: Bug,
  integration: Webhook,
  general: HelpCircle,
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function filesToAttachments(files: FileList | File[]) {
  return Array.from(files).map((file, index) => ({
    id: `att-${Date.now()}-${index}`,
    name: file.name,
    sizeBytes: file.size,
    contentType: file.type || 'application/octet-stream',
    file,
  }));
}

export function TicketComposer({ theme, onToggleTheme, onSubmit, isSubmitting = false, submitError }: TicketComposerProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryId>('technical');
  const [priority, setPriority] = useState<PriorityId>('medium');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 132), 320)}px`;
  }, [description]);

  const addFiles = (files: FileList | File[]) => {
    setAttachments((current) => [...current, ...filesToAttachments(files)]);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) addFiles(event.target.files);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
  };

  const submit = () => {
    const nextErrors = {
      title: title.trim() ? undefined : 'Укажи краткую тему обращения',
      description: description.trim() ? undefined : 'Опиши детали проблемы или вопроса',
    };
    setErrors(nextErrors);
    if (nextErrors.title || nextErrors.description) return;

    onSubmit({
      title: title.trim(),
      category,
      priority,
      description: description.trim(),
      files: attachments.map((attachment) => attachment.file),
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="grid min-h-[100dvh] w-full grid-cols-1 lg:h-[100dvh] lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_390px]" noValidate>
      <section className="order-2 flex min-h-[620px] min-w-0 flex-col lg:order-1 lg:min-h-0">
        <div className="border-b border-slate-200 bg-white/70 px-4 py-4 dark:border-white/10 dark:bg-[#0B0C10]/70 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20"><Sparkles className="h-4 w-4" /></span>
            <div><h1 className="text-base font-semibold text-slate-950 dark:text-white">Новый диалог с поддержкой</h1><p className="text-xs text-slate-500 dark:text-gray-400">AI изучит сообщение и сразу предложит решение</p></div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex max-w-4xl items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"><Sparkles className="h-4 w-4" /></span>
            <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm dark:border-white/10 dark:bg-[#161722] dark:text-gray-200 sm:p-5">
              <p className="font-medium text-slate-900 dark:text-white">Чем могу помочь?</p>
              <p className="mt-1 text-slate-500 dark:text-gray-400">Опиши проблему своими словами или выбери один из частых сценариев.</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 pl-0 sm:pl-11">
            {QUICK_TEMPLATES.map((template) => (
              <button key={template.label} type="button" onClick={() => { setTitle(template.title); setCategory(template.category); setDescription(template.description); setErrors({}); }} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300">{template.label}</button>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent px-4 pb-4 pt-3 dark:from-[#0B0C10] dark:via-[#0B0C10] sm:px-6 sm:pb-6 lg:px-8">
          <div className={`rounded-2xl border bg-white p-3 shadow-2xl shadow-slate-300/30 dark:bg-[#161722] dark:shadow-black/30 ${errors.description ? 'border-rose-500' : 'border-slate-200 dark:border-white/10'}`}>
            <textarea ref={textareaRef} id="ticket-description" value={description} onChange={(event) => { setDescription(event.target.value); if (errors.description) setErrors((current) => ({ ...current, description: undefined })); }} placeholder="Опиши проблему, приложи текст ошибки и шаги воспроизведения..." aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'ticket-description-error' : undefined} className="max-h-80 min-h-[120px] w-full resize-none overflow-y-auto bg-transparent px-2 py-2 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 dark:text-gray-100 dark:placeholder:text-gray-500" />
            {errors.description && <p id="ticket-description-error" className="mb-2 flex items-center gap-1 px-2 text-xs text-rose-500"><AlertCircle className="h-3.5 w-3.5" />{errors.description}</p>}
            {attachments.length > 0 && <div className="mb-3 flex flex-wrap gap-2 border-t border-slate-100 px-2 pt-3 dark:border-white/5">{attachments.map((file) => <span key={file.id} className="flex max-w-full items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600 dark:bg-white/5 dark:text-gray-300"><FileText className="h-3.5 w-3.5 text-indigo-500" /><span className="max-w-40 truncate font-mono">{file.name}</span><span className="text-slate-400">{formatFileSize(file.sizeBytes)}</span><button type="button" onClick={() => setAttachments((current) => current.filter((item) => item.id !== file.id))} aria-label={`Удалить ${file.name}`} className="text-slate-400 hover:text-rose-500"><X className="h-3 w-3" /></button></span>)}</div>}
            {submitError && <p className="mb-2 flex items-center gap-1 px-2 text-xs text-rose-500"><AlertCircle className="h-3.5 w-3.5" />{submitError}</p>}
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-1 pt-3 dark:border-white/5">
              <div className="flex items-center gap-2"><button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Прикрепить файл" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-500 dark:hover:bg-white/5"><Paperclip className="h-4 w-4" /></button><span className="hidden items-center gap-1 font-mono text-[10px] text-slate-400 sm:flex"><CornerDownLeft className="h-3 w-3" />Ctrl / Cmd + Enter</span></div>
              <div className="flex items-center gap-3"><span className="hidden font-mono text-[10px] text-slate-400 sm:inline">{description.length} знаков</span><button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-medium text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60">{isSubmitting ? 'Создаём...' : 'Начать диалог'}<ArrowRight className="h-4 w-4" /></button></div>
            </div>
          </div>
        </div>
      </section>

      <aside className="order-1 border-b border-slate-200 bg-white px-4 py-6 dark:border-white/10 dark:bg-[#12131B] sm:px-6 lg:order-2 lg:overflow-y-auto lg:border-b-0 lg:border-l lg:px-6 lg:py-7">
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-white/10"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-500" /><div><h2 className="text-sm font-semibold text-slate-900 dark:text-white">Параметры чата</h2><p className="mt-0.5 text-[11px] text-slate-400 dark:text-gray-500">Контекст для точного ответа</p></div></div><button type="button" onClick={onToggleTheme} aria-label="Сменить тему" className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5">{theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}</button></div>
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between"><label htmlFor="ticket-title" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-gray-400">Тема <span className="text-rose-500">*</span></label><span className="font-mono text-[10px] text-slate-400">{title.length}/100</span></div>
            <input id="ticket-title" value={title} maxLength={100} onChange={(event) => { setTitle(event.target.value); if (errors.title) setErrors((current) => ({ ...current, title: undefined })); }} placeholder="Кратко о проблеме" aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'ticket-title-error' : undefined} className={`w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/30 dark:bg-[#1E202E] dark:text-gray-100 ${errors.title ? 'border-rose-500' : 'border-slate-200 focus:border-indigo-500 dark:border-white/10'}`} />
            {errors.title && <p id="ticket-title-error" className="mt-1.5 flex items-center gap-1 text-xs text-rose-500"><AlertCircle className="h-3.5 w-3.5" />{errors.title}</p>}
          </div>

          <fieldset>
            <legend className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-gray-400">Категория</legend>
            <div className="space-y-1.5">{CATEGORIES.map((item) => { const Icon = CATEGORY_ICONS[item.id]; const selected = category === item.id; return <button key={item.id} type="button" onClick={() => setCategory(item.id)} aria-pressed={selected} className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition ${selected ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-white/5 dark:bg-[#1E202E] dark:text-gray-400 dark:hover:border-white/20'}`}><Icon className={`h-4 w-4 ${selected ? 'text-indigo-500' : 'text-slate-400 dark:text-gray-500'}`} />{item.label}</button>; })}</div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-gray-400">Приоритет</legend>
            <div className="grid grid-cols-2 gap-2">{PRIORITIES.map((item) => { const selected = priority === item.id; return <button key={item.id} type="button" onClick={() => setPriority(item.id)} aria-pressed={selected} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-medium transition ${selected ? `${item.badgeBg} ${item.color}` : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/5 dark:bg-[#1E202E] dark:text-gray-400'}`}>{item.label}<span className={`h-2 w-2 rounded-full ${item.color.replace('text-', 'bg-')}`} /></button>; })}</div>
          </fieldset>

          <div>
            <div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-gray-400">Файлы</span><span className="font-mono text-[10px] text-slate-400">{attachments.length}</span></div>
            <input ref={fileInputRef} type="file" multiple className="sr-only" onChange={handleFileChange} />
            <div onClick={() => fileInputRef.current?.click()} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') fileInputRef.current?.click(); }} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} role="button" tabIndex={0} className={`rounded-xl border border-dashed p-4 text-center outline-none transition focus:ring-2 focus:ring-indigo-500/30 ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-300 bg-slate-50 hover:border-indigo-400 dark:border-white/10 dark:bg-[#1E202E]/60'}`}><Paperclip className="mx-auto mb-2 h-4 w-4 text-indigo-500" /><p className="text-[11px] leading-4 text-slate-500 dark:text-gray-400">Перетащи логи или скриншоты</p></div>
          </div>
        </div>
      </aside>
    </form>
  );
}
