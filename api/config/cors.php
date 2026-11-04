<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    // Exact origins from FRONTEND_URL (comma separated) plus any Vercel deployment of the KHELZO storefront.
    'allowed_origins' => array_filter(array_map('trim', explode(',', env('FRONTEND_URL', 'http://localhost:3000')))),
    'allowed_origins_patterns' => ['#^https://khelzo(-[a-z0-9-]+)?\.vercel\.app$#'],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 600,
    'supports_credentials' => false,
];
