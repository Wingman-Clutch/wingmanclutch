// GET /api/proyek: star GitHub, push terakhir, dan status online keempat aplikasi.
// Kontrak: docs/api/openapi.yaml. Logikanya di _lib/proyek.ts.

import { tanganiProyek } from './_lib/proyek.js'

export default {
  fetch: (req: Request) => tanganiProyek(req),
}
