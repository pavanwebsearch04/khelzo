export interface InfoPage { title: string; lead: string; sections: { h: string; p: string }[] }

const demo = "This is demo content for the KHELZO storefront prototype and should be replaced with your final policy text.";

export const pages: Record<string, InfoPage> = {
  contact: { title: "Contact Us", lead: "Questions about a toy, an order or a gift? We'd love to help.", sections: [
    { h: "Email", p: "hello@khelzo.example (placeholder address). Replace with your real support inbox." },
    { h: "Support hours", p: "Monday to Saturday, 10am to 7pm IST (sample hours)." },
    { h: "Note", p: demo },
  ] },
  faqs: { title: "FAQs", lead: "Quick answers to the questions parents ask us most.", sections: [
    { h: "How do I choose the right toy for my child's age?", p: "Use Shop by Age. Every toy carries a recommended age range, so you can browse 0–2, 3–5, 6–8, 9–12 or 13+ years." },
    { h: "Can I gift-wrap a toy?", p: "Gift wrapping is planned at ₹49 per toy (sample offer)." },
    { h: "Is checkout live?", p: "Not yet. This is a frontend demo, so carts and wishlists work but payments and orders are not connected to a backend." },
  ] },
  shipping: { title: "Shipping & Delivery", lead: "Free delivery on orders above ₹999.", sections: [
    { h: "Delivery times", p: "Sample estimate: 3–7 working days across India." },
    { h: "Charges", p: "Free above ₹999; a flat fee applies below that (sample policy)." },
    { h: "Note", p: demo },
  ] },
  returns: { title: "Returns & Refunds", lead: "Easy 7-day returns on unused toys (sample policy).", sections: [
    { h: "How returns work", p: "Keep the toy in its original packaging and request a return within 7 days of delivery." },
    { h: "Refunds", p: "Refunds are issued to the original payment method once the toy is inspected." },
    { h: "Note", p: demo },
  ] },
  "track-order": { title: "Track Your Order", lead: "Order tracking will appear here once the KHELZO backend is connected.", sections: [
    { h: "Coming soon", p: "Enter your order number and email to see live status. This feature is not active in the demo." },
  ] },
  about: { title: "About KHELZO", lead: "Play Beyond Imagination.", sections: [
    { h: "Our idea", p: "KHELZO is a modern Indian toy brand built around imaginative, child-safe toys and a shopping experience that parents trust." },
    { h: "What we care about", p: "Quality-checked toys, honest age labels, fair prices in ₹ and joyful packaging." },
  ] },
  privacy: { title: "Privacy Policy", lead: "How KHELZO will treat your information.", sections: [{ h: "Sample policy", p: demo }] },
  terms: { title: "Terms & Conditions", lead: "The rules of the playground.", sections: [{ h: "Sample terms", p: demo }] },
  cookies: { title: "Cookie Policy", lead: "What we store in your browser.", sections: [
    { h: "In this demo", p: "Your cart and wishlist are saved in your browser's local storage so they survive a refresh. No tracking cookies are used." },
  ] },
  account: { title: "Your Account", lead: "Login and sign-up are not connected yet.", sections: [
    { h: "Frontend demo", p: "Customer accounts need a backend. Your cart and wishlist already work and are saved in this browser." },
  ] },
  "gift-guide": { title: "Gift Guide for Special Occasions", lead: "Festivals, birthdays and milestones, sorted.", sections: [
    { h: "Birthdays", p: "Browse our gift ideas for easy, wrapped-in-wow birthday picks." },
    { h: "Festivals", p: "Seasonal collections will be curated here. For now, explore all gift ideas in the shop." },
  ] },
  "photo-credits": { title: "Photo Credits", lead: "Product and lifestyle photos in this demo come from Wikimedia Commons under open licences.", sections: [
    { h: "Attribution", p: "Each image below is credited to its author with the licence it is shared under. Replace these with your own commercial product photography before launching." },
  ] },
};
