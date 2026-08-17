# Arquitetura do SMARKET

## Visão geral

SMARKET é um app **React Native (Expo SDK 54)** com **Firebase** como backend. Usa **Expo Router** (file-based routing) e **TypeScript strict**. Roda em Android, iOS e Web.

```
app/  (Expo Router: rotas = arquivos)
  └── (tabs)/          → abas do app autenticado
  └── index.tsx        → login/cadastro
  └── onboarding.tsx   → onboarding
  └── compra/[id]      → detalhe de compra + PDF
  └── nota/[id]        → nota da compra
  └── categoria/[categoria] → itens por categoria
```

## Camadas

### Contexto (estado global)

| Contexto | Responsabilidade | Arquivo |
| --- | --- | --- |
| `BudgetProvider` | Orçamento, itens, on-market, histórico, categorias | `context/budget-context.tsx` |
| `CycleProvider` | Mês/ano do ciclo ativo | `src/context/CycleContext.tsx` |
| `SubscriptionProvider` | Plano, status, dados de assinatura | `src/context/subscription-context.tsx` |

### Serviços (`src/services/`)

| Serviço | Responsabilidade |
| --- | --- |
| `analyticsService` | Rastreamento de eventos |
| `billingService` | IAP (expo-iap) e validação |
| `notificationService` | Notificações locais |
| `onboardingService` | Estado de onboarding (AsyncStorage + Firestore) |
| `purchasePdfService` | Geração de PDF da compra |
| `subscriptionService` | Plano, código de convite, preferências no Firestore |

### Configuração (`src/config/`)

- `app.ts` — nome, versão, descrição.
- `plans.ts` — planos disponíveis (free / pro / family / ultimate).

### UI

- `src/theme/premium-ui.ts` — tokens de design (cores, raios, sombras, espaçamentos).
- `src/components/premium/` — `PremiumScreen`, `PremiumCard`, `PremiumButton`.
- `src/components/` — `PremiumFeatureModal`, `PremiumLockedState`, `PlanCard`, `AppEmptyState`, `AppSkeleton`.

### Permissões

- `src/utils/planPermissions.ts` — o que cada plano pode usar.
- `src/utils/adminPermissions.ts` — verificação de admin/ultimate.

## Backend

- **Firebase Authentication** — e-mail/senha.
- **Cloud Firestore** — dados do usuário. Regras em `firestore.rules`.
- **Cloud Functions** (`functions/index.js`) — ativação/cancelamento de planos pagos e sincronização de assinatura via Admin SDK (campos protegidos).

## Modelo de dados

Existem duas coleções de usuário:

- `users/{uid}` — assinatura (plano, status, purchaseToken), convite, onboarding, preferências de ciclo. Usado por `subscriptionService`, `onboardingService`, `subscription-context` e Cloud Functions.
- `usuarios/{uid}` — perfil básico criado no login e o subdocumento `orcamento/atual`. Usado por `app/index.tsx` e `budget-context`.

> **Nota de arquitetura:** os dados de um usuário ficam divididos entre duas coleções. Funciona porque as regras do Firestore protegem ambas por `uid`, mas é uma inconsistência de design. Consolidar tudo em uma coleção (ex.: `users`) é uma migração recomendada — requer teste cuidadoso e backup, por isso está no roadmap, não sendo feita de forma automática.

## Convenções

- Código passa por `npx tsc --noEmit` e `npm run lint` antes de commitar.
- Comentários e nomes em português (padrão do projeto).
- Commits em Conventional Commits.
- A `apiKey` do Firebase no `firebaseConfig` é pública por design; a segurança real vem das **regras do Firestore**, que restringem cada usuário ao próprio `uid`.