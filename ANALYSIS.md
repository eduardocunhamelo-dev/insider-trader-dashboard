# Análise UX/Layout — Páginas da Dashboard

## Design System (NÃO MUDAR)
- Dark theme: fundo `oklch(0.15 0.025 200)` (~#001f27 teal escuro)
- Verde primário: `oklch(0.85 0.2 150)` (~#00FF85)
- Gold: `oklch(0.78 0.14 85)` (~#D4AF37)
- Fontes: Inter (sans), Space Grotesk (display), JetBrains Mono (mono)
- shadcn/ui + TailwindCSS v4
- Classes utilitárias: `.app-card`, `.app-card-sm`, `.app-grid`, `.app-section`, `.stat-card`, `.card-premium`
- Shell: ClientApp.tsx com sidebar + topbar + main content area (max-w-[1400px], px-6 py-6 lg:px-10 lg:py-8)

## Páginas Analisadas

### 1. Dashboard (Dashboard.tsx) — PRINCIPAL
**Problemas identificados:**
- Greeting usa emoji 👋 — pouco profissional para tema institucional
- "sublabel" duplicado (label + sublabel maiúsculo) — redundante e polui visual
- Stat cards com font-mono para valores — ok mas pode melhorar tipografia
- Evaluation Progress: progress bar com thumb (bolinha) que pode desalinharse
- Quick Actions na sidebar direita: redundância de card + botão separado (3 pares)
- Layout 2/3 + 1/3: no mobile empilha, mas a coluna direita fica muito larga
- Espaço entre seções: `space-y-4` pode ser insuficiente para respiro visual

### 2. Accounts (Accounts.tsx) — CONTAS
**Problemas identificados:**
- Max-width fixo em `max-w-3xl` — não aproveita a largura disponível (1400px)
- Cards de conta muito densos: misturam identidade, métricas, progress bars e ações
- Filtros (plataforma/status/ordenação) podem ser melhor organizados
- Modal de credenciais inline — boa UX mas pode ter melhor feedback

### 3. AccountDetails (AccountDetails.tsx) — DETALHES DA CONTA
**Problemas identificados:**
- Calendário aparece DUAS vezes (aba + seção fixa) — duplicação
- Grade de 8 métricas pode melhorar responsividade
- Gráfico ocupa muito espaço vertical no mobile
- Tabs poderiam ter melhor indicador visual

### 4. Payouts (Payouts.tsx) — SAQUES
**Problemas identificados:**
- `max-w-3xl` estreita demais para o conteúdo
- Fluxo bloqueado/ativo pode ter melhor hierarquia visual
- Formulário e histórico na mesma coluna — pode separar melhor

### 5. Leaderboard (Leaderboard.tsx) — RANKING
**Problemas identificados:**
- `max-w-3xl` limita a tabela
- Card da posição do usuário pode ter mais destaque
- Banners motivacionais ocupam espaço sem informação útil

### 6. PlanStore (PlanStore.tsx) — LOJA
**Problemas identificados:**
- BUG: classes dinâmicas `bg-${plan.color}/10` não funcionam com Tailwind JIT
- Cards de plano podem ter melhor hierarchy visual

## Melhorias Prioritárias
1. Dashboard: remover emoji, melhorar greeting, otimizar quick actions (remover redundância), melhorar spacing
2. Accounts: aumentar largura útil, melhorar densidade dos cards
3. AccountDetails: remover calendário duplicado, melhorar responsividade das métricas
4. Payouts: aumentar largura, melhorar fluxo
5. PlanStore: fixar bug das classes dinâmicas
6. Leaderboard: aumentar largura, melhorar destaque da posição do usuário
