import { describe, it, expect } from 'vitest';
import { generateAiResponse, generateFollowUpResponse, streamAiResponse } from './mockAi';
import type { Ticket } from '../types/ticket';

describe('mockAi engine', () => {
  const sampleTicket: Ticket = {
    id: '3f1f7f72-9145-4f67-8a68-6e2ad15d5f31',
    number: 'TK-1001',
    title: 'Не работает API запрос к сервису',
    category: 'technical',
    priority: 'high',
    description: 'Ошибка 500 при отправке POST /v1/chat',
    createdAt: new Date(),
    status: 'ai_processing',
    attachments: [
      { id: 'att-1', name: 'error_log.txt', size: '12 KB', type: 'text/plain' }
    ]
  };

  it('generates technical answer with diagnostics and steps for technical category', () => {
    const response = generateAiResponse(sampleTicket);
    expect(response).toContain('TK-1001');
    expect(response).toContain('POST /v1/chat');
    expect(response.length).toBeGreaterThan(100);
  });

  it('streams response in chunks and completes', async () => {
    const chunks: string[] = [];
    let isFinished = false;

    await new Promise<void>((resolve) => {
      streamAiResponse(
        'Короткий тестовый ответ для проверки стриминга.',
        (chunk) => chunks.push(chunk),
        () => {
          isFinished = true;
          resolve();
        },
        5
      );
    });

    expect(isFinished).toBe(true);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join('')).toBe('Короткий тестовый ответ для проверки стриминга.');
  });

  it('uses ticket context in follow-up responses', () => {
    const response = generateFollowUpResponse(sampleTicket, 'Какие логи прислать по этой ошибке?');

    expect(response).toContain('TK-1001');
    expect(response).toContain('x-request-id');
  });
});
