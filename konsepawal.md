Build MIKADAY, a professional English-language lifestyle website combining an AI influencer’s personal world, an editorial journal, and an international online store selling original designs fulfilled through Printful.

Implement the website, rather than only describing a design concept.

BRAND AND CHARACTER

Brand name: MIKADAY.
Character name: Mika.
Tagline: “Create. Sip. Explore.”

Mika is an original fictional American woman, age 28, based in Portland, Oregon. She is an AI virtual creator whose fictional lifestyle revolves around freelance design, coffee, everyday style, and weekend adventures.

Appearance:

- Beautiful adult woman with natural, approachable features.
- Chin-length dark brown bob.
- Distinctive translucent amber-orange glasses.
- Warm brown eyes and a friendly smile.
- Natural skin texture and understated makeup.
- Relaxed, tasteful clothing in cream, black, and earthy colors.

Keep her face, hairstyle, glasses, and overall identity consistent throughout the website. Her beauty should feel natural and relatable, with credible everyday photography.

Her fictional US location does not imply that products are manufactured in the United States or that the store operator is based there.

Clearly identify Mika as an AI virtual creator. Explain that her lifestyle stories are fictional, while the products are real items sold by MIKADAY. Do not create fabricated personal testimonials.

MIKADAY owns the storefront and original collections. Printful is the production and fulfillment provider. Do not imply an official Printful endorsement or partnership.

AUDIENCE AND LANGUAGE

- All customer-facing content must be in natural American English.
- Write for an international audience.
- Default display currency: USD.
- Keep currency configuration centralized.
- Only offer additional currencies when real pricing and payment support are connected.
- Product availability, shipping destinations, costs, and delivery estimates must come from verified store and fulfillment data.
- Do not promise delivery to every country or publish unsupported worldwide delivery claims.

TECHNOLOGY

Use:

- Next.js with App Router.
- JavaScript.
- Tailwind CSS.
- shadcn/ui.
- Lucide React.

Use the versions installed in the project and their supported conventions.

Use Server Components by default. Add Client Components only where interaction requires them.

Separate content, product data, and external integrations from presentation components. Prepare content adapters for a future SaCMS connection and server-side integration with a commerce backend and Printful.

VISUAL DIRECTION

Create a simple, professional lifestyle storefront with editorial photography, generous spacing, readable typography, and clear shopping actions.

The website should feel like entering Mika’s creative world while making products easy to discover and purchase.

Color tokens:

- Main background: #FAF7F2.
- White surface: #FFFFFF.
- Alternate section background: #F1EBE3.
- Primary text: #242424.
- Secondary text: #655E57.
- Decorative orange accent: #E87932.
- Primary button: #B94716.
- Primary button hover: #96380F.
- Button text: #FFFFFF.
- Border: #DDD5CB.
- Focus ring: #B94716.
- Success: #26734D.
- Error: #B42318.

Use the brighter orange for decorative accents. Use the darker orange for white-text buttons. Verify WCAG AA contrast.

Typography:

- Manrope or Inter for body text and navigation.
- Optionally use a restrained editorial serif for major headings.
- Limit the site to two font families.
- Use responsive typography with clamp().

Layout:

- Maximum content width around 1200px.
- Horizontal padding: 16px mobile, 24px tablet, 32px desktop.
- Consistent spacing scale.
- Card radius: 12–16px.
- Button radius: 8px.
- Subtle borders and minimal shadows.

Avoid excessive gradients, glassmorphism, oversized navigation, autoplay video, unnecessary carousels, intrusive pop-ups, and decorative elements that compete with products.

IMAGES AND PRODUCT ACCURACY

Use supplied character images as visual references. Apply the revised American character brief consistently. Do not present photographs of unrelated real people as Mika.

If approved images are unavailable, create clean, replaceable image placeholders.

Use actual product images or verified mockups for purchasing decisions. AI lifestyle images must preserve the product’s shape, artwork, print placement, and proportions.

Do not imply that a lifestyle mockup is a photograph of a physical sample. Label conceptual imagery where appropriate.

INITIAL COLLECTION

Collection name: Mountain Sunset.

Initial products:

- Mountain Sunset Mug.
- Mountain Sunset Tee.
- Mountain Sunset Tote.
- Mountain Sunset Hoodie.

Use coordinated original mountain, sun, and river illustrations.

Treat these as sample catalog entries until actual Printful product models and variants are selected. Do not invent materials, certifications, product dimensions, ratings, or fulfillment information.

SITE STRUCTURE

Create:

- Home: /
- Meet Mika: /meet-mika
- Shop: /shop
- Product details: /shop/[slug]
- Collections: /collections
- Collection details: /collections/[slug]
- Journal: /journal
- Journal article: /journal/[slug]
- Cart: /cart
- Contact: /contact
- FAQ: /faq
- Shipping: /shipping
- Returns: /returns
- Privacy: /privacy
- Terms: /terms

HEADER

- MIKADAY wordmark on the left.
- Navigation: Meet Mika, Journal, Shop, Collections.
- Product search and cart icon with item count.
- Compact sticky header.
- Accessible mobile navigation drawer.
- All links must lead to functioning routes.

HOME PAGE

1. Hero

Use a two-column desktop layout and a stacked mobile layout.

Visual:
Mika in a warm creative workspace, holding a black Mountain Sunset Mug.

Eyebrow:
“COFFEE. CREATIVITY. EVERYDAY ADVENTURES.”

Headline:
“Make room for the little things.”

Supporting text:
“Meet Mika, a virtual creator exploring thoughtful design, slow mornings, and everyday adventures. Discover original pieces inspired by her world.”

Primary button:
“Shop the Collection”

Secondary button:
“Meet Mika”

Include a small, readable “AI virtual creator” identifier.

2. A Little About Mika

Introduce her fictional creative lifestyle with a portrait and short editorial text.

Link:
“Step Into My World”

3. Everyday Favorites

Display four featured products with:

- Accurate product image.
- Name.
- Price.
- Available options.
- “Choose Options” when variant selection is required.

Do not add unsupported “Bestseller,” scarcity, or popularity labels.

4. Shop the Moment

Display a lifestyle scene of Mika at her desk, with the mug, tee, or tote appearing naturally.

Show accessible product links or product cards connected to the scene. Product discovery must work without hover.

5. Mountain Sunset Collection

Create a visually distinctive collection section with coordinated product photography.

Heading:
“A little wilderness, wherever you are.”

Button:
“Explore Mountain Sunset”

6. From Mika’s Journal

Show three editorial previews:

- “A Slow Morning at My Desk”
- “The Sketch Behind Mountain Sunset”
- “What I Pack for a Creative Afternoon”

Each article includes relevant product links.

7. Follow Mika

Provide configurable social links for Instagram, TikTok, YouTube, and Facebook.

Do not invent account URLs, follower counts, or engagement metrics. Hide unavailable links gracefully.

8. Footer

Include store navigation, customer support, policies, and a concise AI character disclosure.

MEET MIKA PAGE

Create a warm editorial profile with:

- Consistent character portrait.
- Personality and interests.
- Her fictional work as a freelance designer.
- Coffee, illustration, style, and outdoor inspiration.
- Related journal entries and products.
- Clear disclosure of her fictional AI identity.

Do not fabricate real clients, professional credentials, actual travel experiences, or product ownership claims.

SHOP PAGE

Include:

- Search.
- Category filters.
- Collection filter.
- Price filter.
- Color filter.
- Sorting by Featured, Price Low to High, and Price High to Low.
- Product count.
- Clear filters action.
- Useful empty state.
- Mobile filter drawer.

Categories:

- Drinkware.
- Clothing.
- Bags & Accessories.

PRODUCT DETAIL PAGE

Include:

- Image gallery with thumbnails.
- Product name and price.
- Description.
- Color and size selection.
- Variant-specific availability.
- Quantity selector.
- Add to Cart.
- Materials and care information when verified.
- Size guide when relevant.
- Shipping and returns information.
- Collection story.
- Related products.

Require a valid variant before adding to cart.

Do not display fabricated reviews, ratings, crossed-out prices, discounts, stock warnings, or delivery dates.

JOURNAL

Build an editorial listing and readable article pages.

Support:

- Cover image.
- Title.
- Category.
- Excerpt.
- Article content.
- Publication date.
- Related product IDs.

Use readable line lengths and comfortable paragraph spacing.

Keep fictional lifestyle storytelling distinct from factual product specifications.

CART AND CHECKOUT

Implement:

- Add item.
- Update quantity.
- Remove item.
- Preserve selected variant.
- Correct subtotal calculations.
- Cart persistence through localStorage.
- Helpful empty cart state.

State clearly that shipping and taxes are calculated at checkout when applicable.

If checkout is not connected, explain that it is unavailable in this preview. Never simulate successful payment or order placement.

Keep Printful credentials and payment secrets on the server.

Production checkout must validate prices, variant IDs, availability, and destination eligibility on the server. Do not trust client-side cart totals.

INTERNATIONAL SHOPPING

- Use internationally understandable language.
- Clearly identify the currency.
- Show inches and centimeters for physical dimensions when verified.
- Provide relevant size charts.
- Make shipping information easy to find.
- Avoid universal free-shipping promises.
- Do not invent legal business details, support addresses, or return addresses.

Policy pages may use clearly marked draft content pending the store owner’s actual business and fulfillment rules. Do not present drafts as legally reviewed policies.

RESPONSIVE REQUIREMENTS

Check layouts at:
360px, 390px, 768px, 1024px, and 1440px.

- Stack hero and editorial content on mobile.
- Product grid: one column on very narrow screens, two columns when space permits, three on tablet, four on desktop.
- Stack product gallery above product information on mobile.
- Minimum touch target: 44px.
- No horizontal overflow.
- No clipped headings or distorted images.
- Use consistent image ratios.
- Keep faces and product artwork visible.
- Ensure shopping actions remain easy to reach.
- Respect prefers-reduced-motion.

ACCESSIBILITY AND PERFORMANCE

- Semantic HTML.
- Correct heading hierarchy.
- Descriptive alt text.
- Visible keyboard focus.
- Accessible form labels.
- Keyboard-operable menus and drawers.
- Proper focus management.
- Optimized responsive images.
- Prioritize the hero image; lazy-load appropriate below-the-fold images.
- Page-specific metadata.
- Product structured data only from verified information.

DATA AND COMPONENTS

Centralize sample data for:

- Mika’s profile.
- Products and variants.
- Collections.
- Journal articles.
- Article-to-product relationships.
- Social links.
- Store settings and currency.

Build reusable components:
Header, MobileNav, Footer, Hero, ProductCard, ProductGrid, ProductFilters, ProductGallery, VariantSelector, CartDrawer, JournalCard, CollectionBanner, ShopTheMoment, and EmptyState.

Sample prices must be easy to replace and identified as demo data in project documentation. Do not claim they are verified Printful costs.

DELIVERABLE

Implement a working, polished website with functional navigation, search, filters, product selection, and cart.

Include:

- Setup instructions.
- Configuration examples without secrets.
- A short list of integrations awaiting connection.
- Responsive verification.
- Clear distinction between functioning demo features and services requiring production integration.

The finished experience should make Mika memorable, communicate the MIKADAY identity, and give international customers a clear path from discovering a story to exploring a product.



Di checkout, klik tombol Debit or Credit Card di bawah tombol PayPal.
Isi kartu uji dari dokumentasi resmi PayPal:
Visa: 4012 8888 8888 1881 (alternatif 4005 5192 0000 0004)
Mastercard: 2223 0000 4840 0011
Expiry: tanggal mana saja di masa depan, misalnya 12/30
CVV: 123
Untuk negara penagihan, pilih United States dengan alamat contoh 19749 Dearborn St, Chatsworth, CA 91311. Pembayaran kartu tanpa akun (guest) paling stabil di Sandbox dengan negara US.
Untuk menguji kartu yang ditolak, isi nama di kartu dengan CCREJECT-REFUSED. Toko akan menampilkan pesan bahwa kartu ditolak dan meminta Anda memilih metode lain.