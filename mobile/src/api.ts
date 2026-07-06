import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "./theme";

const api = axios.create({ baseURL: API_URL });

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && onUnauthorized) {
      await AsyncStorage.removeItem("token");
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  saved_address?: string;
  role: string;
}

export interface Company {
  id: string;
  name: string;
  description?: string;
  address?: string;
  rating_average: number;
  rating_count: number;
  logo_url?: string;
  brand_primary_color?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  is_available: boolean;
  order_method: string;
  company_id: string;
  category_id: string;
  rating_average: number;
  rating_count: number;
  image_url?: string;
  company?: Company;
  category?: { id: string; name: string };
}

export interface Order {
  id: string;
  status: string;
  payment_status: string;
  total_price: number;
  order_method: string;
  delivery_address?: string;
  created_at: string;
  company_id: string;
  company?: Company;
  items: { id: string; quantity: number; unit_price: number; product_id?: string; product?: Product }[];
}

export interface PaymentConfig {
  stripe_enabled: boolean;
  publishable_key?: string;
}

export interface WhiteLabelConfig {
  app_name: string;
  logo_url?: string | null;
  primary_color: string;
  secondary_color: string;
  welcome_text?: string;
  marketplace_mode_enabled: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ access_token: string }>("/auth/login", { email, password }),
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post("/auth/register", { ...data, role: "customer" }),
  me: () => api.get<User>("/auth/me"),
  updateProfile: (data: { name?: string; phone?: string; saved_address?: string }) =>
    api.put<User>("/auth/me", data),
  changePassword: (current_password: string, new_password: string) =>
    api.put("/auth/password", { current_password, new_password }),
  pushToken: (push_token: string) => api.put("/auth/push-token", { push_token }),
};

export const productApi = {
  list: (params?: { q?: string; lat?: number; lon?: number; category_id?: string; company_id?: string }) =>
    api.get<Product[]>("/products", { params }),
  get: (id: string) => api.get<Product>(`/products/${id}`),
  categories: () => api.get<{ id: string; name: string }[]>("/categories"),
};

export const companyApi = {
  get: (id: string) => api.get<Company>(`/companies/${id}`),
  list: () => api.get<Company[]>("/companies"),
};

export const orderApi = {
  create: (data: { company_id: string; items: { product_id: string; quantity: number }[]; order_method: string; delivery_address?: string }) =>
    api.post<Order>("/orders", data),
  my: () => api.get<Order[]>("/orders/my"),
  get: (id: string) => api.get<Order>(`/orders/${id}`),
  paymentConfig: (id: string) => api.get<PaymentConfig>(`/orders/${id}/payment-config`),
  checkout: (id: string) => api.post<{ checkout_url: string; session_id: string }>(`/orders/${id}/checkout`),
  pay: (id: string) => api.post<Order>(`/orders/${id}/pay`, { simulate_success: true }),
};

export const ratingApi = {
  product: (data: { product_id: string; rating: number; comment?: string }) =>
    api.post("/ratings/product", data),
  seller: (data: { company_id: string; rating: number; comment?: string }) =>
    api.post("/ratings/seller", data),
};

export const whiteLabelApi = {
  config: () => api.get<WhiteLabelConfig>("/white-label/config"),
};

export default api;

export function imageUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}
