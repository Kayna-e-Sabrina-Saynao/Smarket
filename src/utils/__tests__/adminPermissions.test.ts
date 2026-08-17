import { hasAdminAccess, isUltimateUser } from "@/src/utils/adminPermissions";

describe("adminPermissions", () => {
  describe("isUltimateUser", () => {
    it("retorna true quando o claim ultimate e true", () => {
      expect(isUltimateUser({ claims: { ultimate: true } })).toBe(true);
    });

    it("retorna false quando o claim ultimate nao existe ou e false", () => {
      expect(isUltimateUser({ claims: {} })).toBe(false);
      expect(isUltimateUser({ claims: { ultimate: false } })).toBe(false);
    });

    it("retorna false para token nulo ou indefinido", () => {
      expect(isUltimateUser(null)).toBe(false);
      expect(isUltimateUser(undefined)).toBe(false);
    });
  });

  describe("hasAdminAccess", () => {
    it("retorna true com claim admin", () => {
      expect(hasAdminAccess({ claims: { admin: true } })).toBe(true);
    });

    it("retorna true para usuario ultimate", () => {
      expect(hasAdminAccess({ claims: { ultimate: true } })).toBe(true);
    });

    it("retorna false sem claims de acesso", () => {
      expect(hasAdminAccess({ claims: {} })).toBe(false);
      expect(hasAdminAccess(null)).toBe(false);
    });
  });
});