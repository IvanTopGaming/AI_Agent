export type CategoryId = 'technical' | 'billing' | 'bug' | 'integration' | 'general';

export interface Category {
  id: CategoryId;
  label: string;
  description: string;
  iconName: string;
}

export type PriorityId = 'low' | 'medium' | 'high' | 'urgent';

export interface Priority {
  id: PriorityId;
  label: string;
  color: string;
  badgeBg: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
}

export interface Ticket {
  id: string;
  number: string;
  title: string;
  category: CategoryId;
  priority: PriorityId;
  description: string;
  createdAt: Date;
  status: 'open' | 'ai_processing' | 'ai_answered' | 'resolved' | 'escalated';
  attachments?: Attachment[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  isInitialTicket?: boolean;
  ticketMeta?: {
    id: string;
    number: string;
    category: CategoryId;
    priority: PriorityId;
    attachments?: Attachment[];
  };
  isStreaming?: boolean;
  attachments?: Attachment[];
  codeSnippet?: {
    language: string;
    code: string;
  };
  actionSuggestions?: string[];
}
