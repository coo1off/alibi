#!/usr/bin/env bash
# Публикация на GitHub Pages: собирает dist/ и пушит его в ветку gh-pages.
# GitHub → Settings → Pages → Source: "Deploy from a branch" → gh-pages /(root).
set -euo pipefail
cd "$(dirname "$0")/.."

npm run build

STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
cp -R dist/. "$STAGE/"
touch "$STAGE/.nojekyll"
cd "$STAGE"
git init -q -b gh-pages
git add -A
git -c user.name="alibi-deploy" -c user.email="deploy@local" commit -q -m "deploy: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
ORIGIN=$(git -C "$OLDPWD" remote get-url origin 2>/dev/null || echo "https://github.com/coo1off/alibi.git")
git remote add origin "$ORIGIN"
git push -f origin gh-pages
echo "Опубликовано. Через минуту: https://coo1off.github.io/alibi/"
