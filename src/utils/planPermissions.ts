import { PLANS } from "@/src/config/plans";
import { SmarketPlanId } from "@/src/types/subscription";

const getPlanConfig = (userPlan: SmarketPlanId = "free") => PLANS[userPlan] ?? PLANS.free;
const hasUltimateOverride = (hasUltimateAccess = false) => hasUltimateAccess === true;

export const canCreateList = (
  userPlan: SmarketPlanId = "free",
  currentListCount: number,
  hasUltimateAccess = false
) => {
  if (hasUltimateOverride(hasUltimateAccess)) {
    return true;
  }

  const maxLists = getPlanConfig(userPlan).limits.maxLists;

  if (maxLists === null) {
    return true;
  }

  return currentListCount < maxLists;
};

export const canShareLists = (
  userPlan: SmarketPlanId = "free",
  hasUltimateAccess = false
) =>
  hasUltimateOverride(hasUltimateAccess) ||
  getPlanConfig(userPlan).limits.canShareLists;

export const canViewHistory = (
  userPlan: SmarketPlanId = "free",
  hasUltimateAccess = false
) =>
  hasUltimateOverride(hasUltimateAccess) ||
  getPlanConfig(userPlan).limits.canViewHistory;

export const canViewStats = (
  userPlan: SmarketPlanId = "free",
  hasUltimateAccess = false
) =>
  hasUltimateOverride(hasUltimateAccess) ||
  getPlanConfig(userPlan).limits.canViewStats;

export const canExportPDF = (
  userPlan: SmarketPlanId = "free",
  hasUltimateAccess = false
) =>
  hasUltimateOverride(hasUltimateAccess) ||
  getPlanConfig(userPlan).limits.canExportPDF;

export const canUseFamilyFeatures = (
  userPlan: SmarketPlanId = "free",
  hasUltimateAccess = false
) =>
  hasUltimateOverride(hasUltimateAccess) ||
  getPlanConfig(userPlan).limits.canUseFamilyFeatures;

export const canUseCustomization = (
  userPlan: SmarketPlanId = "free",
  hasUltimateAccess = false
) =>
  hasUltimateOverride(hasUltimateAccess) ||
  getPlanConfig(userPlan).limits.canUseCustomization;

export const canTrackBuyer = (
  userPlan: SmarketPlanId = "free",
  hasUltimateAccess = false
) =>
  hasUltimateOverride(hasUltimateAccess) ||
  getPlanConfig(userPlan).limits.canTrackBuyer;

export const getMaxFamilyMembers = (
  userPlan: SmarketPlanId = "free",
  hasUltimateAccess = false
) => {
  if (hasUltimateOverride(hasUltimateAccess)) {
    return PLANS.family.limits.maxFamilyMembers;
  }

  return getPlanConfig(userPlan).limits.maxFamilyMembers;
};
