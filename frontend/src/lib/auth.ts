export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
  full_name: string | null;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

const TOKEN_KEY = "gst_guardian_token";
const USER_KEY = "gst_guardian_user";

export function saveSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export const ROLE_LABELS: Record<string, string> = {
  senior_officer: "Senior Officer",
  inspection_officer: "Inspection Officer",
  tax_officer: "Tax Officer",
};
