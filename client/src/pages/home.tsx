import { useState } from "react";
import {
  Truck,
  BadgeCheck,
  Star,
  Tag,
  Mail,
  Phone,
  ArrowRight,
  Croissant,
  Beef,
  Cookie,
  CupSoda,
  Flame,
  Heart,
  Coffee,
  Warehouse,
  UtensilsCrossed,
  Carrot,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ProductSection from "@/components/product-section";
import {
  todaysDeals,
  backInStock,
  healthBeauty,
  spicesSeasonings,
  readyMeals,
  categories,
  countries,
  brands,
} from "@/data/products";

// Map icon names to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Croissant, Beef, Cookie, CupSoda, Flame, Heart, Coffee, Warehouse, UtensilsCrossed, Carrot,
};

export default function HomePage() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Coming soon!", description: "Newsletter subscription is coming soon." });
    setEmail("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Hero Banner — actual image from samisonline.com */}
        <section className="w-full">
          <img
            src="/assets/hero-banner.png"
            alt="Easter Dispatch Notice — Last day for dispatch is Wednesday 1st April at 12PM"
            className="w-full h-auto object-cover"
          />
        </section>

        {/* Notice Bar — below hero like the screenshot */}
        <div className="bg-white border-b border-gray-200">
          <div className="w-full px-5 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <p className="text-gray-600">
              <span className="font-semibold text-primary">New Website Notice:</span>{" "}
              We launched our new website! If you experience any issues, please contact us.
            </p>
            <div className="flex items-center gap-4 text-gray-500 shrink-0">
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                orders@samisonline.com
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                07944 591421
              </span>
            </div>
          </div>
        </div>

        {/* Trust Badges — flat inline row */}
        <div className="border-b border-gray-200 bg-white">
          <div className="w-full px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-y-2">
              {[
                { icon: Truck, title: "Fast Delivery", desc: "Right to your door, on time." },
                { icon: Tag, title: "Fair Price", desc: "Great value for every basket." },
                { icon: BadgeCheck, title: "Quality Product", desc: "Fresh, trusted, and reliable." },
                { icon: Star, title: "(4.2) Google Review", desc: "Loved by happy customers." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-gray-800">{title}</span>
                    <span className="text-[10px] text-gray-400 ml-1 hidden md:inline">{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product Sections */}
        <div className="w-full px-5">
          <ProductSection title="Today's Deals" products={todaysDeals} />
          <ProductSection title="Back in Stock" products={backInStock} />
          <ProductSection title="Health & Beauty Products" products={healthBeauty} />
          <ProductSection title="Spices & Seasonings" products={spicesSeasonings} />
          <ProductSection title="Delicious Ready Meals" products={readyMeals} badge="New available" />
        </div>

        {/* Flash Sale Banner — full width, dark */}
        <section className="my-6">
          <div className="w-full px-5">
            <div className="bg-gray-900 rounded-xl overflow-hidden relative py-10 sm:py-14 text-center">
              {/* Decorative dots */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-full h-full"
                  style={{
                    backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
              </div>
              <div className="relative z-10">
                <h2 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl text-white italic leading-none mb-2">
                  Flash <span className="text-accent">Sale</span>
                </h2>
                <p className="text-gray-400 text-sm mb-6">24-hour flash sale</p>
                <button className="bg-accent hover:bg-accent/90 text-gray-900 font-bold rounded-full px-8 py-2.5 text-sm transition-colors inline-flex items-center gap-2">
                  Grab the best
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Shop by Category — Lucide icons in circles */}
        <section className="py-6">
          <div className="w-full px-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-display font-bold text-gray-900">
                Shop by Category
              </h2>
              <span className="text-xs text-primary font-medium cursor-pointer hover:underline">
                See All Items →
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-3">
              {categories.map((cat) => {
                const IconComp = iconMap[cat.icon];
                return (
                  <button
                    key={cat.name}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                      {IconComp && <IconComp className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />}
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-center text-gray-600 font-medium leading-tight max-w-[80px]">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Shop by Country — real flag images */}
        <section className="py-6">
          <div className="w-full px-5">
            <h2 className="text-lg font-display font-bold text-gray-900 mb-5">
              Shop by Country
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {countries.map((country) => (
                <button
                  key={country.name}
                  className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col items-center gap-3 hover:shadow-md hover:border-primary/30 transition-all group"
                >
                  <img
                    src={country.flagUrl}
                    alt={`${country.name} flag`}
                    className="w-24 h-16 object-cover rounded shadow-sm group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <span className="text-xs font-semibold text-gray-700">
                    {country.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="bg-primary py-10 sm:py-14">
          <div className="max-w-2xl mx-auto px-5 text-center">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white mb-2">
              Subscribe to our newsletter
            </h2>
            <p className="text-white/60 text-xs sm:text-sm mb-5">
              Get the latest deals, fresh arrivals, and cooking tips delivered straight to your inbox.
            </p>
            <form
              onSubmit={handleSubscribe}
              className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto"
            >
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 rounded px-4 py-2.5 text-sm text-gray-900 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="submit"
                className="bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded px-5 py-2.5 text-sm transition-colors inline-flex items-center justify-center gap-1.5"
              >
                SUBSCRIBE
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </section>

        {/* Brand Logos — real SVG images from samisonline.com */}
        <section className="py-8 border-b border-gray-100">
          <div className="w-full px-5">
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <img
                  key={num}
                  src={`/assets/brands/brand_image_0${num}.svg`}
                  alt={brands[num - 1] || `Brand ${num}`}
                  className="h-10 sm:h-12 w-auto opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
