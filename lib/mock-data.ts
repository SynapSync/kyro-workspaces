import type { Project, AgentActivity, Task, Sprint, TeamMember } from "./types";

const now = new Date().toISOString();
const hoursAgo = (h: number) =>
  new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
const daysAgo = (d: number) =>
  new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

// ─── Kyro Platform Tasks ───────────────────────────────────────────

const cleverTasks: Task[] = [
  {
    id: "task-1",
    title: "Set up project repository and CI/CD pipeline",
    description:
      "Initialize the Git repo, configure GitHub Actions for continuous integration, and set up deployment workflows.",
    priority: "high",
    status: "done",
    assignee: "Alex Chen",
    tags: ["devops", "setup"],
    createdAt: daysAgo(14),
    updatedAt: daysAgo(10),
  },
  {
    id: "task-2",
    title: "Design system tokens and component library",
    description:
      "Define color palette, typography scale, spacing, and core UI components for the design system.",
    priority: "high",
    status: "done",
    assignee: "Maya Patel",
    tags: ["design", "frontend"],
    createdAt: daysAgo(12),
    updatedAt: daysAgo(7),
  },
  {
    id: "task-3",
    title: "Implement user authentication flow",
    description:
      "Build sign up, sign in, password reset, and email verification using Supabase Auth.",
    priority: "urgent",
    status: "review",
    assignee: "Alex Chen",
    tags: ["auth", "backend"],
    createdAt: daysAgo(10),
    updatedAt: hoursAgo(4),
  },
  {
    id: "task-4",
    title: "Build dashboard layout and navigation",
    description:
      "Create the main application shell with sidebar navigation, top bar, and responsive layout.",
    priority: "high",
    status: "in_progress",
    assignee: "Maya Patel",
    tags: ["frontend", "layout"],
    createdAt: daysAgo(8),
    updatedAt: hoursAgo(2),
  },
  {
    id: "task-5",
    title: "Create Kanban board with drag-and-drop",
    description:
      "Implement the sprint board view with draggable task cards across status columns.",
    priority: "high",
    status: "in_progress",
    assignee: "Jordan Liu",
    tags: ["frontend", "feature"],
    createdAt: daysAgo(6),
    updatedAt: hoursAgo(1),
  },
  {
    id: "task-6",
    title: "Integrate AI agent for task suggestions",
    description:
      "Connect the AI agent service that can auto-create tasks, suggest priorities, and summarize sprints.",
    priority: "medium",
    status: "todo",
    assignee: "Alex Chen",
    tags: ["ai", "backend"],
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: "task-7",
    title: "Build markdown document editor",
    description:
      "Create a rich markdown editor with live preview for project documents and README.",
    priority: "medium",
    status: "todo",
    assignee: "Maya Patel",
    tags: ["frontend", "editor"],
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
  },
  {
    id: "task-8",
    title: "Add real-time collaboration features",
    description:
      "Implement WebSocket connections for live updates when team members modify tasks or documents.",
    priority: "low",
    status: "backlog",
    assignee: undefined,
    tags: ["feature", "backend"],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  {
    id: "task-9",
    title: "Create sprint analytics dashboard",
    description:
      "Build charts and metrics for sprint velocity, burndown, and team productivity.",
    priority: "low",
    status: "backlog",
    assignee: undefined,
    tags: ["analytics", "frontend"],
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: "task-10",
    title: "Set up automated testing suite",
    description:
      "Configure Jest and React Testing Library with tests for core components and API routes.",
    priority: "medium",
    status: "backlog",
    assignee: "Jordan Liu",
    tags: ["testing", "devops"],
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: "task-11",
    title: "Implement notification system",
    description:
      "Build in-app notifications for task assignments, mentions, and sprint updates.",
    priority: "medium",
    status: "todo",
    assignee: "Jordan Liu",
    tags: ["feature", "frontend"],
    createdAt: hoursAgo(20),
    updatedAt: hoursAgo(20),
  },
  {
    id: "task-12",
    title: "API rate limiting and security audit",
    description:
      "Add rate limiting to API endpoints and perform a security audit of the authentication system.",
    priority: "high",
    status: "todo",
    assignee: "Alex Chen",
    tags: ["security", "backend"],
    createdAt: hoursAgo(12),
    updatedAt: hoursAgo(12),
  },
];

// ─── Futures DCA Bot v2 Tasks ────────────────────────────────────────

const botTasks: Task[] = [
  {
    id: "bot-task-1",
    title: "Implement DrawdownMonitor with 4 zones",
    description:
      "Create DrawdownMonitor class that tracks equity curve, detects GREEN/YELLOW/RED/CRITICAL zones, and returns a size multiplier.",
    priority: "urgent",
    status: "done",
    assignee: "Sprint Forge",
    tags: ["risk-engine", "core"],
    createdAt: daysAgo(5),
    updatedAt: daysAgo(3),
  },
  {
    id: "bot-task-2",
    title: "Create CircuitBreaker with 3 breakers",
    description:
      "Consecutive losses pause (5 losses -> 4h pause), rolling WR floor (< 30% -> half size), funding rate gate.",
    priority: "urgent",
    status: "done",
    assignee: "Sprint Forge",
    tags: ["risk-engine", "circuit-breaker"],
    createdAt: daysAgo(5),
    updatedAt: daysAgo(3),
  },
  {
    id: "bot-task-3",
    title: "Implement Time Stop in TradeManager",
    description:
      "Close trades that exceed time_stop_hours with closeReason TIME_STOP. Evaluate before TP/SL.",
    priority: "high",
    status: "done",
    assignee: "Sprint Forge",
    tags: ["risk-engine", "time-stop"],
    createdAt: daysAgo(5),
    updatedAt: daysAgo(3),
  },
  {
    id: "bot-task-4",
    title: "Add atr_multiplier_short configuration",
    description:
      "Separate ATR multiplier for SHORT trades. Scalping: 1.5x, Swing: 2.0x. Backward compatible.",
    priority: "high",
    status: "done",
    assignee: "Sprint Forge",
    tags: ["short-sl", "config"],
    createdAt: daysAgo(4),
    updatedAt: daysAgo(2),
  },
  {
    id: "bot-task-5",
    title: "Fix swing profile TF override (D21)",
    description:
      "scripts/backtest.ts must read entry TF from active profile. Currently uses 5m instead of 15m for swing.",
    priority: "medium",
    status: "done",
    assignee: "Sprint Forge",
    tags: ["bugfix", "backtest"],
    createdAt: daysAgo(4),
    updatedAt: daysAgo(2),
  },
  {
    id: "bot-task-6",
    title: "Bear market backtest validation",
    description:
      "Run SOL + BTC + ETH backtests Oct 2025 - Feb 2026 with Risk Engine active. Target: maxDD < 20%.",
    priority: "high",
    status: "done",
    assignee: "Sprint Forge",
    tags: ["backtest", "validation"],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
  },
  {
    id: "bot-task-7",
    title: "Implement BotOrchestrator for live trading",
    description:
      "Wire up WebSocket feed, multi-pair loop, and state management for real-time trading.",
    priority: "urgent",
    status: "todo",
    assignee: undefined,
    tags: ["live-trading", "core"],
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: "bot-task-8",
    title: "SQLite persistence for trade state",
    description:
      "Trade state must survive process restarts. Implement SQLite storage layer.",
    priority: "high",
    status: "backlog",
    assignee: undefined,
    tags: ["persistence", "infrastructure"],
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: "bot-task-9",
    title: "Crypto Winter backtest (2022 data)",
    description:
      "Validate Risk Engine with drawdowns > 10% using 2022 crypto winter period.",
    priority: "medium",
    status: "backlog",
    assignee: undefined,
    tags: ["backtest", "risk-engine"],
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: "bot-task-10",
    title: "Telegram alerts integration",
    description:
      "Notifications for trade_open, trade_close, stop_loss, drawdown_red events.",
    priority: "low",
    status: "backlog",
    assignee: undefined,
    tags: ["notifications", "integration"],
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
];

// ─── Projects ────────────────────────────────────────────────────────

export const mockProjects: Project[] = [
  {
    id: "proj-1",
    name: "Clever Platform",
    description:
      "An AI-native project management platform with intelligent task automation, smart sprint planning, and collaborative document editing.",
    color: "bg-primary",
    readme: `# Clever Platform

Welcome to the **Clever Platform** - an AI-native project management tool built for modern development teams.

## Getting Started

1. Clone the repository
2. Install dependencies with \`pnpm install\`
3. Run the development server with \`pnpm dev\`

## Architecture

- **Frontend**: Next.js 16 with App Router
- **State Management**: Zustand
- **UI Components**: shadcn/ui + Radix
- **Drag & Drop**: dnd-kit
- **AI Integration**: Vercel AI SDK

## Features

- Kanban board with drag-and-drop
- Markdown document editor
- Sprint management with structured sections
- AI-powered task suggestions
- Real-time collaboration

## Contributing

Please read our contribution guidelines before submitting a pull request.
`,
    documents: [
      {
        id: "doc-1",
        title: "Architecture Decision Records",
        content: `# Architecture Decision Records

## ADR-001: Use Next.js App Router

**Status**: Accepted

**Context**: We need a modern React framework that supports server components, streaming, and has excellent DX.

**Decision**: Use Next.js 16 with App Router for the frontend.

**Consequences**: 
- Better performance with server components
- Simplified data fetching
- Built-in routing and layouts
`,
        createdAt: daysAgo(14),
        updatedAt: daysAgo(7),
      },
      {
        id: "doc-2",
        title: "API Design Guidelines",
        content: `# API Design Guidelines

## REST Conventions

- Use plural nouns for endpoints: \`/api/tasks\`, \`/api/sprints\`
- Use HTTP methods appropriately: GET, POST, PUT, DELETE
- Return consistent error responses

## Response Format

\`\`\`json
{
  "data": {},
  "meta": { "total": 100, "page": 1 }
}
\`\`\`

## Authentication

All API routes require a valid JWT token in the Authorization header.
`,
        createdAt: daysAgo(10),
        updatedAt: daysAgo(3),
      },
      {
        id: "doc-3",
        title: "Sprint Planning Guide",
        content: `# Sprint Planning Guide

## Before the Sprint

1. Review the product backlog
2. Identify high-priority items
3. Estimate task complexity

## During Planning

- Break epics into manageable tasks
- Assign owners to each task
- Set realistic sprint goals

## Definition of Done

- Code reviewed and approved
- Tests passing
- Documentation updated
- Deployed to staging
`,
        createdAt: daysAgo(5),
        updatedAt: daysAgo(1),
      },
    ],
    sprints: [
      {
        id: "sprint-1",
        name: "Foundation Sprint",
        status: "closed",
        startDate: daysAgo(14),
        endDate: daysAgo(7),
        tasks: cleverTasks.filter((t) => ["task-1", "task-2"].includes(t.id)),
        sections: {
          retrospective: `## What Went Well\n\n- Repository setup was clean and fast\n- Design system tokens defined early prevented inconsistencies\n\n## What Didn't Go Well\n\n- Took longer than expected to settle on component library\n\n## Surprises\n\n- shadcn/ui + Radix combination worked better than anticipated`,
          findings: `## Key Findings\n\n1. **shadcn/ui DX**: Component composition is excellent for rapid prototyping\n2. **Tailwind v4**: New @theme inline pattern simplifies token management`,
        },
      },
      {
        id: "sprint-2",
        name: "Core Features Sprint",
        status: "active",
        startDate: daysAgo(7),
        endDate: daysAgo(-7),
        tasks: cleverTasks.filter((t) =>
          [
            "task-3",
            "task-4",
            "task-5",
            "task-6",
            "task-7",
            "task-11",
            "task-12",
          ].includes(t.id),
        ),
      },
      {
        id: "sprint-3",
        name: "Polish & Scale Sprint",
        status: "planned",
        startDate: daysAgo(-7),
        endDate: daysAgo(-21),
        tasks: cleverTasks.filter((t) =>
          ["task-8", "task-9", "task-10"].includes(t.id),
        ),
      },
    ],
    createdAt: daysAgo(14),
    updatedAt: hoursAgo(2),
  },
  {
    id: "proj-2",
    name: "Futures DCA Bot v2",
    description:
      "Automated DCA futures trading bot with bidirectional S/R detection, risk engine, and multi-pair backtesting for SOL, BTC, and ETH.",
    color: "bg-emerald-500",
    readme: `# Futures DCA Bot v2

A sophisticated algorithmic trading bot for cryptocurrency futures using Dollar Cost Averaging (DCA) with intelligent risk management.

## Architecture

- **Language**: TypeScript (Node.js)
- **Exchange**: Binance Futures (REST + WebSocket)
- **Strategy**: DCA with S/R zone detection + multi-timeframe confirmation
- **Risk Engine**: DrawdownMonitor + CircuitBreaker + Time Stop

## Current Status

- Version: 0.4.0 (Sprint 4 completed)
- 305 tests passing
- Backtest validated on SOL, BTC, ETH (Oct 2025 - Feb 2026)

## Key Components

- \`SignalDetector\`: Multi-timeframe signal generation
- \`TradeManager\`: Position management with DCA tranches
- \`DrawdownMonitor\`: 4-zone equity curve protection
- \`CircuitBreaker\`: Consecutive loss, WR floor, funding rate gates
- \`StopLossCalculator\`: ATR-based with direction-specific multipliers
`,
    documents: [
      {
        id: "bot-doc-1",
        title: "F06 - Risk Engine Specification",
        content: `# F06: Risk Engine for Futures

## DrawdownMonitor

4 zones based on peak equity drawdown:
- **GREEN** (< 10%): Normal operation, multiplier 1.0
- **YELLOW** (10-20%): Half size, multiplier 0.5
- **RED** (20-30%): Quarter size, multiplier 0.25
- **CRITICAL** (> 30%): Stop all trading, multiplier 0.0

## Circuit Breakers

1. **Consecutive Losses**: 5 losses -> pause 4 hours
2. **Rolling Win Rate**: Last 20 trades < 30% WR -> half size
3. **Funding Rate**: Rate > threshold -> block new positions

## Integration

Both systems feed \`sizeMultiplier\` into \`SignalContext\`. Effective multiplier = min(DD multiplier, CB multiplier).
`,
        createdAt: daysAgo(10),
        updatedAt: daysAgo(3),
      },
      {
        id: "bot-doc-2",
        title: "Roadmap",
        content: `# Roadmap

## Completed
- Sprint 1: Core trading engine
- Sprint 2: DCA + real-data backtest
- Sprint 3: Bidirectional S/R + multi-pair
- Sprint 4: Risk Engine completo

## Next
- Sprint 5: Live Trading Wiring
- Sprint 6: Monitoring + Alerts
- Sprint 7: Portfolio optimization
`,
        createdAt: daysAgo(20),
        updatedAt: daysAgo(1),
      },
    ],
    sprints: [
      {
        id: "bot-sprint-3",
        name: "Sprint 3 - Bidirectional S/R",
        status: "closed",
        version: "0.3.0",
        startDate: daysAgo(20),
        endDate: daysAgo(6),
        objective:
          "Implement bidirectional trading with automatic S/R detection and multi-pair support.",
        tasks: [],
        sections: {
          retrospective: `## What Went Well\n\n- Bidirectional trading working correctly with SMA200 filter\n- S/R auto-detection produces clean zones\n- Multi-pair (SOL, BTC, ETH) added without major refactoring\n\n## What Didn't Go Well\n\n- SHORT trades losing money in SOL (-$38.25) and BTC (-$6.63)\n- Swing profile uses wrong entry TF (5m instead of 15m)\n\n## Surprises\n\n- ETH SHORT was profitable (+$17.86) while SOL/BTC were not`,
          technicalDebt: `| # | Item | Origin | Priority | Status |\n|---|------|--------|----------|--------|\n| D5 | DrawdownMonitor not included | Sprint 1 | HIGH | open |\n| D13 | 30m TF not evaluated | Sprint 2 | MEDIUM | deferred |\n| D17 | DCA trade count reduction | Sprint 2 | MEDIUM | open |\n| D19 | R:R asymmetric in volatile pairs | Sprint 2 | MEDIUM | deferred |\n| D20 | SHORT SL underperformance | Sprint 3 | HIGH | open |\n| D21 | Swing TF override not applied | Sprint 3 | HIGH | open |`,
          executionMetrics: `## Test Results\n- Tests: 262 total\n- New files: 8\n- Modified files: 12\n\n## Backtest Results (Oct 2025 - Feb 2026)\n| Par | Trades | WR | PnL | Max DD |\n|-----|--------|----|-----|--------|\n| SOL | 31 | 38.7% | -$20.02 | 0.83% |\n| BTC | 22 | 45.5% | +$52.34 | 0.45% |\n| ETH | 27 | 37.0% | +$17.86 | 0.67% |`,
          findings: `## Key Findings\n\n1. **SMA200 filter works**: In bear market, 100% of signals were SHORT. Correct behavior.\n2. **SHORT underperformance**: SOL SHORT losing -$38.25. ATR multiplier 2x too wide for shorts.\n3. **ETH resilience**: ETH SHORT profitable despite lower WR, thanks to better R:R.\n4. **S/R detection quality**: Auto-detected zones align well with visual chart analysis.`,
          recommendations: `## Recommendations for Sprint 4\n\n1. **[CRITICAL] Risk Engine** (D5): Implement DrawdownMonitor + CircuitBreaker + Time Stop\n2. **[HIGH] SHORT SL optimization** (D20): Test ATR multiplier 1.5x for SHORT\n3. **[MEDIUM] D17 investigation**: DCA trade count reduction root cause\n4. **[MEDIUM] D21 fix**: Swing profile TF override in backtest script\n5. **[DEFERRED] 30m TF** (D13): Evaluate in Sprint 5`,
        },
      },
      {
        id: "bot-sprint-4",
        name: "Sprint 4 - Risk Engine Completo",
        status: "closed",
        version: "0.4.0",
        startDate: daysAgo(5),
        endDate: daysAgo(1),
        objective:
          "Implementar el Risk Engine completo que protege al bot contra drawdown y cascada de perdidas. DrawdownMonitor con 4 zonas de reduccion automatica, circuit breakers, time stop configurable, y optimizacion del SL para SHORT.",
        tasks: botTasks.filter((t) =>
          [
            "bot-task-1",
            "bot-task-2",
            "bot-task-3",
            "bot-task-4",
            "bot-task-5",
            "bot-task-6",
          ].includes(t.id),
        ),
        sections: {
          retrospective: `## What Went Well

- **Risk Engine completo en una sesion**: DrawdownMonitor + CircuitBreaker + Time Stop + atr_multiplier_short implementados sin bloqueos.
- **43 tests nuevos sin regresiones**: 305 total. El aislamiento de CircuitBreaker con \`consecutive_losses: 999\` para tests de rolling WR fue una solucion limpia.
- **Bear market validation exitosa**: Todos los pares positivos (SOL +$25, BTC +$87, ETH +$17) con Max DD < 1%.
- **D21 fix minimo**: Re-aplicar \`profile.timeframes\` en \`backtest.ts\` fue un one-liner limpio sin tocar \`ConfigLoader\`.
- **sizeMultiplier con backward compat**: Pasarlo con default \`1.0\` no rompio ningun test existente.

## What Didn't Go Well

- **Risk Engine nunca se activo**: Max DD fue < 1% en todo el periodo. DrawdownMonitor y CircuitBreaker implementados pero nunca actuaron. Necesitamos periodo con drawdown > 10% para validarlos (D22).
- **A/B test SHORT SL no fue formal**: Se eligio 1.5x como default sin ejecutar backtest comparativo explicito. D20 sigue tecnicamente abierto.

## Surprises

- **Solo SHORT en todos los pares**: SMA200 filter funciono perfectamente. Mercado bajista (Oct 2025-Feb 2026) genero 0 senales LONG.
- **BTC tuvo 1 time stop real**: Primer time stop observado en backtest. Confirma que \`checkExits()\` lo detecta correctamente.
- **Max DD < 1% en bear market**: La estrategia SHORT es tan precisa en downtrend que el drawdown fue minimo.`,
          technicalDebt: `| # | Item | Origin | Priority | Status |
|---|------|--------|----------|--------|
| D5 | Funding rate simulation en backtest | Sprint 1 | MEDIUM | open |
| D6 | Live trading loop (BotOrchestrator) | Sprint 1 | HIGH | pending |
| D7 | Websocket integration para live data | Sprint 1 | HIGH | pending |
| D8 | Multi-pair real simultaneo | Sprint 1 | HIGH | pending |
| D9 | SQLite persistence para trades | Sprint 1 | MEDIUM | pending |
| D10 | Telegram alerts | Sprint 1 | LOW | pending |
| D13 | Backtesting con datos de 2022 | Sprint 2 | MEDIUM | pending |
| D14 | OHLC heuristic verification | Sprint 2 | LOW | open |
| D17 | DCA trade count investigation | Sprint 2 | LOW | open |
| D20 | SHORT SL A/B test formal | Sprint 3 | MEDIUM | open |
| D22 | Risk Engine stress-test DD > 10% | Sprint 4 | MEDIUM | **new** |`,
          executionMetrics: `## Sprint Metrics

- **Tests**: 305 total (+43 Sprint 4)
  - DrawdownMonitor: 17 tests
  - CircuitBreaker: 16 tests
  - Time Stop: 8 tests
  - SHORT SL: 3 tests
- **New files**: DrawdownMonitor.ts, CircuitBreaker.ts, + test files
- **Modified files**: types.ts, SignalDetector.ts, TradeManager.ts, BacktestRunner.ts, backtest.ts, config.json

## Backtest Results (Bear Market Oct 2025 - Feb 2026)

| Par | Trades | WR | PnL | Max DD | PF | Notes |
|-----|--------|----|-----|--------|-----|-------|
| SOLUSDT | 18 | 44.4% | +$25.59 | 0.60% | 1.23 | All SHORT (downtrend) |
| BTCUSDT | 14 | 64.3% | +$87.17 | 0.17% | 2.85 | 1 time stop active |
| ETHUSDT | 19 | 42.1% | +$17.86 | 0.67% | 1.15 | All SHORT (downtrend) |

**Baseline Sprint 3 SOL**: -$20.02 -> Sprint 4: +$25.59 (+$45.61 improvement)
Risk engine in GREEN zone entire period (DD < 1% < 10% yellow threshold).`,
          findings: `## Key Findings

1. **Risk Engine did not activate**: Max DD was < 1% across all pairs during bear market. The engine is implemented but was not needed. Need a period with drawdown > 10% to validate in action.
2. **atr_multiplier_short=1.5 vs 2.0**: With 1.5 the SHORT SL is tighter. In bear market this helped (smaller stops). Pending formal A/B test.
3. **D21 fix confirmed**: Now \`--profile swing\` applies timeframes 15m/4H/1D correctly.
4. **Time Stop in BTC**: 1 trade closed by time stop in BTC. Correct behavior.
5. **Only SHORT across all pairs**: SMA200 filter working correctly. Bear market = only SHORT signals.`,
          recommendations: `## Recommendations for Sprint 5

1. **[CRITICAL] Live Trading Wiring** (D6, D7, D8): Implement BotOrchestrator, WS feed, multi-pair loop. The bot has never operated in real time.
2. **[HIGH] SQLite persistence** (D9): Trade state must survive process restarts.
3. **[MEDIUM] Crypto Winter backtest** (D13, D22): Execute on 2022 data to validate Risk Engine with real drawdowns > 10%.
4. **[LOW] Telegram alerts** (D10): Notifications for trade_open, trade_close, stop_loss, drawdown_red.`,
        },
      },
      {
        id: "bot-sprint-5",
        name: "Sprint 5 - Live Trading Wiring",
        status: "active",
        version: "0.5.0",
        startDate: daysAgo(1),
        objective:
          "Wire up the bot for live trading: BotOrchestrator, WebSocket feed, multi-pair loop, state persistence, and monitoring.",
        tasks: botTasks.filter((t) =>
          ["bot-task-7", "bot-task-8", "bot-task-9", "bot-task-10"].includes(
            t.id,
          ),
        ),
      },
    ],
    createdAt: daysAgo(30),
    updatedAt: daysAgo(1),
  },
  {
    id: "proj-3",
    name: "Design System",
    description:
      "Shared design system with tokens, components, and documentation used across all team projects.",
    color: "bg-amber-500",
    readme: `# Design System

Centralized design system for consistent UI across all projects.

## Tokens

- Colors: Primary, Secondary, Muted, Accent, Destructive
- Typography: Font families, sizes, weights
- Spacing: 4px grid system
- Radii: sm, md, lg, xl

## Components

Built on shadcn/ui with custom theme and extensions.
`,
    documents: [],
    sprints: [],
    createdAt: daysAgo(30),
    updatedAt: daysAgo(5),
  },
];

// ─── Agent Activities (per project) ─────────────────────────────────

export const mockActivities: AgentActivity[] = [
  {
    id: "act-1",
    projectId: "proj-1",
    actionType: "created_task",
    description:
      'AI Agent created task "API rate limiting and security audit" based on sprint goals',
    timestamp: hoursAgo(2),
  },
  {
    id: "act-2",
    projectId: "proj-1",
    actionType: "moved_task",
    description:
      'AI Agent moved "Implement user authentication flow" from In Progress to Review',
    timestamp: hoursAgo(4),
  },
  {
    id: "act-3",
    projectId: "proj-1",
    actionType: "edited_doc",
    description:
      "AI Agent updated Architecture Decision Records with ADR-002 for state management",
    timestamp: hoursAgo(8),
  },
  {
    id: "act-4",
    projectId: "proj-1",
    actionType: "completed_task",
    description:
      'AI Agent marked "Design system tokens and component library" as complete',
    timestamp: daysAgo(1),
  },
  {
    id: "act-5",
    projectId: "proj-1",
    actionType: "created_sprint",
    description:
      'AI Agent created "Polish & Scale Sprint" with 3 tasks from backlog',
    timestamp: daysAgo(2),
  },
  {
    id: "act-6",
    projectId: "proj-2",
    actionType: "completed_task",
    description:
      'Sprint Forge completed "Implement DrawdownMonitor with 4 zones" - 17 tests passing',
    timestamp: daysAgo(3),
  },
  {
    id: "act-7",
    projectId: "proj-2",
    actionType: "completed_task",
    description:
      'Sprint Forge completed "Create CircuitBreaker with 3 breakers" - 16 tests passing',
    timestamp: daysAgo(3),
  },
  {
    id: "act-8",
    projectId: "proj-2",
    actionType: "created_sprint",
    description:
      'Sprint Forge created "Sprint 5 - Live Trading Wiring" based on Sprint 4 retro recommendations',
    timestamp: daysAgo(1),
  },
  {
    id: "act-9",
    projectId: "proj-2",
    actionType: "edited_doc",
    description:
      "Sprint Forge updated Roadmap with Sprint 4 completion and Sprint 5 objectives",
    timestamp: daysAgo(1),
  },
];

export const teamMembers: TeamMember[] = [
  { name: "Alex Chen", avatar: "AC", color: "bg-blue-500" },
  { name: "Maya Patel", avatar: "MP", color: "bg-emerald-500" },
  { name: "Jordan Liu", avatar: "JL", color: "bg-amber-500" },
  { name: "Sprint Forge", avatar: "SF", color: "bg-primary" },
];
