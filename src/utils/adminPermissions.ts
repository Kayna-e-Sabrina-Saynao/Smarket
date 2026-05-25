import { IdTokenResult } from "firebase/auth";

type TokenResultLike = Pick<IdTokenResult, "claims"> | null | undefined;

export const isUltimateUser = (idTokenResult: TokenResultLike) =>
  idTokenResult?.claims?.ultimate === true;

export const hasAdminAccess = (idTokenResult: TokenResultLike) =>
  isUltimateUser(idTokenResult) || idTokenResult?.claims?.admin === true;
