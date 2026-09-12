import { CATEGORIES, PRIORITIES } from '../data/supportOptions';
import type { CategoryId, PriorityId } from '../types/ticket';

interface BadgeProps {
  size?: 'sm' | 'md';
}

interface PriorityBadgeProps extends BadgeProps {
  priority: PriorityId;
}

interface CategoryBadgeProps extends BadgeProps {
  category: CategoryId;
}

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const meta = PRIORITIES.find((item) => item.id === priority) ?? PRIORITIES[1];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${meta.badgeBg} ${meta.color} ${sizeClasses}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.color.replace('text-', 'bg-')}`} />
      {meta.label}
    </span>
  );
}

export function CategoryBadge({ category, size = 'md' }: CategoryBadgeProps) {
  const meta = CATEGORIES.find((item) => item.id === category);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 font-medium text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300 ${sizeClasses}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
      {meta?.label ?? category}
    </span>
  );
}
