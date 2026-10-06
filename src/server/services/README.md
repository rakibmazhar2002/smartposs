# Edge services

Services in this directory contain infrastructure-facing behavior that is shared by HTTP routes and scheduled events. They only use Web Platform APIs and Cloudflare bindings. The subscription lifecycle runs on the Worker Cron trigger and inserts tenant-scoped notifications at 30, 7, 4, 2, 1, and 0 days before expiry.
