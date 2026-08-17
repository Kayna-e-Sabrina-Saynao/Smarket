import { SmarketPlanId } from "@/src/types/subscription";

export type PlanConfig = {
  id: SmarketPlanId;
  name: string;
  priceLabel: string;
  priceMonthly: number;
  billingProductId?: string | null;
  description: string;
  features: string[];
  highlighted?: boolean;
  limits: {
    maxLists: number | null;
    maxProducts: number | null;
    maxFamilyMembers: number;
    canShareLists: boolean;
    canViewHistory: boolean;
    canViewStats: boolean;
    canExportPDF: boolean;
    canUseFamilyFeatures: boolean;
    canUseCustomization: boolean;
    canTrackBuyer: boolean;
  };
};

export const RECOMMENDED_PLAN: SmarketPlanId = "pro";

export const PLAN_ORDER: SmarketPlanId[] = ["free", "pro", "family"];

export const PLANS: Record<SmarketPlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Grátis",
    priceLabel: "R$0",
    priceMonthly: 0,
    billingProductId: null,
    description: "Ideal para usuários que desejam organizar compras básicas sem custos.",
    features: [
      "1 lista principal",
      "Recursos basicos de lista",
      "Até 100 produtos",
    ],
    limits: {
      maxLists: 1,
      maxProducts: 100,
      maxFamilyMembers: 0,
      canShareLists: false,
      canViewHistory: false,
      canViewStats: false,
      canExportPDF: false,
      canUseFamilyFeatures: false,
      canUseCustomization: false,
      canTrackBuyer: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceLabel: "R$9,90/mes",
    priceMonthly: 9.9,
    billingProductId: "smarket_pro_monthly",
    description: "Para usuários que utilizam o aplicativo individualmente e desejam recursos avançados.",
    highlighted: true,
    features: [
      "Listas ilimitadas",
      "Histórico completo",
      "Estatisticas de gastos",
      "Exportar PDF",
      "Categorias personalizadas",
      "Personalizacao visual",
      "Backup em nuvem",
      "Metas de gastos",
      "Relatórios mensais",
    ],
    limits: {
      maxLists: null,
      maxProducts: null,
      maxFamilyMembers: 0,
      canShareLists: false,
      canViewHistory: true,
      canViewStats: true,
      canExportPDF: true,
      canUseFamilyFeatures: false,
      canUseCustomization: true,
      canTrackBuyer: false,
    },
  },
  family: {
    id: "family",
    name: "Família",
    priceLabel: "R$19,90/mes",
    priceMonthly: 19.9,
    billingProductId: "smarket_family_monthly",
    description: "Plano completo para famílias que desejam organizar compras e finanças em conjunto.",
    features: [
      "Ate 5 membros vinculados",
      "Convite por código",
      "Convite por QR Code",
      "Sincronizacao em tempo real",
      "Gestão compartilhada das listas",
      "Identificação de quem adicionou itens",
      "Identificação de quem realizou compras",
      "Histórico por membro",
      "Estatísticas por membro",
      "Metas financeiras familiares",
      "Dashboard familiar",
      "Solicitações de compra",
      "Notificações para toda a família",
    ],
    limits: {
      maxLists: null,
      maxProducts: null,
      maxFamilyMembers: 5,
      canShareLists: true,
      canViewHistory: true,
      canViewStats: true,
      canExportPDF: true,
      canUseFamilyFeatures: true,
      canUseCustomization: true,
      canTrackBuyer: true,
    },
  },
};

export const PLAY_BILLING_PRODUCT_IDS = PLAN_ORDER.map((planId) => PLANS[planId].billingProductId)
  .filter((productId): productId is string => Boolean(productId));
