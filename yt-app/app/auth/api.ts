"use client";

type AuthApiResponse = {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  email?: string;
};

const AUTH_SESSION_KEY = "yt-auth-session";

function apiUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  return `${baseUrl}${path}`;
}

async function authRequest(path: string, email: string, password: string) {
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = data?.detail || "Authentication request failed";
    throw new Error(detail);
  }

  return data as AuthApiResponse;
}

export async function signInWithApi(email: string, password: string) {
  const session = await authRequest("/api/auth/signin", email, password);
  saveAuthSession(session);
  return session;
}

export async function signUpWithApi(email: string, password: string) {
  const session = await authRequest("/api/auth/signup", email, password);
  saveAuthSession(session);
  return session;
}

export function saveAuthSession(session: AuthApiResponse) {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function getAuthSession(): AuthApiResponse | null {
  const rawSession = localStorage.getItem(AUTH_SESSION_KEY);
  if (!rawSession) return null;

  try {
    return JSON.parse(rawSession) as AuthApiResponse;
  } catch {
    localStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

export function hasAuthSession() {
  return Boolean(getAuthSession()?.idToken);
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
}
