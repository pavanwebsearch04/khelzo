<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\{Content, Envelope};

/** One simple branded template for every transactional email. */
class StoreMail extends Mailable
{
    public function __construct(public string $subjectLine, public string $heading, public array $lines, public ?string $ctaLabel = null, public ?string $ctaUrl = null) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->subjectLine);
    }

    public function content(): Content
    {
        return new Content(view: 'mail.store');
    }
}
