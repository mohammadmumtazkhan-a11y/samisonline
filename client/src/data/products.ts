export interface Product {
  id: number;
  name: string;
  weight: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  outOfStock?: boolean;
}

export interface Category {
  name: string;
  icon: string;
}

export interface Country {
  name: string;
  flagUrl: string;
}

export const todaysDeals: Product[] = [
  { id: 1, name: "Blue swimming crab cut", weight: "1kg", price: 8.99, image: "/assets/products/blue-swimming-crab.webp" },
  { id: 2, name: "Frozen Cleaned Red Bream Fish Headless (cut)", weight: "1kg", price: 15.0, image: "/assets/products/red-bream-fish.jpeg" },
  { id: 3, name: "Samis Bundle ( Protein combo ) - Frozen", weight: "Bundle", price: 119.99, image: "/assets/products/samis-bundle-protein.jpeg", badge: "SAM'S" },
  { id: 4, name: "Badia Jolof Rice Seasoning 163G", weight: "163g", price: 3.99, image: "/assets/products/badia-jollof.webp" },
  { id: 5, name: "Badia Cebolla en Polvo/ Onion Powder", weight: "78g", price: 3.99, image: "/assets/products/badia-cebolla-onion.webp" },
  { id: 6, name: "Badia Barbecue Seasoning 99.2g", weight: "99g", price: 3.99, image: "/assets/products/badia-barbecue.webp" },
];

export const backInStock: Product[] = [
  { id: 7, name: "Nigerian Indomie Chicken White Box", weight: "70g x 40", price: 9.99, image: "/assets/products/indomie-chicken.jpg" },
  { id: 8, name: "Maltina Can 300Ml Case", weight: "330ml x 24", price: 18.99, image: "/assets/products/maltina-can.jpg" },
  { id: 9, name: "Frozen Hot Scotch Bonnet Jamaican Pepper", weight: "200g", price: 5.49, image: "/assets/products/scotch-bonnet-pepper.jpg" },
  { id: 10, name: "Frozen Ologi (Ogi, Akamu, Pap) Yellow Corn", weight: "500g", price: 5.99, image: "/assets/products/ologi-yellow-corn.jpg", outOfStock: true },
  { id: 11, name: "Ata Rodo Scotch Bonnet (Hot pepper)", weight: "500g", price: 31, image: "/assets/products/ata-rodo-scotch-bonnet.jpg", outOfStock: true },
];

export const healthBeauty: Product[] = [
  { id: 12, name: "PQA Jimpo Ori Organic Unrefined Shea Butter...", weight: "500ml", price: 5.99, image: "/assets/products/badia-jollof.webp" },
  { id: 13, name: 'Expression hair 7x prestretched 54" Col...', weight: "Pack", price: 7.99, image: "/assets/products/badia-cebolla-onion.webp" },
  { id: 14, name: 'Expression hair 7x prestretched 54" Col 1/1B13', weight: "Pack", price: 7.99, image: "/assets/products/badia-barbecue.webp" },
  { id: 15, name: 'Expression hair 7x prestretched 54" Col 4', weight: "Pack", price: 8.99, image: "/assets/products/blue-swimming-crab.webp" },
  { id: 16, name: 'Expression hair 7x prestretched 54" Col Ib', weight: "Pack", price: 8.99, image: "/assets/products/red-bream-fish.jpeg" },
];

export const spicesSeasonings: Product[] = [
  { id: 17, name: "Badia Barbecue Seasoning 99.2g", weight: "99.2g", price: 3.99, image: "/assets/products/badia-barbecue.webp" },
  { id: 18, name: "Badia Cebolla en Polvo/ Onion Powder", weight: "78g", price: 3.99, image: "/assets/products/badia-cebolla-onion.webp" },
  { id: 19, name: "Badia Jolof Rice Seasoning 163G", weight: "163g", price: 3.99, image: "/assets/products/badia-jollof.webp" },
  { id: 20, name: "Badia Jerk Seasoning 114.7g", weight: "114.7g", price: 3.99, image: "/assets/products/badia-barbecue.webp" },
  { id: 21, name: "Badia Complete Seasoning (340.2g)", weight: "340.2g", price: 3.99, image: "/assets/products/badia-cebolla-onion.webp" },
];

export const readyMeals: Product[] = [
  { id: 22, name: "Frozen Ologi (Ogi, Akamu, Pop) White Corn and...", weight: "1kg", price: 5.99, image: "/assets/products/ologi-yellow-corn.jpg", badge: "SAM'S" },
  { id: 23, name: "Oyetriys Assorted Fish Stew (1 Litre)", weight: "1L", price: 18.99, image: "/assets/products/scotch-bonnet-pepper.jpg" },
  { id: 24, name: "Oyetriys Assorted Meat Stew (1 litre)", weight: "1L", price: 18.99, image: "/assets/products/indomie-chicken.jpg" },
  { id: 25, name: "Oyetriys Smokey Jollof Rice (1.6 litres)", weight: "1.6L", price: 15.99, image: "/assets/products/maltina-can.jpg" },
  { id: 26, name: "Oyetriymacils Nkwobi (1 Litre)", weight: "1L", price: 19.99, image: "/assets/products/samis-bundle-protein.jpeg" },
];

// Lucide icon names for categories
export const categories: Category[] = [
  { name: "Bakery", icon: "Croissant" },
  { name: "Frozen Meat, Fish & Poultry", icon: "Beef" },
  { name: "Snacks & Confectionery", icon: "Cookie" },
  { name: "Drink", icon: "CupSoda" },
  { name: "Sauces, Spices & Seasonings", icon: "Flame" },
  { name: "Health & Beauty", icon: "Heart" },
  { name: "Beverages & Cereals", icon: "Coffee" },
  { name: "Pantry", icon: "Warehouse" },
  { name: "Catering", icon: "UtensilsCrossed" },
  { name: "Vegetable & Fresh Produce", icon: "Carrot" },
];

// Real flag images
export const countries: Country[] = [
  { name: "Cameroon", flagUrl: "https://flagcdn.com/w320/cm.png" },
  { name: "Caribbean-West Indies", flagUrl: "https://flagcdn.com/w320/jm.png" },
  { name: "Ghana", flagUrl: "https://flagcdn.com/w320/gh.png" },
  { name: "South Africa", flagUrl: "https://flagcdn.com/w320/za.png" },
  { name: "Zimbabwe", flagUrl: "https://flagcdn.com/w320/zw.png" },
];

export const navItems = [
  "Browse Categories",
  "Beverages & Cereals",
  "Pantry",
  "Catering",
  "Ready Made Meals",
  "Products by Nationality",
  "Recipes",
];

export const brands = [
  "Cadbury",
  "Nestle",
  "Robertsons",
  "Tilda",
  "Tropical Sun",
  "Unilever",
];
