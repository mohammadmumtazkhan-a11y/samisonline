import { cn } from "@/lib/utils";
import type { Product } from "@/data/products";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-white group flex flex-col h-full">
      {/* Image — tall aspect, white bg, no border */}
      <div className="relative aspect-[3/4] bg-white overflow-hidden rounded-md">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {product.badge && (
          <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
            {product.badge}
          </span>
        )}
        {/* No overlay on image for out of stock — button changes instead */}
      </div>

      {/* Details */}
      <div className="pt-3 pb-1 flex flex-col flex-1">
        <h3 className="text-sm text-black line-clamp-2 leading-snug mb-0.5">
          {product.name}
        </h3>
        <p className="text-xs text-gray-400 mb-2">{product.weight}</p>
        <p className="text-[#49256a] font-bold text-2xl mt-auto">
          &pound;{product.price.toFixed(2)}
        </p>
        {/* Add To Cart — left-aligned pill, matching screenshot */}
        <button
          disabled={product.outOfStock}
          className={cn(
            "mt-2 w-fit text-sm font-semibold py-1.5 px-6 rounded-full transition-colors",
            product.outOfStock
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-secondary text-black hover:bg-secondary/80"
          )}
        >
          {product.outOfStock ? "Out of Stock" : "Add To Cart"}
        </button>
      </div>
    </div>
  );
}
