import { readFileSync } from 'node:fs'
// berekstensi .js supaya juga bisa dimuat loader ESM Playwright, bukan hanya Vitest
import Ajv2020 from 'ajv/dist/2020.js'
import { parse } from 'yaml'

/** kontrak API dan validator skemanya, dipakai unit test kontrak dan smoke test produksi */
export const kontrak = parse(
  readFileSync(new URL('../../../docs/api/openapi.yaml', import.meta.url), 'utf8'),
)
const ajv = new Ajv2020({ strict: false, allErrors: true })
ajv.addFormat('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/)
ajv.addFormat('date-time', (s: string) => !Number.isNaN(Date.parse(s)))
ajv.addSchema({ $id: 'kontrak', components: kontrak.components })
export const skema = (nama: string) => ajv.getSchema(`kontrak#/components/schemas/${nama}`)!
