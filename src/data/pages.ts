export interface InfoPage { title: string; lead: string; sections: { h: string; p: string }[] }

/** Contact details are read from the environment so the owner never has to edit code. */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "hello@khelzo.example";
export const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "";
const BUSINESS = process.env.NEXT_PUBLIC_BUSINESS_NAME ?? "KHELZO";

/*
 * Policy pages are drafts written to match how the store actually works.
 * Have them reviewed by a legal professional and fill in your registered business details before you go live.
 */
export const pages: Record<string, InfoPage> = {
  contact: { title: "Contact Us", lead: "Questions about a toy, an order or a gift? We'd love to help.", sections: [
    { h: "Email", p: `Write to us at ${SUPPORT_EMAIL}. Please include your order number so we can help faster.` },
    ...(SUPPORT_PHONE ? [{ h: "Phone / WhatsApp", p: SUPPORT_PHONE }] : []),
    { h: "Support hours", p: "Monday to Saturday, 10am to 7pm IST. We reply to every message within one working day." },
    { h: "Track an order", p: "Use the Track Order page with your order number, or open My Orders if you have an account." },
  ] },
  faqs: { title: "FAQs", lead: "Quick answers to the questions parents ask us most.", sections: [
    { h: "How do I choose the right toy for my child's age?", p: "Use Shop by Age. Every toy carries a recommended age range, so you can browse 0–2, 3–5, 6–8, 9–12 or 13+ years. Check the safety information on each product page too." },
    { h: "How do I pay?", p: "UPI, debit and credit cards, net banking and wallets are processed securely by Razorpay. Cash on Delivery is available on most orders. We never see or store your card details." },
    { h: "Is Cash on Delivery available?", p: "Yes, across serviceable PIN codes. Enter your PIN code on the product page to check delivery." },
    { h: "How long does delivery take?", p: "Standard delivery takes 3–7 working days and express 1–3 working days. You will see an estimated date at checkout." },
    { h: "Can I cancel an order?", p: "Yes, until it is shipped. Open My Orders and choose Cancel order. Online payments are refunded to the original payment method." },
    { h: "What if a toy arrives damaged or wrong?", p: "Request a return or replacement within 7 days of delivery from My Orders and we will sort it out." },
    { h: "Do I need an account to order?", p: "No. You can check out as a guest and track the order with your order number. An account adds saved addresses, a wishlist and order history." },
  ] },
  shipping: { title: "Shipping & Delivery", lead: "Free standard delivery on orders above ₹999.", sections: [
    { h: "Delivery times", p: "Standard delivery: 3–7 working days. Express delivery: 1–3 working days. Dispatch starts after payment is confirmed (or the order is placed for Cash on Delivery). Remote PIN codes may take longer." },
    { h: "Charges", p: "Standard delivery is free on orders above ₹999 after discounts; below that a flat fee applies. Express delivery always carries its fee. The exact charge is shown at checkout before you pay." },
    { h: "Serviceable areas", p: "We deliver across most PIN codes in India. Enter your PIN code on any product page to confirm." },
    { h: "Tracking", p: "Once your order ships you will get an email with the courier name and tracking number, and the timeline on your order page updates as it moves." },
    { h: "Delivery attempts", p: "If you are unavailable the courier will try again. Please keep your phone reachable on delivery day." },
  ] },
  returns: { title: "Returns, Replacements & Refunds", lead: "Easy 7-day returns on unused toys.", sections: [
    { h: "Return window", p: "You can request a return or replacement within 7 days of delivery for damaged, defective or wrong items, and for unused toys in their original packaging." },
    { h: "How to request", p: "Go to My Orders, open the delivered order and choose Return / Refund. Tell us what went wrong. Our team reviews every request and will email you." },
    { h: "Refunds", p: "Approved refunds for online payments go back to the original payment method (typically 5–7 working days after we receive the toy). For Cash on Delivery orders we refund by bank transfer or UPI after you share the details." },
    { h: "Not eligible", p: "Toys that are used, damaged by the customer, missing parts or without original packaging, and hygiene-sensitive items that have been opened." },
    { h: "Cancellations", p: "Orders can be cancelled until they ship. Paid orders are refunded in full." },
  ] },
  "track-order": { title: "Track Your Order", lead: "Enter your order number to see where your toys are.", sections: [
    { h: "Where to find it", p: "Your order number starts with KZ and is shown on the confirmation page and in your order emails." },
  ] },
  about: { title: "About KHELZO", lead: "Play Beyond Imagination.", sections: [
    { h: "Our idea", p: "KHELZO is a modern Indian toy brand built around imaginative, child-safe toys and a shopping experience that parents trust." },
    { h: "What we care about", p: "Quality-checked toys, honest age labels, fair prices in ₹ and joyful packaging." },
  ] },
  privacy: { title: "Privacy Policy", lead: `How ${BUSINESS} handles your personal information.`, sections: [
    { h: "What we collect", p: "Details you give us: name, email, mobile number, delivery addresses, order history and product reviews. We also keep basic technical data (such as device type and pages visited) to keep the site working and secure." },
    { h: "How we use it", p: "To process and deliver orders, send order updates, handle returns and refunds, provide support, prevent fraud, and — only if you subscribe — send newsletters and offers. You can unsubscribe at any time." },
    { h: "Payments", p: "Online payments are handled by Razorpay. Card, UPI and bank details are entered on Razorpay's secure window and are never stored on our servers." },
    { h: "Sharing", p: "We share only what is necessary with delivery partners (name, address, phone), payment processors and email providers. We do not sell your personal data." },
    { h: "Cookies & analytics", p: "Essential storage keeps your cart and login working. Analytics and advertising pixels (Google Analytics, Meta Pixel) run only if you accept them in the cookie banner. See the Cookie Policy." },
    { h: "Retention & your rights", p: "We keep order records for as long as needed for tax and legal reasons. Under the Digital Personal Data Protection Act, 2023 you may ask to access, correct or delete your data, or withdraw consent, by emailing us." },
    { h: "Children", p: "Our store is meant for parents and guardians. We do not knowingly collect personal data from children." },
    { h: "Contact", p: `Questions about privacy? Email ${SUPPORT_EMAIL}.` },
  ] },
  terms: { title: "Terms & Conditions", lead: "The rules of the playground.", sections: [
    { h: "Using the store", p: "By placing an order you confirm that you are at least 18 years old and that the details you provide are accurate." },
    { h: "Prices & tax", p: "All prices are in Indian Rupees (₹) and include applicable GST. We may correct pricing errors; if that happens we will contact you before shipping." },
    { h: "Orders & availability", p: "An order is confirmed once payment is received or a Cash on Delivery order is accepted. Stock is limited; if an item becomes unavailable we will cancel that item and refund any amount paid." },
    { h: "Payments", p: "Online payments are processed by Razorpay. Orders whose payment is not completed within 30 minutes are automatically cancelled and the stock released." },
    { h: "Delivery, returns & refunds", p: "See the Shipping and Returns pages, which form part of these terms." },
    { h: "Product safety", p: "Follow the age guidance on every toy and supervise young children. Some toys contain small parts and are not suitable for children under 3 years." },
    { h: "Reviews", p: "Only verified buyers can review. We may remove reviews that contain abuse, spam or personal information." },
    { h: "Liability", p: "To the extent permitted by law our liability is limited to the value of the order. This does not affect your statutory consumer rights." },
    { h: "Governing law", p: "These terms are governed by the laws of India. Disputes are subject to the courts at our registered business location." },
  ] },
  cookies: { title: "Cookie Policy", lead: "What we store in your browser.", sections: [
    { h: "Essential storage", p: "Your cart, wishlist, recently viewed toys, comparison list and login session are saved in your browser's local storage so they survive a refresh. These are needed for the store to work." },
    { h: "Analytics & advertising (optional)", p: "If you click Accept in the cookie banner we load Google Analytics and Meta Pixel (when configured) to understand how the store is used and to measure our ads. If you click Decline, none of them are loaded." },
    { h: "Changing your choice", p: "Clear this site's data in your browser settings and the banner will ask you again." },
  ] },
  account: { title: "Your Account", lead: "Sign in to see orders, addresses and your wishlist.", sections: [
    { h: "Why create an account", p: "Saved addresses, a synced cart and wishlist, order history with tracking, returns and verified reviews." },
  ] },
  "gift-guide": { title: "Gift Guide for Special Occasions", lead: "Festivals, birthdays and milestones, sorted.", sections: [
    { h: "Birthdays", p: "Browse our gift ideas for easy, wrapped-in-wow birthday picks." },
    { h: "Festivals", p: "Seasonal collections will be curated here. For now, explore all gift ideas in the shop." },
  ] },
  "photo-credits": { title: "Photo Credits", lead: "Some product and lifestyle photos come from Wikimedia Commons under open licences.", sections: [
    { h: "Attribution", p: "Each image below is credited to its author with the licence it is shared under. Replace these with your own commercial product photography before launching." },
  ] },
};
