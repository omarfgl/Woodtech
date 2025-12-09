// Typages partages entre le front et les helpers pour garantir une structure coherente.
export type Category = "tables" | "portes" | "armoires" | "autres";

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  category: Category;
};

export type CartItem = {
  productId: string;
  qty: number;
};

export type OrderStatus = "pending" | "in_progress" | "completed";

export type Order = {
  id: string;
  items: CartItem[];
  total: number;
  createdAt: string;
  status: OrderStatus;
};

export type UserRole = "user" | "admin";

export type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name: string;
  role: UserRole;
  createdAt: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthSession = {
  user: User;
  tokens: AuthTokens;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export type RegisterPayload = AuthCredentials & {
  name: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};
