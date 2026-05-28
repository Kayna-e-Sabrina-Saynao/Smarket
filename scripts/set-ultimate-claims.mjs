import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "node:fs";

const OWNER_EMAIL = "laydepaz1@gmail.com";

const resolveCredential = () => {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;

  if (!serviceAccountPath) {
    throw new Error(
      "Defina FIREBASE_SERVICE_ACCOUNT_KEY_PATH apontando para o JSON da service account."
    );
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  return cert(serviceAccount);
};

const initializeAdmin = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: resolveCredential(),
  });
};

const removeUltimateAdminClaims = async (auth, user) => {
  const currentClaims = user.customClaims ?? {};

  if (currentClaims.ultimate !== true && currentClaims.admin !== true) {
    return false;
  }

  const { ultimate, admin, ...remainingClaims } = currentClaims;

  await auth.setCustomUserClaims(
    user.uid,
    Object.keys(remainingClaims).length > 0 ? remainingClaims : null
  );

  return true;
};

const run = async () => {
  initializeAdmin();

  const auth = getAuth();
  const user = await auth.getUserByEmail(OWNER_EMAIL);
  let nextPageToken = undefined;
  let removedClaimsCount = 0;

  do {
    const page = await auth.listUsers(1000, nextPageToken);

    for (const listedUser of page.users) {
      if (listedUser.uid === user.uid) {
        continue;
      }

      const removed = await removeUltimateAdminClaims(auth, listedUser);

      if (removed) {
        removedClaimsCount += 1;
      }
    }

    nextPageToken = page.pageToken;
  } while (nextPageToken);

  await auth.setCustomUserClaims(user.uid, {
    ...(user.customClaims ?? {}),
    ultimate: true,
    admin: true,
  });

  console.log(`Custom Claims aplicadas com sucesso ao UID ${user.uid}.`);
  console.log(`Claims ultimate/admin removidas de ${removedClaimsCount} outra(s) conta(s).`);
  console.log("Peca para a conta fazer login novamente ou force refresh do token.");
};

run().catch((error) => {
  console.error("Falha ao aplicar Custom Claims:", error);
  process.exit(1);
});
