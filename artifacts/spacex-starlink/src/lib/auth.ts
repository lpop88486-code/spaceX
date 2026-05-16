import { setAuthTokenGetter } from "@workspace/api-client-react";

export function getAdminToken() {
  return localStorage.getItem("admin_token");
}

export function setAdminToken(token: string) {
  localStorage.setItem("admin_token", token);
}

export function removeAdminToken() {
  localStorage.removeItem("admin_token");
}

export function initAuth() {
  setAuthTokenGetter(() => {
    return getAdminToken();
  });
}
