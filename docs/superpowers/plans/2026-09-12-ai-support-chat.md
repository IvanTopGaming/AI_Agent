# AI Support Chat & Ticket Composer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a minimalist, Linear/Claude-styled user support ticket creation screen with seamless animated transition into an interactive AI chat featuring live streaming responses, dark/light themes, and real-time browser preview.

**Architecture:** A Vite + React 19 + TypeScript + Tailwind CSS application. The application state transitions seamlessly between the `TicketComposer` view and the `ChatView`. A realistic AI simulation engine generates contextual responses with word-by-word streaming based on ticket category and priority.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, Vitest.

**Spec:** [2026-09-12-ai-support-chat-design.md](file:///home/itg/Documents/AI_Agent_Frontend/docs/superpowers/specs/2026-09-12-ai-support-chat-design.md)

## Global Constraints
- Minimalist Linear/Claude aesthetic (clean typography, subtle borders, dark theme by default, light theme switchable).
- Real-time dev server running throughout execution so changes are immediately visible.
- TypeScript strict mode with zero type errors (`tsc --noEmit`).
- Fast, accessible keyboard shortcuts (`Cmd/Ctrl + Enter` to submit).

---

### Task 1: Scaffolding, Tailwind Setup & Live Dev Server

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `postcss.config.js`, `tailwind.config.js`, `src/index.css`, `src/main.tsx`, `src/App.tsx`
- Test: Build verification via `npm run build`

**Interfaces:**
- Consumes: None
- Produces: Running Vite dev server on local port and working React build

- [ ] **Step 1: Create package.json with dependencies**

```json
{
  "name": "ai-support-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "framer-motion": "^12.4.7",
    "lucide-react": "^1.16.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^3.0.1"
  },
  "devDependencies": {
    "@types/node": "^22.13.4",
    "@types/react": "^19.0.8",
    "@types/react-dom": "^19.0.3",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.2",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "vite": "^6.1.0",
    "vitest": "^3.0.5"
  }
}
```

- [ ] **Step 2: Configure Vite, TypeScript, Tailwind, PostCSS and Index HTML**

Create standard configs:
- `vite.config.ts` with React plugin
- `tsconfig.json` & `tsconfig.node.json`
- `tailwind.config.js` with `darkMode: 'class'`, custom colors (`#0B0C10`, `#161722`, `#1E202E`, `#6366F1`)
- `postcss.config.js`
- `index.html` with viewport and title "AI Support • Helpdesk & Neural Chat"
- `src/index.css` with `@tailwind base; @tailwind components; @tailwind utilities;` and custom scrollbar styling.

- [ ] **Step 3: Install dependencies and verify build**

Run: `npm install` and verify `npm run build`.

- [ ] **Step 4: Launch persistent Vite dev server in background**

Run: `npx vite --host 0.0.0.0 --port 5173` as a background task.
Verify: Confirm server is listening and URL is accessible to the user.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: scaffold Vite, React, Tailwind, and dev server"
```

---

### Task 2: Domain Models & Smart AI Simulation Engine

**Files:**
- Create: `src/types/ticket.ts`
- Create: `src/utils/mockAi.ts`
- Test: `src/utils/mockAi.test.ts`

**Interfaces:**
- Consumes: None
- Produces: `Ticket`, `Category`, `Priority`, `ChatMessage`, `Attachment` types; `generateAiResponse(ticket: Ticket): Promise<string>` and streaming helper `streamAiResponse(fullText: string, onChunk: (text: string) => void, onDone: () => void): () => void`

- [ ] **Step 1: Write failing test for mockAi response generation**

```typescript
import { describe, it, expect } from 'vitest';
import { generateAiResponse } from './mockAi';
import { Ticket } from '../types/ticket';

describe('generateAiResponse', () => {
  it('generates technical answer with steps for technical category', () => {
    const ticket: Ticket = {
      id: 'TK-1001',
      title: 'Не работает API запрос',
      category: 'technical',
      priority: 'high',
      description: 'Ошибка 500 при отправке POST /v1/chat',
      createdAt: new Date(),
      status: 'ai_processing',
    };
    const response = generateAiResponse(ticket);
    expect(response).toContain('TK-1001');
    expect(response).toContain('POST /v1/chat');
    expect(response.length).toBeGreaterThan(100);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run src/utils/mockAi.test.ts`
Expected: FAIL (modules not found)

- [ ] **Step 3: Implement `src/types/ticket.ts` and `src/utils/mockAi.ts`**

Define strong types and rich realistic AI response templates with code blocks, Markdown-like checklists, and diagnostic suggestions.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/mockAi.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/ticket.ts src/utils/mockAi.ts src/utils/mockAi.test.ts
git commit -m "feat: domain models and mock AI response generator with tests"
```

---

### Task 3: Layout, Navigation Header & Theme Switcher

**Files:**
- Create: `src/components/Header.tsx`
- Modify: `src/App.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `Ticket` from `src/types/ticket.ts`
- Produces: `Header` component with logo, active AI badge, theme switcher (dark/light), active ticket pill, and "Новое обращение" reset button.

- [ ] **Step 1: Create Header component with theme state**

Build `src/components/Header.tsx`:
- Logo with Sparkles icon and "AI Support" branding.
- Live status indicator dot (pulsing emerald "Нейросеть на связи").
- Theme toggle with Sun/Moon icons, persisting in `localStorage` and toggling `dark` class on `document.documentElement`.
- "Новое обращение" action button when active in chat view to reset or return.

- [ ] **Step 2: Connect Header to App.tsx with dark mode default**

Set up theme management in `App.tsx` and verify dark/light mode toggle works seamlessly.

- [ ] **Step 3: Verify build and visual appearance**

Run: `npm run build`
Check HMR updates in the live dev server.

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.tsx src/App.tsx src/index.css
git commit -m "feat: layout header with live status and dark/light theme switch"
```

---

### Task 4: Ticket Composer Component (Экран составления обращения)

**Files:**
- Create: `src/components/TicketComposer.tsx`
- Create: `src/components/Badge.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `Ticket`, `Category`, `Priority` from `src/types/ticket.ts`
- Produces: `TicketComposer` component taking `onSubmit: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'status'>) => void`

- [ ] **Step 1: Create Badge component for categories and priorities**

Build reusable badges with subtle colors, dot indicators, and active/inactive states.

- [ ] **Step 2: Implement TicketComposer component**

Build `src/components/TicketComposer.tsx`:
- Quick suggestion chips: "Ошибка 500 при вызове API", "Не приходит код двухфакторной аутентификации", "Ошибка в балансе / счете", "Замедление ответа вебхуков". Clicking one auto-fills the subject and sets category.
- Subject input with character counter and placeholder.
- Category pills with icons (Wrench, CreditCard, Bug, HelpCircle).
- Priority radio buttons (Низкий, Средний, Высокий, Критический) with distinct visual badges.
- Auto-expanding multiline description textarea.
- File attachment dropzone mock (allows selecting mock files or dragging, shows uploaded file tags with remove button).
- Hotkey hint badge (`Cmd/Ctrl + Enter`).
- Form validation: visual warning when trying to submit without title or description.

- [ ] **Step 3: Connect TicketComposer to App.tsx**

Integrate into `App.tsx` state so submitting updates state to the new ticket.

- [ ] **Step 4: Verify build and test form interactions**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/components/Badge.tsx src/components/TicketComposer.tsx src/App.tsx
git commit -m "feat: ticket composer screen with quick chips, priority and validation"
```

---

### Task 5: Interactive AI Chat View with Streaming & Actions

**Files:**
- Create: `src/components/ChatView.tsx`
- Create: `src/components/ChatMessage.tsx`
- Create: `src/components/ChatInput.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `Ticket`, `ChatMessage` from `src/types/ticket.ts`, `mockAi.ts`
- Produces: Fully interactive AI chat view with streaming response, action chips, code copy, and message input.

- [ ] **Step 1: Build ChatMessage component**

- Renders user message (ticket summary card for first message with tags, priority, attachments).
- Renders AI message:
  - Bot avatar with subtle glow.
  - Markdown-style code blocks with syntax styling and "Копировать" button.
  - Typing indicator (animated pulsing dots while generating).
  - Feedback buttons (👍 / 👎 / "Скопировано").
  - Quick action chips: "Решение помогло ✅", "Позвать человека-оператора 👤", "Уточнить детали 💬".

- [ ] **Step 2: Build ChatInput component**

- Bottom sticky bar with auto-resizing textarea.
- Attach file button, emoji/action menu trigger, send button.
- Handles `Enter` to submit and `Shift+Enter` for new lines.

- [ ] **Step 3: Build ChatView component & integrate Framer Motion**

- Top summary bar showing ticket ID `#TK-8492`, status pill "Обрабатывается AI", category, and expand/collapse details.
- Message history list with smooth auto-scroll to bottom on incoming stream tokens.
- Trigger AI streaming upon ticket creation using `streamAiResponse`.
- Allow user to send follow-up questions and receive simulated contextual AI replies.

- [ ] **Step 4: Connect smooth transitions in App.tsx**

Wrap views in Framer Motion `AnimatePresence` for smooth transition when moving from composer to chat.

- [ ] **Step 5: Verify build & tests**

Run: `npm run build` and `npm run test`.

- [ ] **Step 6: Commit**

```bash
git add src/components/ChatMessage.tsx src/components/ChatInput.tsx src/components/ChatView.tsx src/App.tsx
git commit -m "feat: interactive AI chat view with streaming, quick actions and code blocks"
```

---

### Task 6: Final Polish, Responsiveness & Verification

**Files:**
- Modify: `src/App.tsx`, `src/index.css`, `src/components/*`
- Test: Full end-to-end user journey verification

- [ ] **Step 1: Test mobile and desktop responsive layout**
Verify all screens adapt cleanly to narrow screens (mobile view) and large monitors.

- [ ] **Step 2: Test full lifecycle flow**
1. Fill form with custom data / click quick chips.
2. Add attachment mock.
3. Submit with `Ctrl+Enter`.
4. Observe animated morphing into Chat View.
5. Watch AI stream response token-by-token.
6. Click "Уточнить детали" or type follow-up message.
7. Click theme switch (dark/light mode).
8. Click "Новое обращение" and confirm return to composer.

- [ ] **Step 3: Run final test suite & build check**
Run: `npm run test && npm run build`.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete AI support chat and ticket composer UI"
```
