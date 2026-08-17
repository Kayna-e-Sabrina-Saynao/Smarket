# SMARKET

Organize compras, compartilhe listas e acompanhe gastos — direto do seu celular.

Aplicativo mobile construído com **React Native + Expo** e **Firebase** (Authentication e Firestore), com suporte a Android, iOS e Web.

## Funcionalidades

- **Listas de compras**: adicione itens, defina quantidades e finalize a compra com um toque.
- **Orçamento mensal**: defina um valor limite e acompanhe o quanto já foi gasto no ciclo.
- **Resumo financeiro**: dashboard com gastos, itens e histórico do ciclo atual.
- **Histórico de compras**: navegue entre meses e anos para rever compras passadas.
- **Notas fiscais em PDF**: gere e compartilhe a nota da compra como PDF.
- **Ciclos de compra**: mude o mês/ano ativo e veja os dados do período selecionado.
- **Estatísticas por categoria**: entenda onde seu dinheiro vai.
- **Planos e assinatura**: modelos gratuito e premium (IAP) com recursos exclusivos.
- **Família**: código de convite e QR Code para conectar membros no plano premium.
- **Onboarding guiado** e autenticação com e-mail/senha.
- **Notificações locais** e **analytics** de uso.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | React Native 0.81 + Expo SDK 54 |
| Navegação | Expo Router (file-based routing) |
| Linguagem | TypeScript (strict) |
| Backend | Firebase Authentication + Firestore |
| Pagamentos | expo-iap (compra dentro do app) |
| PDF | expo-print + expo-sharing |
| QR Code | react-native-qrcode-svg |
| Analytics | serviço próprio em `src/services/analyticsService.ts` |

## Estrutura do projeto

```
app/                  # Rotas e telas (Expo Router)
  (tabs)/             # Abas principais do app autenticado
  index.tsx           # Tela de login/cadastro
  onboarding.tsx      # Onboarding guiado
  compra/[id].tsx     # Detalhe de uma compra + PDF
  nota/[id].tsx       # Visualização da nota
  categoria/[categoria].tsx # Itens por categoria
context/              # Contexto de orçamento (budget-context)
src/
  components/         # Componentes reutilizáveis (incl. premium/*)
  config/             # Planos e configuração do app
  context/            # Ciclos (CycleContext) e assinatura
  screens/            # Telas reutilizáveis (ex.: PlansScreen)
  services/           # Firebase, analytics, billing, PDF, notificações
  theme/              # Tema premium (cores, raio, sombras)
  types/              # Tipos TypeScript
  utils/              # Permissões de plano e utilitários
functions/            # Cloud Functions do Firebase
firebaseConfig.ts     # Inicialização do Firebase
```

## Como rodar

Pré-requisitos: [Node.js](https://nodejs.org) 20+ e o app **Expo Go** no celular (ou um emulador).

```bash
# 1. Instale as dependências
npm install

# 2. Configure o Firebase (veja abaixo)

# 3. Inicie o servidor de desenvolvimento
npx expo start
```

No terminal, pressione `a` para Android, `i` para iOS ou `w` para Web. Você também pode escanear o QR Code com o Expo Go.

### Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com).
2. Ative **Authentication** (e-mail/senha) e **Cloud Firestore**.
3. Copie o objeto de configuração para o arquivo `firebaseConfig.ts` (use `firebaseConfig.example.ts` como base, se disponível).
4. Publique as regras de segurança em `firestore.rules` e implante as funções de `functions/`, se usadas.

> A `apiKey` do Firebase é pública por design — a segurança dos dados é garantida pelas **regras do Firestore**, não pela chave.

### Scripts

```bash
npm start            # Inicia o Expo
npm run android      # Inicia no Android
npm run ios          # Inicia no iOS
npm run web          # Inicia no navegador
npm run lint         # ESLint (config expo)
npm test             # Jest (unitários)
npm run test:watch   # Jest em modo watch
npx tsc --noEmit     # Type check
```

## Convenções de código

- Commits seguem o padrão **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`.
- Branch principal de desenvolvimento: `ultima-versao` (espelho em `main` no GitHub).
- Todo código passa por `npx tsc --noEmit` e `npm run lint` antes de commitar.

## Documentação e roadmap

- [Roadmap](./docs/roadmap.md) — estado atual e próximos passos.
- [Arquitetura](./docs/arquitetura.md) — visão técnica do projeto.
- [Git e GitHub](./docs/git-workflow.md) — fluxo de trabalho recomendado.

## Licença

Projeto privado — todos os direitos reservados.