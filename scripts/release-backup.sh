#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

LEVEL="${1:-patch}"
TIMESTAMP="$(TZ=Asia/Seoul date +'%Y-%m-%d-%H%M-kst')"
DATE_ONLY="$(TZ=Asia/Seoul date +'%Y-%m-%d')"

mkdir -p releases

npm version "$LEVEL" --no-git-tag-version >/dev/null
VERSION="$(node -p "require('./package.json').version")"
NOTE_FILE="releases/${DATE_ONLY}-v${VERSION}.txt"
ARCHIVE_FILE="releases/watermark-app-v${VERSION}-${TIMESTAMP}.tar.gz"

cat > "$NOTE_FILE" <<EOF
# Release Note

- Version: v${VERSION}
- Date: ${DATE_ONLY}
- Summary:
  - (write changes here)
EOF

tar \
  --exclude='./node_modules' \
  --exclude='./.next' \
  --exclude='./releases/*.tar.gz' \
  --exclude='./releases/*.zip' \
  -czf "$ARCHIVE_FILE" .

echo "VERSION=v${VERSION}"
echo "NOTE_FILE=$NOTE_FILE"
echo "ARCHIVE_FILE=$ARCHIVE_FILE"
