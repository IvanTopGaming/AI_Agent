import type { CategoryId, Priority } from '../types/ticket';

export const CATEGORIES = [
  { id: 'technical' as CategoryId, label: 'Техническая проблема', description: 'Сбои сервиса, ошибки в работе API, 500/502' },
  { id: 'billing' as CategoryId, label: 'Оплата и тарифы', description: 'Списание средств, баланс, счета и подписка' },
  { id: 'bug' as CategoryId, label: 'Баг в интерфейсе', description: 'Проблемы с отображением, кнопками или версткой' },
  { id: 'integration' as CategoryId, label: 'Интеграция / Webhook', description: 'Настройка вебхуков, ключи доступа и SDK' },
  { id: 'general' as CategoryId, label: 'Общий вопрос', description: 'Консультация по возможностям и помощь' },
];

export const PRIORITIES: Priority[] = [
  { id: 'low', label: 'Низкий', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 border-emerald-500/20' },
  { id: 'medium', label: 'Средний', color: 'text-blue-400', badgeBg: 'bg-blue-500/10 border-blue-500/20' },
  { id: 'high', label: 'Высокий', color: 'text-amber-400', badgeBg: 'bg-amber-500/10 border-amber-500/20' },
  { id: 'urgent', label: 'Критический', color: 'text-rose-400', badgeBg: 'bg-rose-500/10 border-rose-500/20' },
];
