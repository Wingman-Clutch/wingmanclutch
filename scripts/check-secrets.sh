#!/bin/sh
# Menolak rahasia sebelum masuk commit (AGENTS.md bagian 9). Dipakai .githooks/pre-commit.
# Repo ini public: rahasia yang sempat ter-push harus di-rotate, tidak cukup dihapus.
#
#   scripts/check-secrets.sh --staged          cek perubahan yang di-stage
#   scripts/check-secrets.sh --files FILE...   cek isi file tertentu
#
# Isi rahasia tidak pernah dicetak; yang dilaporkan hanya nama file dan jenisnya.

set -eu
LC_ALL=C
export LC_ALL

# Pola berkepastian tinggi. Pola baru wajib disertai contoh di scripts/test-check-secrets.sh.
secret='sb_secret_[A-Za-z0-9_-]{16,}'
private_key='-----BEGIN ([A-Z]+ )?PRIVATE KEY-----'
service_role='(SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|SERVICE_ROLE_KEY)[[:space:]]*[:=][[:space:]]*["'"'"']?[A-Za-z0-9_.-]{20,}'
# JWT apa pun (key Supabase lama, token sesi) patut dicurigai kalau tertulis di repo.
jwt='eyJ[A-Za-z0-9_-]{8,}[.]eyJ[A-Za-z0-9_-]{8,}[.][A-Za-z0-9_-]{8,}'
# Client secret OAuth Google.
google_secret='GOCSPX-[A-Za-z0-9_-]{20,}'
# API key Resend (pengirim email form kontak).
resend_key='re_[A-Za-z0-9]{8,}_[A-Za-z0-9]{16,}'
# Token GitHub (statistik proyek di /api/proyek memakai token baca).
github_token='(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})'

found=0

report() {
  printf '  %s\n' "$1" >&2
  found=1
}

is_env_file() {
  case "${1##*/}" in
    .env.example) return 1 ;;
    .env | .env.*) return 0 ;;
    *) return 1 ;;
  esac
}

# Baca teks dari stdin dan laporkan jenis rahasia yang ditemukan untuk file $1.
scan() {
  text=$(cat)
  if printf '%s\n' "$text" | grep -Eq "$secret"; then report "$1: secret key Supabase"; fi
  if printf '%s\n' "$text" | grep -Eq -e "$private_key"; then report "$1: private key"; fi
  if printf '%s\n' "$text" | grep -Eq "$service_role"; then report "$1: nilai service role atau secret key"; fi
  if printf '%s\n' "$text" | grep -Eq "$jwt"; then report "$1: JWT (key Supabase lama atau token)"; fi
  if printf '%s\n' "$text" | grep -Eq "$google_secret"; then report "$1: client secret Google"; fi
  if printf '%s\n' "$text" | grep -Eq "$resend_key"; then report "$1: API key Resend"; fi
  if printf '%s\n' "$text" | grep -Eq "$github_token"; then report "$1: token GitHub"; fi
}

scan_staged() {
  files=$(git diff --cached --name-only --diff-filter=ACMR)
  [ -n "$files" ] || return 0
  while IFS= read -r file; do
    if is_env_file "$file"; then
      report "$file: file env tidak boleh di-commit (contoh nilai cukup di .env.example)"
      continue
    fi
    # Ditampung dulu: scan di dalam pipe jalan di subshell dan statusnya akan hilang.
    added=$(git diff --cached -U0 --no-color -- "$file" | grep '^+' | grep -v '^+++ ' || true)
    [ -n "$added" ] || continue
    scan "$file" <<ADDED
$added
ADDED
  done <<EOF
$files
EOF
}

scan_files() {
  for file in "$@"; do
    if is_env_file "$file"; then
      report "$file: file env tidak boleh di-commit (contoh nilai cukup di .env.example)"
      continue
    fi
    scan "$file" < "$file"
  done
}

case ${1:-} in
  --staged) scan_staged ;;
  --files)
    shift
    [ $# -ge 1 ] || { echo "Pemakaian: scripts/check-secrets.sh --staged | --files FILE..." >&2; exit 2; }
    scan_files "$@"
    ;;
  *)
    echo "Pemakaian: scripts/check-secrets.sh --staged | --files FILE..." >&2
    exit 2
    ;;
esac

[ "$found" -eq 0 ] && exit 0

cat >&2 <<'EOF'

Ditolak: commit berisi rahasia (AGENTS.md bagian 9). Repo ini public.
Simpan nilainya di .env lokal atau Environment Variables Vercel, lalu keluarkan dari commit:
  git restore --staged <file>
Kalau rahasia sudah sempat ter-push atau terkirim lewat chat, rotate key-nya di dashboard.
EOF
exit 1
