// Skema dari docs/api/openapi.yaml untuk memvalidasi jawaban handler, sama seperti test frontend.

import { readFileSync } from 'node:fs'
import Ajv2020 from 'ajv/dist/2020.js'
import { parse } from 'yaml'

export const kontrak = parse(
  readFileSync(new URL('../../docs/api/openapi.yaml', import.meta.url), 'utf8'),
)
const ajv = new Ajv2020.default({ strict: false, allErrors: true })
ajv.addFormat('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/)
ajv.addFormat('date-time', (s: string) => !Number.isNaN(Date.parse(s)))
ajv.addSchema({ $id: 'kontrak', components: kontrak.components })

/** true kalau data cocok dengan skema; kalau tidak, galatnya ikut dilempar supaya mudah dibaca */
export function cocok(nama: string, data: unknown) {
  const v = ajv.getSchema(`kontrak#/components/schemas/${nama}`)!
  if (!v(data)) throw new Error(`${nama} tidak cocok: ${JSON.stringify(v.errors)}`)
  return true
}
