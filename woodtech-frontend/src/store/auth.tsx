import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  AuthApi,
  type ApiUser,
  type AuthSessionPayload,
  setAuthAccessToken
} from "../lib/api";
import { getCurrentLang } from "./lang";
import type {
  AuthCredentials,
  AuthTokens,
  RegisterPayload,
  RegisterRequest,
  User
} from "../types";

type AuthContextValue = {
  user: User | null;
  status: "idle" | "loading" | "authenticated";
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<{ status: "pending_verification"; email: string }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
};

type PersistedAuth = {
  user: User;
  tokens: AuthTokens;
};

const STORAGE_KEY = "woodtech:auth";

const AuthContext = createContext<AuthContextValue | null>(null);

// Produit un nom affichable quand le profil ne contient pas de prenom/nom.
function deriveNameFromEmail(email: string): string {
  const localPart = email.split("@")[0]?.trim();
  if (localPart && localPart.length > 0) {
    return localPart.charAt(0).toUpperCase() + localPart.slice(1);
  }
  return getCurrentLang() === "fr" ? "Utilisateur" : "User";
}

// Conversion d'une reponse API vers la forme de User utilisee dans le front.
function toUser(profile: ApiUser): User {
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
  return {
    id: profile.id,
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    name: fullName.length > 0 ? fullName : deriveNameFromEmail(profile.email),
    role: profile.role,
    createdAt: profile.createdAt
  };
}

// Sauvegarde dans localStorage pour garder la session apres refresh.
function persistAuth(session: PersistedAuth | null) {
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function loadPersistedAuth(): PersistedAuth | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedAuth;
  } catch {
    return null;
  }
}

// Decoupe le champ "name" du formulaire en first/last name pour l'API.
function splitFullName(fullName: string): Pick<RegisterRequest, "firstName" | "lastName"> {
  const normalized = fullName.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return { firstName: undefined, lastName: undefined };
  }
  const parts = normalized.split(" ");
  const [firstName, ...rest] = parts;
  return {
    firstName,
    lastName: rest.length > 0 ? rest.join(" ") : undefined
  };
}

// Contexte global d'authentification : stocke l'utilisateur + les tokens.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "authenticated">("idle");

  const clearSession = useCallback(() => {
    setUser(null);
    setTokens(null);
    setAuthAccessToken(null);
    persistAuth(null);
    setStatus("idle");
  }, []);

  // Application d'une nouvelle session apres login/register.
  const applySession = useCallback((payload: AuthSessionPayload) => {
    const mappedUser = toUser(payload.user);
    setUser(mappedUser);
    setTokens(payload.tokens);
    setAuthAccessToken(payload.tokens.accessToken);
    persistAuth({ user: mappedUser, tokens: payload.tokens });
    setStatus("authenticated");
  }, []);

  // Au chargement, on tente de rejouer la session sauvegardee pour eviter une reconnexion.
  useEffect(() => {
    const cached = loadPersistedAuth();
    if (!cached) {
      return;
    }

    setUser(cached.user);
    setTokens(cached.tokens);
    setAuthAccessToken(cached.tokens.accessToken);
    setStatus("loading");

    AuthApi.me()
      .then(({ data }) => {
        if (!data.success) {
          throw new Error(data.error?.message ?? "Unauthorized");
        }
        const refreshedUser = toUser(data.data);
        setUser(refreshedUser);
        persistAuth({ user: refreshedUser, tokens: cached.tokens });
        setStatus("authenticated");
      })
      .catch(() => {
        clearSession();
      });
  }, [clearSession]);

  // Appelle /auth/login puis memorise la session obtenue.
  const handleLogin = useCallback(
    async (credentials: AuthCredentials) => {
      setStatus("loading");
      try {
        const response = await AuthApi.login(credentials);
        if (!response.data.success) {
          throw new Error(response.data.error?.message ?? "Authentication failed");
        }
        applySession(response.data.data);
      } catch (error) {
        clearSession();
        setStatus("idle");
        throw error;
      }
    },
    [applySession, clearSession]
  );

  // Appelle /auth/register en decoupant le nom complet fourni par le formulaire.
  const handleRegister = useCallback(
    async (payload: RegisterPayload): Promise<{ status: "pending_verification"; email: string }> => {
      setStatus("loading");
      const { firstName, lastName } = splitFullName(payload.name);
      const requestBody: RegisterRequest = {
        email: payload.email,
        password: payload.password,
        firstName,
        lastName
      };
      try {
        const response = await AuthApi.register(requestBody);
        if (!response.data.success) {
          throw new Error(response.data.error?.message ?? "Registration failed");
        }
        // Même si l'API renvoie une session, on force le flux de vérification côté client.
        setStatus("idle");
        return { status: "pending_verification" as const, email: requestBody.email };
      } catch (error) {
        clearSession();
        setStatus("idle");
        throw error;
      }
    },
    [applySession, clearSession]
  );

  const verifyEmail = useCallback(
    async (email: string, code: string) => {
      setStatus("loading");
      try {
        const response = await AuthApi.verifyEmail(email, code);
        if (!response.data.success) {
          throw new Error(response.data.error?.message ?? "Verification failed");
        }
        applySession(response.data.data);
      } catch (error) {
        setStatus("idle");
        throw error;
      }
    },
    [applySession]
  );

  // Invalide la session cote API (si possible) puis efface les tokens locaux.
  const logout = useCallback(async () => {
    try {
      if (tokens?.refreshToken) {
        await AuthApi.logout(tokens.refreshToken);
      } else {
        await AuthApi.logout();
      }
    } catch (error) {
      console.warn("Failed to call logout endpoint", error);
    } finally {
      clearSession();
    }
  }, [tokens, clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      login: handleLogin,
      register: handleRegister,
      verifyEmail,
      logout
    }),
    [user, status, handleLogin, handleRegister, verifyEmail, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook d'acces simplifie avec garde contre une utilisation hors provider.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
