import axios from "axios";
import type {
  AuthCredentials,
  AuthTokens,
  CartItem,
  Order,
  Product,
  RegisterRequest,
  UserRole
} from "../types";
import { notifyServiceDown } from "./serviceStatus";

// Client Axios mutualise qui pointe vers l'API gateway (ou localhost en dev).
const baseURL = import.meta.env.VITE_API_GATEWAY_URL ?? "http://localhost:8080";
const catalogueBaseURL = import.meta.env.VITE_CATALOGUE_SERVICE_URL ?? "http://localhost:4100";
const adminServiceBaseURL =
  import.meta.env.VITE_ADMIN_SERVICE_URL ?? (import.meta.env.VITE_API_GATEWAY_URL ?? "http://localhost:4300");

export const api = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true
});

// Client dedie au microservice catalogue (port 4100 par defaut).
const catalogueApi = axios.create({
  baseURL: catalogueBaseURL,
  timeout: 15000,
  withCredentials: true
});

// Client dedie aux commandes (microservice admin).
const ordersApi = axios.create({
  baseURL: adminServiceBaseURL,
  timeout: 15000,
  withCredentials: true
});

const handleNetworkError = (error: unknown, service: "gateway" | "catalogue" | "orders") => {
  const anyError = error as { response?: unknown; code?: string };
  const isNetworkLikeError =
    !anyError.response ||
    anyError.code === "ECONNABORTED" ||
    anyError.code === "ERR_NETWORK";

  if (isNetworkLikeError) {
    notifyServiceDown({ service });
  }

  return Promise.reject(error);
};

api.interceptors.response.use(
  (response) => response,
  (error) => handleNetworkError(error, "gateway")
);

catalogueApi.interceptors.response.use(
  (response) => response,
  (error) => handleNetworkError(error, "catalogue")
);

ordersApi.interceptors.response.use(
  (response) => response,
  (error) => handleNetworkError(error, "orders")
);

type ApiSuccess<T> = {
  success: true;
  data: T;
};

type ApiError = {
  success: false;
  error: {
    message: string;
    details?: unknown;
  };
};

type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type ApiUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  createdAt: string;
};

export type AuthSessionPayload = {
  user: ApiUser;
  tokens: AuthTokens;
};

export type AuthRegisterResult = AuthSessionPayload | { status: "pending_verification"; email: string };

// Regroupe les appels autour du catalogue produits.
export const Catalogue = {
  list: () => catalogueApi.get<Product[]>("/catalogue/products"),
  one: (id: string) => catalogueApi.get<Product>(`/catalogue/products/${id}`),
  search: (q: string) =>
    catalogueApi.get<Product[]>("/catalogue/products", { params: { q } })
};

export const Orders = {
  create: (
    userId: string,
    items: CartItem[],
    paymentMethod?: string,
    paymentDetails?: Record<string, unknown>
  ) => ordersApi.post<Order>("/orders", { userId, items, paymentMethod, paymentDetails })
};

// Ensemble d'appels lies a l'authentification.
export const AuthApi = {
  login: (payload: AuthCredentials) =>
    api.post<ApiResponse<AuthSessionPayload>>("/auth/login", payload),
  register: (payload: RegisterRequest) =>
    api.post<ApiResponse<AuthRegisterResult>>("/auth/register", payload),
  verifyEmail: (email: string, code: string) =>
    api.post<ApiResponse<AuthSessionPayload>>("/auth/verify-email", { email, code }),
  refresh: (refreshToken: string) =>
    api.post<ApiResponse<AuthTokens>>("/auth/refresh", { refreshToken }),
  logout: (refreshToken?: string) =>
    api.post("/auth/logout", refreshToken ? { refreshToken } : undefined),
  me: () => api.get<ApiResponse<ApiUser>>("/auth/me")
};

// Permet d'injecter / retirer automatiquement le header Authorization.
export const setAuthAccessToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};
