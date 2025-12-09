import axios from "axios";
import type { AxiosInstance, AxiosResponse } from "axios";
import type { Product, Order, CartItem } from "@/types";
import { adminTokenStorage } from "../guard";
import { notifyServiceDown } from "@/lib/serviceStatus";

const adminServiceBaseURL = (
  import.meta.env.VITE_ADMIN_SERVICE_URL ?? import.meta.env.VITE_API_GATEWAY_URL ?? "http://localhost:4300"
).trim();
const catalogueBaseURL = (import.meta.env.VITE_CATALOGUE_SERVICE_URL ?? "http://localhost:4100").trim();

// Client dedie aux operations admin (commandes).
export const adminApi = axios.create({
  baseURL: adminServiceBaseURL || undefined,
  timeout: 15000
});

const catalogueApi = catalogueBaseURL
  ? axios.create({ baseURL: catalogueBaseURL, timeout: 15000 })
  : adminApi;

const attachAuthInterceptors = (client: AxiosInstance, service: "admin" | "catalogue") => {
  client.interceptors.request.use((config) => {
    const token = adminTokenStorage.get();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const anyError = error as { response?: { status?: number }; code?: string };
      if (anyError?.response?.status === 401) {
        adminTokenStorage.clear();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/connexion")) {
          window.location.replace("/connexion");
        }
      }

      const isNetworkLikeError =
        !anyError.response ||
        anyError.code === "ECONNABORTED" ||
        anyError.code === "ERR_NETWORK";

      if (isNetworkLikeError) {
        notifyServiceDown({ service });
      }

      return Promise.reject(error);
    }
  );
};

attachAuthInterceptors(adminApi, "admin");
if (catalogueApi !== adminApi) {
  attachAuthInterceptors(catalogueApi, "catalogue");
}

const isMock = !catalogueBaseURL;

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

type ListParams = { q?: string; page?: number; limit?: number };
type OrderListParams = ListParams & { status?: Order["status"] };

// Essaie d'unifier les reponses paginees quelles que soient les structures renvoyees par l'API.
const parseListResponse = <T>(response: AxiosResponse<any>, fallbackParams?: { page?: number; limit?: number }): PaginatedResult<T> => {
  const page = fallbackParams?.page ?? Number(response.data?.page ?? 1);
  const pageSize = fallbackParams?.limit ?? Number(response.data?.pageSize ?? response.data?.limit ?? 10);

  if (Array.isArray(response.data)) {
    const totalHeader = Number(response.headers?.["x-total-count"]);
    return {
      data: response.data as T[],
      total: Number.isFinite(totalHeader) ? totalHeader : response.data.length,
      page,
      pageSize
    };
  }

  if (Array.isArray(response.data?.data)) {
    return {
      data: response.data.data as T[],
      total: Number(response.data.total ?? response.data.count ?? response.data.data.length),
      page: Number(response.data.page ?? page),
      pageSize: Number(response.data.pageSize ?? pageSize)
    };
  }

  if (Array.isArray(response.data?.items)) {
    return {
      data: response.data.items as T[],
      total: Number(response.data.total ?? response.data.items.length),
      page: Number(response.data.page ?? page),
      pageSize: Number(response.data.pageSize ?? pageSize)
    };
  }

  return {
    data: [],
    total: 0,
    page,
    pageSize
  };
};

const PRODUCTS_KEY = "woodtech-admin-products";
const ORDERS_KEY = "woodtech-admin-orders";

// Jeu de donnees locaux pour alimenter l'interface lorsque l'API n'est pas accessible.
const defaultProducts: Product[] = [
  {
    id: "prod-1",
    title: "Table de ferme en chêne",
    description:
      "Table de ferme authentique en chêne massif, finitions huilées pour un rendu chaleureux et durable.",
    price: 2850,
    imageUrl: "/img/table-chene.jpg",
    category: "tables"
  },
  {
    id: "prod-2",
    title: "Armoire rustique sur mesure",
    description:
      "Armoire rustique en frêne avec rangements modulables, idéale pour une chambre ou une entrée.",
    price: 1980,
    imageUrl: "/img/armoire-rustique.webp",
    category: "armoires"
  }
];

const defaultOrders: Order[] = [
  {
    id: "order-1",
    items: [
      { productId: "prod-1", qty: 1 },
      { productId: "prod-2", qty: 2 }
    ],
    total: 6810,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    status: "pending"
  },
  {
    id: "order-2",
    items: [{ productId: "prod-2", qty: 1 }],
    total: 1980,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    status: "in_progress"
  }
];

// Utilitaires detaches pour simuler une latence reseau et generer des IDs.
const delay = (ms = 350) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const safeRandomId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
};

// Initialise le localStorage avec les jeux de donnees de demo.
const ensureMockSeed = () => {
  if (typeof window === "undefined") return;
  if (!window.localStorage.getItem(PRODUCTS_KEY)) {
    window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(defaultProducts));
  }
  if (!window.localStorage.getItem(ORDERS_KEY)) {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(defaultOrders));
  }
};

const readMockProducts = (): Product[] => {
  ensureMockSeed();
  if (typeof window === "undefined") return [...defaultProducts];
  const raw = window.localStorage.getItem(PRODUCTS_KEY);
  if (!raw) return [...defaultProducts];
  try {
    return JSON.parse(raw) as Product[];
  } catch {
    return [...defaultProducts];
  }
};

const writeMockProducts = (products: Product[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};

const readMockOrders = (): Order[] => {
  ensureMockSeed();
  if (typeof window === "undefined") return [...defaultOrders];
  const raw = window.localStorage.getItem(ORDERS_KEY);
  if (!raw) return [...defaultOrders];
  try {
    return JSON.parse(raw) as Order[];
  } catch {
    return [...defaultOrders];
  }
};

const writeMockOrders = (orders: Order[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

// Operations CRUD sur le catalogue cote admin (mock ou API reel).
export const Products = {
  async list(params?: ListParams): Promise<PaginatedResult<Product>> {
    if (isMock) {
      await delay();
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 10;
      const query = params?.q?.toLowerCase() ?? "";
      const products = readMockProducts();
      const filtered = query
        ? products.filter((product) =>
            [product.title, product.description, product.category]
              .join(" ")
              .toLowerCase()
              .includes(query)
          )
        : products;
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit);
      return { data, total: filtered.length, page, pageSize: limit };
    }

    const response = await catalogueApi.get("/catalogue/products", { params });
    return parseListResponse<Product>(response, { page: params?.page, limit: params?.limit });
  },

  async one(id: string): Promise<Product> {
    if (isMock) {
      await delay();
      const product = readMockProducts().find((item) => item.id === id);
      if (!product) {
        throw new Error("Produit introuvable");
      }
      return product;
    }

    const response = await catalogueApi.get<Product>(`/catalogue/products/${id}`);
    return response.data;
  },

  async create(payload: Omit<Product, "id">): Promise<Product> {
    if (isMock) {
      await delay();
      const products = readMockProducts();
      const newProduct: Product = { ...payload, id: safeRandomId("prod") };
      products.unshift(newProduct);
      writeMockProducts(products);
      return newProduct;
    }

    const response = await catalogueApi.post<Product>("/catalogue/products", payload);
    return response.data;
  },

  async update(id: string, payload: Omit<Product, "id">): Promise<Product> {
    if (isMock) {
      await delay();
      const products = readMockProducts();
      const index = products.findIndex((product) => product.id === id);
      if (index === -1) {
        throw new Error("Produit introuvable");
      }
      const updated: Product = { ...products[index], ...payload, id };
      products[index] = updated;
      writeMockProducts(products);
      return updated;
    }

    const response = await catalogueApi.put<Product>(`/catalogue/products/${id}`, payload);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    if (isMock) {
      await delay();
      const products = readMockProducts().filter((product) => product.id !== id);
      writeMockProducts(products);
      return;
    }

    await catalogueApi.delete(`/catalogue/products/${id}`);
  }
};

// Gestion des commandes (listing, detail, changement de statut).
export const Orders = {
  async list(params?: OrderListParams): Promise<PaginatedResult<Order>> {
    if (isMock) {
      await delay();
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 10;
      const query = params?.q?.toLowerCase() ?? "";
      const status = params?.status;
      const orders = readMockOrders();
      const filtered = orders.filter((order) => {
        const matchesStatus = status ? order.status === status : true;
        const matchesQuery = query
          ? order.id.toLowerCase().includes(query) ||
            order.items.some((item) => item.productId.toLowerCase().includes(query))
          : true;
        return matchesStatus && matchesQuery;
      });
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit);
      return { data, total: filtered.length, page, pageSize: limit };
    }

    const response = await adminApi.get("/orders", { params });
    return parseListResponse<Order>(response, { page: params?.page, limit: params?.limit });
  },

  async one(id: string): Promise<Order> {
    if (isMock) {
      await delay();
      const order = readMockOrders().find((item) => item.id === id);
      if (!order) {
        throw new Error("Commande introuvable");
      }
      return order;
    }

    const response = await adminApi.get<Order>(`/orders/${id}`);
    return response.data;
  },

  async updateStatus(id: string, status: Order["status"]): Promise<Order> {
    if (isMock) {
      await delay();
      const orders = readMockOrders();
      const index = orders.findIndex((order) => order.id === id);
      if (index === -1) {
        throw new Error("Commande introuvable");
      }
      const updated: Order = { ...orders[index], status };
      orders[index] = updated;
      writeMockOrders(orders);
      return updated;
    }

    const response = await adminApi.patch<Order>(`/orders/${id}`, { status });
    return response.data;
  }
};
export type { Product, Order, CartItem };
