import { Navigate, type RouteObject } from "react-router-dom";
import { RequireAuth } from "./guard";
import AdminLayout from "./layout/AdminLayout";
import DashboardPage from "./pages/Dashboard";
import ProductsListPage from "./pages/ProductsList";
import ProductFormPage from "./pages/ProductForm";
import OrdersListPage from "./pages/OrdersList";
import OrderDetailPage from "./pages/OrderDetail";

// Routes imbriquees de l'espace admin (protegees par RequireAuth).
export const adminRoutes: RouteObject[] = [
  {
    path: "login",
    element: <Navigate to="/connexion" replace />
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <DashboardPage />
          },
          {
            path: "produits",
            element: <ProductsListPage />
          },
          {
            path: "produits/nouveau",
            element: <ProductFormPage />
          },
          {
            path: "produits/:id",
            element: <ProductFormPage />
          },
          {
            path: "commandes",
            element: <OrdersListPage />
          },
          {
            path: "commandes/:id",
            element: <OrderDetailPage />
          }
        ]
      }
    ]
  }
];
