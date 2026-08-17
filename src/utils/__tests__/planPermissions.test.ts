import {
  canAddProducts,
  canCreateList,
  canExportPDF,
  canShareLists,
  canUseCustomization,
  canUseFamilyFeatures,
  canViewHistory,
  canViewStats,
  getMaxFamilyMembers,
  getMaxProducts,
} from "@/src/utils/planPermissions";

describe("planPermissions", () => {
  describe("canCreateList", () => {
    it("libera quando o plano nao tem limite de listas", () => {
      expect(canCreateList("pro", 10)).toBe(true);
      expect(canCreateList("family", 50)).toBe(true);
    });

    it("respeita o limite de 1 lista do plano gratis", () => {
      expect(canCreateList("free", 0)).toBe(true);
      expect(canCreateList("free", 1)).toBe(false);
    });

    it("libera com acesso ultimate", () => {
      expect(canCreateList("free", 5, true)).toBe(true);
    });
  });

  describe("canAddProducts", () => {
    it("respeita o limite de 100 produtos do plano gratis", () => {
      expect(canAddProducts("free", 99)).toBe(true);
      expect(canAddProducts("free", 100)).toBe(false);
    });

    it("libera em planos sem limite", () => {
      expect(canAddProducts("pro", 1000)).toBe(true);
    });
  });

  describe("recursos por plano", () => {
    it("gratis nao tem historico, estatisticas, PDF, familia ou compartilhamento", () => {
      expect(canViewHistory("free")).toBe(false);
      expect(canViewStats("free")).toBe(false);
      expect(canExportPDF("free")).toBe(false);
      expect(canUseFamilyFeatures("free")).toBe(false);
      expect(canShareLists("free")).toBe(false);
      expect(canUseCustomization("free")).toBe(false);
    });

    it("pro libera historico, estatisticas e PDF, mas nao familia", () => {
      expect(canViewHistory("pro")).toBe(true);
      expect(canViewStats("pro")).toBe(true);
      expect(canExportPDF("pro")).toBe(true);
      expect(canUseFamilyFeatures("pro")).toBe(false);
      expect(canShareLists("pro")).toBe(false);
    });

    it("family libera todos os recursos premium", () => {
      expect(canViewHistory("family")).toBe(true);
      expect(canViewStats("family")).toBe(true);
      expect(canExportPDF("family")).toBe(true);
      expect(canUseFamilyFeatures("family")).toBe(true);
      expect(canShareLists("family")).toBe(true);
      expect(canUseCustomization("family")).toBe(true);
    });

    it("acesso ultimate sobrescreve o plano", () => {
      expect(canUseFamilyFeatures("free", true)).toBe(true);
      expect(canViewHistory("free", true)).toBe(true);
      expect(canShareLists("free", true)).toBe(true);
    });
  });

  describe("limites de membros e produtos", () => {
    it("retorna 0 membros em gratis e pro", () => {
      expect(getMaxFamilyMembers("free")).toBe(0);
      expect(getMaxFamilyMembers("pro")).toBe(0);
    });

    it("retorna 5 membros no plano family", () => {
      expect(getMaxFamilyMembers("family")).toBe(5);
    });

    it("retorna 5 membros com acesso ultimate", () => {
      expect(getMaxFamilyMembers("free", true)).toBe(5);
    });

    it("retorna null em planos sem limite de produtos", () => {
      expect(getMaxProducts("pro")).toBeNull();
      expect(getMaxProducts("family")).toBeNull();
      expect(getMaxProducts("free", true)).toBeNull();
    });

    it("retorna 100 no plano gratis", () => {
      expect(getMaxProducts("free")).toBe(100);
    });
  });
});