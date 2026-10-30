#!/bin/sh
# Uji scripts/check-secrets.sh. Contoh rahasia palsu dirakit saat jalan, supaya file ini
# sendiri tidak memuat pola rahasia (dan tidak ditolak hook maupun push protection).
#
#   scripts/test-check-secrets.sh
#   CHECK_SH=dash scripts/test-check-secrets.sh

set -eu
check="$(cd "$(dirname "$0")" && pwd)/check-secrets.sh"
sh_cmd=${CHECK_SH:-sh}
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
total=0
failed=0

long=$(printf 'x%.0s' $(seq 1 32))
fake_secret="sb_secret""_${long}"
fake_key_header="-----BEGIN"" PRIVATE KEY-----"
fake_service="SUPABASE_SERVICE_ROLE_KEY""=eyJhbGciOiJIUzI1NiJ9.${long}"
fake_jwt="eyJ""hbGciOiJIUzI1NiJ9.eyJ""yb2xlIjoic2VydmljZV9yb2xlIn0.${long}"
fake_google="GOCSPX""-${long}"
fake_resend="re_""AbCd1234_${long}"
fake_github="ghp""_${long}abcd"

# $1 = tolak|lolos, $2 = nama file, $3 = isi
file() {
  total=$((total + 1))
  mkdir -p "$tmp/files"
  printf '%s\n' "$3" > "$tmp/files/$2"
  if "$sh_cmd" "$check" --files "$tmp/files/$2" 2>/dev/null; then got=lolos; else got=tolak; fi
  if [ "$got" != "$1" ]; then
    printf 'SALAH, harusnya %s: %s\n' "$1" "$2" >&2
    failed=$((failed + 1))
  fi
  rm -f "$tmp/files/$2"
}

file tolak config.ts "export const key = '${fake_secret}'"
file tolak id_rsa "${fake_key_header}"
file tolak deploy.sh "${fake_service}"
file tolak .env "RESEND_API_KEY=apa-saja"
file tolak .env.local "APAPUN=1"
file lolos .env.example "RESEND_API_KEY=re_..."
file lolos vite.config.ts "const apiBase = process.env.VITE_API_BASE ?? ''"
file lolos AGENTS.md 'API key Resend (`re_...`) dan token GitHub (`ghp_...`) tidak pernah di-commit.'
file lolos client.ts "const key = 'sb_publishable_${long}'"
file tolak legacy.ts "const anon = '${fake_jwt}'"
file tolak oauth.json "{ \"client_secret\": \"${fake_google}\" }"
file lolos oauth.md "Client ID Google berakhiran .apps.googleusercontent.com, aman dibagikan."
file tolak kontak.ts "const kunci = '${fake_resend}'"
file tolak proyek.ts "const token = '${fake_github}'"
file lolos proyek.ts "const token = process.env.GITHUB_TOKEN"

# Mode --staged di repo git sementara.
staged() {  # $1 = tolak|lolos, $2 = nama file, $3 = isi
  total=$((total + 1))
  (
    cd "$tmp/repo"
    printf '%s\n' "$3" > "$2"
    git add -f "$2"
  )
  if (cd "$tmp/repo" && "$sh_cmd" "$check" --staged 2>/dev/null); then got=lolos; else got=tolak; fi
  if [ "$got" != "$1" ]; then
    printf 'SALAH (staged), harusnya %s: %s\n' "$1" "$2" >&2
    failed=$((failed + 1))
  fi
  (cd "$tmp/repo" && git reset -q && rm -f "$2")
}

git init -q "$tmp/repo"
staged lolos catatan.md "Semua sketsa digambar pakai pensil di canvas."
staged tolak .env "RESEND_API_KEY=apa-saja"
staged tolak "nama berspasi.ts" "const k = '${fake_resend}'"
staged lolos .env.example "RESEND_API_KEY=re_..."

if [ "$failed" -gt 0 ]; then
  printf '%s dari %s contoh salah.\n' "$failed" "$total" >&2
  exit 1
fi
printf 'Semua %s contoh benar.\n' "$total"
