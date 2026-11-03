import type { Metadata } from "next";
import { OrderView } from "@/components/orders/OrderView";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage({ params }: PageProps<"/order/[number]">) {
  const { number } = await params;
  return <OrderView number={number} fresh />;
}
