import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthProvider } from "../store/auth";
import { CartProvider } from "../store/cart";
import { LangProvider } from "../store/lang";
import { ThemeProvider } from "@/store/theme";
import { useTranslate } from "@/lib/i18n";

// Ce composant empile tous les contextes (theme, langue, auth, panier) autour du router.
export function AppProviders() {
  const translate = useTranslate();

  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <CartProvider>
            {/* Suspense affiche un texte simple pendant le chargement lazy des pages */}
            <Suspense
              fallback={
                <div className="p-6 text-center">
                  {translate("common.loading")}
                </div>
              }
            >
              <RouterProvider router={router} />
            </Suspense>
          </CartProvider>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}
