<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Invoice {{ $o->number }}</title>
<style>
 body{font-family:Arial,Helvetica,sans-serif;color:#29243B;margin:0;padding:32px;background:#fff}
 .wrap{max-width:780px;margin:0 auto} h1{margin:0;font-size:26px;color:#7657F6} .muted{color:#6b6580;font-size:13px}
 .row{display:flex;justify-content:space-between;gap:24px;margin-top:18px} table{width:100%;border-collapse:collapse;margin-top:22px;font-size:14px}
 th{background:#FFF8ED;text-align:left;padding:10px;border-bottom:2px solid #29243B} td{padding:10px;border-bottom:1px solid #eee} .r{text-align:right}
 .tot td{border:0;padding:4px 10px} .grand td{font-weight:bold;font-size:16px;border-top:2px solid #29243B;padding-top:10px}
 .btn{margin-top:24px;padding:10px 20px;background:#FF8748;border:2px solid #29243B;border-radius:10px;font-weight:bold;cursor:pointer}
 @media print{.btn{display:none}body{padding:0}}
</style></head><body><div class="wrap">
<div class="row" style="margin-top:0"><div><h1>{{ $store['legal_name'] ?? 'KHELZO' }}</h1>
<div class="muted">{{ $store['address'] ?? '' }}<br>@if(!empty($store['gstin']))GSTIN: {{ $store['gstin'] }}<br>@endif{{ $store['support_email'] ?? '' }}</div></div>
<div style="text-align:right"><strong style="font-size:20px">TAX INVOICE</strong><div class="muted">Invoice no: INV-{{ $o->number }}<br>Date: {{ $o->created_at->format('d M Y') }}<br>Order: {{ $o->number }}</div></div></div>
@php $a = $o->shipping_address; @endphp
<div class="row"><div><strong>Bill / Ship to</strong><div class="muted">{{ $a['full_name'] ?? $o->customer_name }}<br>{{ $a['line1'] ?? '' }}{{ !empty($a['line2']) ? ', '.$a['line2'] : '' }}<br>{{ $a['city'] ?? '' }}, {{ $a['state'] ?? '' }} {{ $a['pincode'] ?? '' }}<br>Phone: {{ $a['phone'] ?? $o->customer_phone }}</div></div>
<div style="text-align:right"><strong>Payment</strong><div class="muted">{{ strtoupper($o->payment_method) }} · {{ str_replace('_',' ', $o->payment_status) }}</div></div></div>
<table><thead><tr><th>Item</th><th>SKU</th><th class="r">Qty</th><th class="r">Unit (incl. GST)</th><th class="r">Amount</th></tr></thead><tbody>
@foreach($o->items as $i)<tr><td>{{ $i->name }}@if($i->variant_label) <span class="muted">({{ $i->variant_label }})</span>@endif</td><td class="muted">{{ $i->sku }}</td><td class="r">{{ $i->qty }}</td><td class="r">₹{{ number_format($i->unit_price,2) }}</td><td class="r">₹{{ number_format($i->line_total,2) }}</td></tr>@endforeach
</tbody></table>
<table class="tot" style="width:320px;margin-left:auto"><tr><td>Items total</td><td class="r">₹{{ number_format($o->subtotal,2) }}</td></tr>
@if($o->discount>0)<tr><td>Discount{{ $o->coupon_code ? ' ('.$o->coupon_code.')' : '' }}</td><td class="r">− ₹{{ number_format($o->discount,2) }}</td></tr>@endif
<tr><td>Shipping</td><td class="r">₹{{ number_format($o->shipping,2) }}</td></tr>
<tr><td class="muted">Taxable value</td><td class="r muted">₹{{ number_format($o->subtotal - $o->discount - $o->tax_included + 0,2) }}</td></tr>
<tr><td class="muted">GST included</td><td class="r muted">₹{{ number_format($o->tax_included,2) }}</td></tr>
<tr class="grand"><td>Total</td><td class="r">₹{{ number_format($o->total,2) }}</td></tr></table>
<p class="muted" style="margin-top:28px">Prices include GST. This is a computer-generated invoice. Returns accepted within 7 days of delivery as per our policy.</p>
<button class="btn" onclick="window.print()">Print / Save as PDF</button>
</div></body></html>
