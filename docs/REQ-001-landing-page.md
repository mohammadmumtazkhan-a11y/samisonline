# REQ-001: Static Landing Page + Send Money Entry Point

## User Story
As a Samis Online customer, I want to see the familiar Samis Online homepage so I feel I'm on the partner website, and I want a prominent "Send Money" button in the header so I can easily start a money transfer.

## Acceptance Criteria

| ID | Criteria |
|----|----------|
| AC-1 | Header displays SAM'S logo (assets/logo.svg), search bar (static), My Cart icon, Login/Signup |
| AC-2 | Header includes teal "Send Money" button between search and cart/login — stands out from purple brand |
| AC-3 | "Send Money" button navigates to `/send-money` route |
| AC-4 | Placeholder page at `/send-money` (branded "Money Transfer — Coming Soon") |
| AC-5 | Nav bar: Browse Categories, Beverages & Cereals, Pantry, Catering, Ready Made Meals, Products by Nationality, Recipes (static) |
| AC-6 | Hero banner area with promotional banner |
| AC-7 | Notice bar: website notice + contact email + phone |
| AC-8 | Trust badges: Fast Delivery, Fair Price, Quality Product, (4.2) Google Review with icons |
| AC-9 | Product sections: Today's Deals, Back in Stock, Health & Beauty, Spices & Seasonings, Delicious Ready Meals — mock data |
| AC-10 | Product cards: image, title, weight, price, "Add to Cart" (static) |
| AC-11 | Flash Sale banner with CTA (static) |
| AC-12 | Shop by Category: icon circles |
| AC-13 | Shop by Country: flag cards |
| AC-14 | Newsletter: email input + Subscribe → toast "Coming soon" |
| AC-15 | Footer: Contact Info, Help & Support, Business, Legal + social icons + Visa/Mastercard |
| AC-16 | Fully responsive — mobile-friendly, Send Money becomes icon-only on < 640px |
| AC-17 | All styling uses CLAUDE.md theme (purple, teal, gold, Plus Jakarta Sans + Inter) |
| AC-18 | Overall look matches Samis Online website screenshot |

## Static vs Functional
- **Functional:** Send Money button (navigation), Newsletter subscribe (toast)
- **Static/Mocked:** Search, cart, login, nav items, products, footer links, Add to Cart

## Notes
- Product images: placeholder colored boxes or generic food images
- Send Money button is the critical functional element
- Mobile < 640px: Send Money shows icon only (no text)
