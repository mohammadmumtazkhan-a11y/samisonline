import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import ProductCard from "./product-card";
import type { Product } from "@/data/products";
import { cn } from "@/lib/utils";

interface ProductSectionProps {
  title: string;
  products: Product[];
  badge?: string;
}

export default function ProductSection({ title, products, badge }: ProductSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 400;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-6 border-b border-gray-100 last:border-b-0">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-black">
            {title}
          </h2>
          {badge && (
            <span className="bg-teal text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <span className="text-sm text-primary font-medium cursor-pointer hover:underline flex items-center gap-1">
          See All Items
          <ChevronRight className="w-4 h-4" />
        </span>
      </div>

      {/* Scrollable product row — wide cards, matching screenshot */}
      <div className="relative group/section">
        {/* Left Arrow */}
        <button
          onClick={() => scroll("left")}
          className={cn(
            "absolute -left-3 top-[35%] -translate-y-1/2 z-10",
            "w-10 h-10 rounded-full bg-white shadow-md border border-gray-200",
            "flex items-center justify-center",
            "opacity-0 group-hover/section:opacity-100 transition-opacity",
            "hover:bg-gray-50"
          )}
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          className={cn(
            "absolute -right-3 top-[35%] -translate-y-1/2 z-10",
            "w-10 h-10 rounded-full bg-white shadow-md border border-gray-200",
            "flex items-center justify-center",
            "opacity-0 group-hover/section:opacity-100 transition-opacity",
            "hover:bg-gray-50"
          )}
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>

        {/* Products Row — fill full width, no trailing whitespace */}
        <div
          ref={scrollRef}
          className="grid grid-flow-col auto-cols-[minmax(160px,1fr)] gap-4 overflow-x-auto scrollbar-hide"
          style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              style={{ scrollSnapAlign: "start" }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
