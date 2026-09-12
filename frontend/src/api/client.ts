import type { Attachment, ChatMessage, Ticket, TicketDraft } from '../types/ticket';

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

interface ApiAttachment {
  id: string;
  name: string;
  contentType: string;
  sizeBytes: number;
  downloadUrl: string;
}

interface ApiTicket {
  id: string;
  number: string;
  title: string;
  description: string;
  category: Ticket['category'];
  priority: Ticket['priority'];
  status: Ticket['status'];
  createdAt: string;
  updatedAt: string;
  attachments: ApiAttachment[];
}

interface ApiMessage {
  id: string;
  ticketId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  format: 'plain' | 'markdown';
  createdAt: string;
  attachments: ApiAttachment[];
}

interface ErrorResponse {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string>;
    requestId?: string;
  };
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly code?: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) {
    let error: ErrorResponse | null = null;
    try {
      error = await response.json() as ErrorResponse;
    } catch {
      error = null;
    }
    throw new ApiError(error?.error?.message ?? `Ошибка запроса (${response.status})`, response.status, error?.error?.code);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function mapTicket(ticket: ApiTicket): Ticket {
  return {
    ...ticket,
    createdAt: new Date(ticket.createdAt),
    updatedAt: new Date(ticket.updatedAt),
    attachments: ticket.attachments ?? [],
  };
}

function mapMessage(message: ApiMessage): ChatMessage {
  return {
    id: message.id,
    sender: message.role === 'assistant' ? 'ai' : message.role,
    content: message.content,
    timestamp: new Date(message.createdAt),
    attachments: message.attachments ?? [],
  };
}

export async function uploadAttachment(file: File): Promise<Attachment> {
  const body = new FormData();
  body.append('file', file);
  const response = await request<{ attachment: ApiAttachment }>('/api/v1/attachments', { method: 'POST', body });
  return response.attachment;
}

export async function createTicket(draft: TicketDraft): Promise<Ticket> {
  const attachments = await Promise.all(draft.files.map(uploadAttachment));
  const response = await request<{ ticket: ApiTicket }>('/api/v1/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: draft.title,
      description: draft.description,
      category: draft.category,
      priority: draft.priority,
      attachmentIds: attachments.map((attachment) => attachment.id),
    }),
  });
  return mapTicket(response.ticket);
}

export async function getMessages(ticketId: string): Promise<ChatMessage[]> {
  const response = await request<{ items: ApiMessage[] }>(`/api/v1/tickets/${ticketId}/messages?limit=100`);
  return response.items.map(mapMessage);
}

export async function sendMessage(ticketId: string, content: string, files: File[]): Promise<ChatMessage> {
  const attachments = await Promise.all(files.map(uploadAttachment));
  const response = await request<{ message: ApiMessage }>(`/api/v1/tickets/${ticketId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, attachmentIds: attachments.map((attachment) => attachment.id) }),
  });
  return mapMessage(response.message);
}

export async function updateTicketStatus(ticketId: string, status: 'resolved' | 'escalated'): Promise<Ticket> {
  const response = await request<{ ticket: ApiTicket }>(`/api/v1/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return mapTicket(response.ticket);
}

export async function sendFeedback(messageId: string, rating: 'positive' | 'negative'): Promise<void> {
  await request<void>(`/api/v1/messages/${messageId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating }),
  });
}

export function ticketEventsUrl(ticketId: string): string {
  return `${API_URL}/api/v1/tickets/${ticketId}/events`;
}
