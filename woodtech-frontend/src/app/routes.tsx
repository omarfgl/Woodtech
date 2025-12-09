import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import ErrorPage from "@/components/ErrorPage";

const HomePage = lazy(() => import("../pages/Home"));
const CataloguePage = lazy(() => import("../pages/Catalogue"));
const ProductDetailPage = lazy(() => import("../pages/ProductDetail"));
const CartPage = lazy(() => import("../pages/Cart"));
const ContactPage = lazy(() => import("../pages/Contact"));
const AssistantPage = lazy(() => import("../pages/Assistant"));
const LoginPage = lazy(() => import("../pages/Login"));
const RegisterPage = lazy(() => import("../pages/Register"));
const AdminApp = lazy(() => import("../admin/AppAdmin"));

// Le router regroupe la navigation publique et la zone admin (chargement lazy pour optimiser le bundle).
export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "catalogue", element: <CataloguePage /> },
      { path: "produit/:id", element: <ProductDetailPage /> },
      { path: "panier", element: <CartPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "assistant", element: <AssistantPage /> },
      { path: "connexion", element: <LoginPage /> },
      { path: "inscription", element: <RegisterPage /> }
    ]
  },
  {
    path: "/admin/*",
    element: <AdminApp />,
    errorElement: <ErrorPage />
  }
]);
