<!doctype html>
<html><body style="margin:0;background:#FFF8ED;font-family:Arial,Helvetica,sans-serif;color:#29243B">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:2px solid #29243B;border-radius:20px">
<tr><td style="padding:20px 28px;background:#7657F6;border-radius:18px 18px 0 0;color:#fff;font-size:22px;font-weight:bold">KHELZO <span style="color:#FFD84D">·</span> <span style="font-size:13px;font-weight:normal">Play Beyond Imagination.</span></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 14px;font-size:22px">{{ $heading }}</h1>
@foreach ($lines as $l)<p style="margin:0 0 10px;line-height:1.5;font-size:15px">{!! nl2br(e($l)) !!}</p>@endforeach
@if ($ctaLabel && $ctaUrl)<p style="margin:22px 0 0"><a href="{{ $ctaUrl }}" style="background:#FF8748;color:#29243B;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:12px;border:2px solid #29243B;display:inline-block">{{ $ctaLabel }}</a></p>@endif
</td></tr>
<tr><td style="padding:16px 28px;font-size:12px;color:#6b6580;border-top:1px solid #eee">You received this because of activity on your KHELZO account or order. Need help? Reply to this email.</td></tr>
</table></td></tr></table></body></html>
