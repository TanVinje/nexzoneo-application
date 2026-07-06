import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { ToastProvider } from "./Toast";
import Layout from "./Layout";
import LoginPage from "./pages/LoginPage";
import OverviewPage from "./pages/OverviewPage";
import ProductsPage from "./pages/ProductsPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import BrandingPage from "./pages/BrandingPage";
import ProfilePage from "./pages/ProfilePage";
import { globalStyles } from "./styles";

const style = document.createElement("style");
style.textContent = globalStyles;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />
            <Route path="/branding" element={<BrandingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);
