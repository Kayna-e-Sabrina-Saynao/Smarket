# Roadmap do SMARKET

Prioridade das áreas (definida pela dona do projeto): **segurança > funcionalidades > estabilidade > organização > UX > UI > performance > documentação > estética**.

## Concluído

- [x] Autenticação com e-mail/senha (Firebase Authentication).
- [x] Estrutura de telas principal (home, gastos, listas, adicionar item, finalizar compra, histórico).
- [x] Orçamento mensal e ciclo de compra com persistência local + nuvem.
- [x] Histórico de compras com navegação mês/ano.
- [x] Nota fiscal em PDF (expo-print + expo-sharing).
- [x] Visualização por categoria.
- [x] Sistema de planos e assinatura (gratuito / premium / ultimate) com IAP.
- [x] Tela de planos e permissões por plano.
- [x] Onboarding guiado.
- [x] Notificações locais e analytics.
- [x] Tema premium unificado (cores, cards, botões, modais).
- [x] Limpeza de código morto de template e remoção da cópia antiga aninhada.
- [x] Correção de estabilidade: dependência `qrcode` declarada; ciclo anual dinâmico (não mais fixo em 2026).
- [x] README profissional + docs.

## Em desenvolvimento

- [ ] Padronizar as telas legais (sobre, privacidade, termos, ajuda) com o tema premium.
- [ ] Deep link `/convite` funcional para entrada de membros da família.
- [ ] Sistema de família completo no backend (cloud functions + firestore rules).

## Próximas melhorias

- [ ] Testes automatizados (unitários com Jest e de integração).
- [ ] CI/CD (GitHub Actions): typecheck, lint e build de preview.
- [ ] Suporte a múltiplos idiomas (pt-BR como padrão).
- [ ] Modo escuro consistente nas telas.
- [ ] Cache offline melhorado e sincronização de conflitos.
- [ ] Envio de notificações via cloud functions (não só local).
- [ ] Métricas de conversão e funil de assinatura.

## Futuro

- [ ] Publicação na Play Store e App Store.
- [ ] Compras compartilhadas em tempo real entre membros da família.
- [ ] Integração com e-mails de supermercados para captura automática de itens.
- [ ] Versão web publicada (expo web) como painel de acompanhamento.
- [ ] Histórico de preços por item.