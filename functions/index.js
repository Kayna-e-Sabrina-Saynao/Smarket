const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();
const PRO_PRODUCT_ID = "smarket_pro_monthly";
const FAMILY_PRODUCT_ID = "smarket_family_monthly";

const getUserRef = (uid) => db.collection("users").doc(uid);
const isAdminToken = (authData) =>
  authData?.token?.ultimate === true || authData?.token?.admin === true;

const requireAuth = (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Usuario precisa estar autenticado.");
  }

  return request.auth.uid;
};

const toTimestamp = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new HttpsError("invalid-argument", "Data de assinatura invalida.");
  }

  return Timestamp.fromDate(date);
};

const validateSyncPayload = (payload, isAdmin) => {
  const allowedPlans = ["pro", "family"];
  const allowedStatuses = ["active", "trial", "inactive", "canceled"];

  if (!allowedPlans.includes(payload?.plan)) {
    throw new HttpsError("invalid-argument", "Plano de assinatura invalido.");
  }

  if (!allowedStatuses.includes(payload?.subscriptionStatus)) {
    throw new HttpsError("invalid-argument", "Status de assinatura invalido.");
  }

  if (
    payload.plan === "pro" &&
    payload.storeProductId !== PRO_PRODUCT_ID &&
    !isAdmin
  ) {
    throw new HttpsError("permission-denied", "Produto Pro invalido.");
  }

  if (
    payload.plan === "family" &&
    payload.storeProductId !== FAMILY_PRODUCT_ID &&
    !isAdmin
  ) {
    throw new HttpsError("permission-denied", "Produto Familia invalido.");
  }

  if (!isAdmin && (!payload.purchaseToken || typeof payload.purchaseToken !== "string")) {
    throw new HttpsError("permission-denied", "Purchase token obrigatorio.");
  }

  const allowedPlatforms = ["android", "ios", "web", null, undefined];

  if (!allowedPlatforms.includes(payload.subscriptionPlatform)) {
    throw new HttpsError("invalid-argument", "Plataforma de assinatura invalida.");
  }
};

exports.setUserPlan = onCall(async (request) => {
  const uid = requireAuth(request);
  const requestedPlan = request.data?.plan;
  const adminRequest = isAdminToken(request.auth);

  if (requestedPlan !== "free" && !adminRequest) {
    throw new HttpsError(
      "permission-denied",
      "Somente o backend pode ativar planos pagos."
    );
  }

  await getUserRef(uid).set(
    {
      plan: requestedPlan === "family" ? "family" : requestedPlan === "pro" ? "pro" : "free",
      subscriptionStatus: "active",
      planStartedAt: FieldValue.serverTimestamp(),
      planExpiresAt: null,
      storeProductId: null,
      purchaseToken: null,
      subscriptionPlatform: null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true };
});

exports.cancelUserSubscription = onCall(async (request) => {
  const uid = requireAuth(request);

  await getUserRef(uid).set(
    {
      subscriptionStatus: "canceled",
      planExpiresAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true };
});

exports.resetUserPlanToFree = onCall(async (request) => {
  const uid = requireAuth(request);

  await getUserRef(uid).set(
    {
      plan: "free",
      subscriptionStatus: "inactive",
      planStartedAt: null,
      planExpiresAt: null,
      storeProductId: null,
      purchaseToken: null,
      subscriptionPlatform: "android",
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true };
});

exports.syncUserSubscriptionState = onCall(async (request) => {
  const uid = requireAuth(request);
  const adminRequest = isAdminToken(request.auth);
  const payload = request.data ?? {};

  validateSyncPayload(payload, adminRequest);

  await getUserRef(uid).set(
    {
      plan: payload.plan,
      subscriptionStatus: payload.subscriptionStatus,
      planStartedAt: toTimestamp(payload.planStartedAt),
      planExpiresAt: toTimestamp(payload.planExpiresAt),
      storeProductId: payload.storeProductId ?? null,
      purchaseToken: payload.purchaseToken ?? null,
      subscriptionPlatform: payload.subscriptionPlatform ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true };
});
