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
    name: "Gratis",
    priceLabel: "R$0",
    priceMonthly: 0,
    billingProductId: null,
    description: "Ideal para validar o app no dia a dia sem custo.",
    features: [
      "1 lista principal",
      "Recursos basicos de lista",
      "Sem historico avancado",
      "Sem estatisticas",
      "Sem exportar PDF",
      "Sem compartilhamento avancado",
      "Sem personalizacao visual",
    ],
    limits: {
      maxLists: 1,
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
    description: "Para usuarios que querem historico, estatisticas e listas sem limite.",
    highlighted: true,
    features: [
      "Listas ilimitadas",
      "Compartilhar listas",
      "Historico de compras e listas",
      "Estatisticas de gastos",
      "Exportar lista em PDF",
      "Personalizacao visual",
      "Identificar quem realizou a compra",
    ],
    limits: {
      maxLists: null,
      maxFamilyMembers: 0,
      canShareLists: true,
      canViewHistory: true,
      canViewStats: true,
      canExportPDF: true,
      canUseFamilyFeatures: false,
      canUseCustomization: true,
      canTrackBuyer: true,
    },
  },
  family: {
    id: "family",
    name: "Familia",
    priceLabel: "R$19,90/mes",
    priceMonthly: 19.9,
    billingProductId: "smarket_family_monthly",
    description: "Plano completo para casa toda comprar e acompanhar junto.",
    features: [
      "Todos os recursos do Pro",
      "Ate 5 membros vinculados",
      "Sincronizacao em tempo real",
      "Metas financeiras familiares",
      "Gestao compartilhada das listas",
      "Personalizacao visual",
      "Identificacao do membro que concluiu a compra",
    ],
    limits: {
      maxLists: null,
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
