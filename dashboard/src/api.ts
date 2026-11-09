import axios from "axios";
import { API_URL } from "./theme";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
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
  company_id?: string;
}

export interface Company {
  id: string;
  name: string;
  description?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  is_available: boolean;
  order_method: string;
  category_id: string;
  image_url?: string;
}

export interface Order {
  id: string;
  status: string;
  payment_status: string;
  subtotal?: number;
  delivery_fee?: number;
  tax_amount?: number;
  total_price: number;
  order_method: string;
  delivery_address?: string;
  created_at: string;
  items: { id: string; quantity: number; unit_price: number; product?: Product }[];
  customer?: { name: string; email: string; phone?: string };
}

export interface WhiteLabelConfig {
  app_name: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  marketplace_mode_enabled: boolean;
  ranking_boost_enabled: boolean;
  welcome_text?: string;
  company_id?: string;
  delivery_fee_flat?: number;
  tax_rate_percent?: number;
  banner_title?: string;
  banner_subtitle?: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ access_token: string }>("/auth/login", { email, password }),
  me: () => api.get<User>("/auth/me"),
  updateProfile: (data: { name?: string; phone?: string; saved_address?: string }) =>
    api.put<User>("/auth/me", data),
  changePassword: (current_password: string, new_password: string) =>
    api.put("/auth/password", { current_password, new_password }),
};

export const sellerApi = {
  products: () => api.get<Product[]>("/seller/products"),
  createProduct: (data: Partial<Product> & { category_id: string; name: string; price: number }) =>
    api.post<Product>("/seller/products", data),
  updateProduct: (id: string, data: Partial<Product>) => api.put<Product>(`/seller/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/seller/products/${id}`),
  orders: () => api.get<Order[]>("/seller/orders"),
  order: (id: string) => api.get<Order>(`/seller/orders/${id}`),
  updateOrderStatus: (id: string, status: string) =>
    api.put<Order>(`/seller/orders/${id}/status`, { status }),
  company: () => api.get<Company>("/seller/company"),
  updateCompany: (data: Partial<Company>) => api.put<Company>("/seller/company", data),
  whiteLabel: () => api.get<WhiteLabelConfig>("/seller/white-label/config"),
  updateWhiteLabel: (data: Partial<WhiteLabelConfig>) =>
    api.put<WhiteLabelConfig>("/seller/white-label/config", data),
};

export const publicApi = {
  categories: () => api.get<{ id: string; name: string }[]>("/categories"),
};

export const filesApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<{ url: string }>("/files/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export function imageUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
}

export default api;
