import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { Products } from "../api/adminApi";
import type { Product } from "@/types";

// Validation cote admin pour limiter les erreurs de saisie.
const productSchema = z.object({
  title: z.string().min(2, "Le titre doit comporter au moins 2 caractères."),
  description: z.string().min(10, "La description doit comporter au moins 10 caractères."),
  price: z.coerce.number().positive("Le prix doit être supérieur à 0."),
  imageUrl: z.string().url("L'URL de l'image doit être valide."),
  category: z.enum(["tables", "portes", "armoires", "autres"])
});

type ProductFormValues = z.infer<typeof productSchema>;

const defaultValues: ProductFormValues = {
  title: "",
  description: "",
  price: 0,
  imageUrl: "",
  category: "tables"
};

// Formulaire de creation/edition de produit.
export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialProduct, setInitialProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues
  });

  // Si un id est present on charge le produit pour pre-remplir le formulaire.
  useEffect(() => {
    let cancelled = false;
    const loadProduct = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const product = await Products.one(id);
        if (cancelled) return;
        setInitialProduct(product);
        reset({
          title: product.title,
          description: product.description,
          price: product.price,
          imageUrl: product.imageUrl,
          category: product.category
        });
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Impossible de charger le produit demandé.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProduct();
    return () => {
      cancelled = true;
    };
  }, [id, reset]);

  // Soumission unique (create ou update selon la presence d'un id).
  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      if (id) {
        await Products.update(id, values);
      } else {
        await Products.create(values);
      }
      navigate("/admin/produits");
    } catch (err) {
      console.error(err);
      setFormError("Impossible d'enregistrer le produit. Merci de réessayer.");
    }
  });

  const handleCancel = () => navigate("/admin/produits");

  useEffect(() => {
    if (!id) {
      setValue("price", 0);
    }
  }, [id, setValue]);

  const pageTitle = id ? "Modifier le produit" : "Créer un produit";
  const subtitle = id
    ? "Mettez à jour les informations d'une création existante."
    : "Ajoutez une nouvelle réalisation au catalogue WoodTech.";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">{pageTitle}</h2>
        <p className="text-sm text-white/60">{subtitle}</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-6 text-center text-white/60">
          Chargement des informations du produit...
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="grid gap-6 rounded-3xl border border-white/10 bg-brand-900/70 p-6 shadow-xl shadow-black/30 backdrop-blur lg:grid-cols-[1.1fr,0.9fr]"
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-white">
                Titre
              </label>
              <input
                id="title"
                type="text"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-brand-400 focus:outline-none"
                placeholder="Ex. Table basse en noyer"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-red-200">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-white">
                Description
              </label>
              <textarea
                id="description"
                rows={6}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-brand-400 focus:outline-none"
                placeholder="Décrivez la fabrication, les essences utilisées, les finitions..."
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-red-200">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="imageUrl" className="text-sm font-medium text-white">
                URL de l'image
              </label>
              <input
                id="imageUrl"
                type="url"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-brand-400 focus:outline-none"
                placeholder="https://..."
                {...register("imageUrl")}
              />
              {errors.imageUrl && (
                <p className="text-xs text-red-200">{errors.imageUrl.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium text-white">
                Prix (€)
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-brand-400 focus:outline-none"
                placeholder="0.00"
                {...register("price")}
              />
              {errors.price && (
                <p className="text-xs text-red-200">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium text-white">
                Catégorie
              </label>
              <select
                id="category"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-brand-400 focus:outline-none"
                {...register("category")}
              >
                <option value="tables">Tables</option>
                <option value="portes">Portes</option>
                <option value="armoires">Armoires</option>
                <option value="autres">Autres</option>
              </select>
              {errors.category && (
                <p className="text-xs text-red-200">{errors.category.message}</p>
              )}
            </div>

            {formError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {formError}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-400 disabled:opacity-60"
              >
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-2 text-sm text-white/80 transition-colors hover:border-white/40 hover:text-white"
              >
                Annuler
              </button>
            </div>

            {initialProduct && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/60">
                <p>ID produit : {initialProduct.id}</p>
                <p>Catégorie : {initialProduct.category}</p>
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
