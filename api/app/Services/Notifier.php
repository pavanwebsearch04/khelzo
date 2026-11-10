<?php

namespace App\Services;

use App\Mail\StoreMail;
use App\Models\{Order, OrderReturn, Product, Setting};
use Illuminate\Support\Facades\Mail;

/** Sends transactional emails. A mail failure must never break an order, so everything is caught and reported. */
class Notifier
{
    private function front(string $path = ''): string
    {
        return rtrim((string) env('FRONTEND_URL_PUBLIC', explode(',', (string) env('FRONTEND_URL', 'http://localhost:3000'))[0]), '/') . $path;
    }

    private function send(string $to, StoreMail $mail): void
    {
        try {
            Mail::to($to)->send($mail);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    private function trackUrl(Order $o): string
    {
        return $this->front('/order/' . $o->number . ($o->guest_token ? '?t=' . $o->guest_token : ''));
    }

    public function orderPlaced(Order $o): void
    {
        $o->loadMissing('items');
        $lines = ["Hi {$o->customer_name}, thank you for shopping with KHELZO!", "Order {$o->number} · Total ₹" . number_format($o->total, 2) . ' · ' . ($o->payment_method === 'cod' ? 'Pay on delivery' : 'Paid online'), 'Items: ' . $o->items->map(fn ($i) => "{$i->name} ×{$i->qty}")->implode(', '), 'Estimated delivery: ' . ($o->estimated_delivery?->format('d M Y') ?? 'soon')];
        $this->send($o->customer_email, new StoreMail("Order {$o->number} confirmed", 'Your order is placed', $lines, 'Track your order', $this->trackUrl($o)));
    }

    public function orderStatus(Order $o, string $status, ?string $note = null): void
    {
        $copy = [
            'shipped' => ['shipped', 'Your order is on the way', 'Good news — your order has been shipped.'],
            'out_for_delivery' => ['out for delivery', 'Out for delivery today', 'Your order is out for delivery. Please keep your phone handy.'],
            'delivered' => ['delivered', 'Delivered — enjoy the play!', 'Your order has been delivered. We would love a review once the kids have tried it.'],
            'cancelled' => ['cancelled', 'Your order was cancelled', 'Your order has been cancelled. If you paid online, the refund goes back to your original payment method.'],
            'refunded' => ['refunded', 'Your refund is on its way', 'We have processed your refund.'],
        ][$status] ?? null;
        if (! $copy) return;
        $lines = [$copy[2], "Order {$o->number}" . ($note ? " — {$note}" : '')];
        if ($status === 'shipped' && ($s = $o->shipment)) $lines[] = "Carrier: {$s->carrier} · Tracking: {$s->tracking_number}";
        $this->send($o->customer_email, new StoreMail("Order {$o->number} {$copy[0]}", $copy[1], $lines, 'View order', $this->trackUrl($o)));
    }

    public function returnUpdate(OrderReturn $r): void
    {
        $o = $r->order;
        $this->send($o->customer_email, new StoreMail("Return update for order {$o->number}", 'Your return request was updated', ["Status: " . ucfirst($r->status), $r->admin_note ? "Note from our team: {$r->admin_note}" : "We'll keep you posted by email."], 'View order', $this->trackUrl($o)));
    }

    public function abandonedCart(string $email, string $name, int $count): void
    {
        $this->send($email, new StoreMail('You left something fun in your cart', "Still thinking, {$name}?", ["You have {$count} item(s) waiting in your KHELZO cart. Stock is limited, so grab them before they sell out!"], 'Back to cart', $this->front('/cart')));
    }

    public function backInStock(string $email, Product $p): void
    {
        $this->send($email, new StoreMail("{$p->name} is back in stock", 'Back in stock!', ["{$p->name} is available again. Order soon — popular toys go fast."], 'Shop now', $this->front('/product/' . $p->slug)));
    }

    public function welcomeNewsletter(string $email): void
    {
        $this->send($email, new StoreMail('Welcome to the KHELZO club', 'You are on the list!', ['Thanks for subscribing. We will only send you new toys, offers and play ideas.'], 'Start shopping', $this->front('/shop')));
    }
}
