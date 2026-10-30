// POST /api/kontak: teruskan pesan form "Let's clutch it" ke email Wingman Clutch.
// Kontrak: docs/api/openapi.yaml. Logikanya di _lib/kontak.ts.

import { tanganiKontak } from './_lib/kontak.js'

export default {
  fetch: (req: Request) => tanganiKontak(req),
}
