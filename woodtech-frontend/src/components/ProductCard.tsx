import { Link } from "react-router-dom";
import type { Product } from "../types";

type ProductCardProps = {
  p: Product;
};

// Carte visuelle d'un produit affichee dans les listes (catalogue, home).
export default function ProductCard({ p }: ProductCardProps) {
  return (
    <article className="group rounded-2xl overflow-hidden bg-brand-800 border border-white/10 shadow-lg shadow-black/20 transition-transform hover:-translate-y-1">
      <Link to={`/produit/${p.id}`} className="block h-full">
        <img
          src={p.imageUrl}
          alt={p.title}
          className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="p-4">
          <h3 className="text-lg font-semibold">{p.title}</h3>
          <p className="text-sm text-white/70 line-clamp-2">{p.description}</p>
          <div className="mt-3 text-brand-100 font-medium">
            ${p.price.toFixed(2)}
          </div>
        </div>
      </Link>
    </article>
  );
}
