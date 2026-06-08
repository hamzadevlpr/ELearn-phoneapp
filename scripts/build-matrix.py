#!/usr/bin/env python3
"""
Reads the JSON response from /courses-api/teachers/List (file path = argv[1])
and emits a GitHub Actions matrix JSON to stdout.

Usage:
  python3 scripts/build-matrix.py /tmp/teachers.json >> "$GITHUB_OUTPUT"

Output format:
  matrix={"include": [...]}
  count=N
"""

import json
import re
import sys


def slugify(text: str, max_len: int = 20) -> str:
    """Lowercase ASCII slug, safe for Android package names and S3 keys."""
    return re.sub(r"[^a-z0-9]", "", text.lower())[:max_len]


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: build-matrix.py <teachers-response.json>", file=sys.stderr)
        sys.exit(1)

    with open(sys.argv[1], encoding="utf-8") as f:
        data = json.load(f)

    if not data.get("isSuccess", True) and data.get("isFailure"):
        err = data.get("error", {})
        print(f"::error::API error: {err}", file=sys.stderr)
        sys.exit(1)

    teachers: list[dict] = data.get("value", {}).get("data", []) or data.get("data", [])

    if not teachers:
        print("::error::API returned 0 teachers", file=sys.stderr)
        sys.exit(1)

    items: list[dict] = []
    seen_slugs: set[str] = set()

    for t in teachers:
        full_name = (
            t.get("fullName")
            or f"{t.get('firstName', '')} {t.get('lastName', '')}".strip()
            or t["id"][:8]
        )

        # shortCode is already a clean identifier; use it as primary slug source
        raw_slug = slugify(full_name)
        slug = (raw_slug or t["id"][:8])[:20]

        # Guarantee uniqueness across teachers
        base, n = slug, 2
        while slug in seen_slugs:
            slug = f"{base}{n}"
            n += 1
        seen_slugs.add(slug)

        icon_url = t.get("profileImageUrl") or t.get("avatarImageUrl") or ""
        package = f"com.teacherseg.{slug}"

        items.append(
            {
                "teacher_id": t["id"],
                "teacher_name": full_name,
                "slug": slug,
                "icon_url": icon_url,
                "package": package,
            }
        )

    matrix = json.dumps({"include": items}, ensure_ascii=False)

    # Write to GITHUB_OUTPUT format (or just print for local use)
    print(f"matrix={matrix}")
    print(f"count={len(items)}")

    print(f"✅  Matrix built: {len(items)} teacher(s)", file=sys.stderr)
    for item in items:
        print(
            f"   • {item['teacher_name']!r:30s}  slug={item['slug']:20s}  pkg={item['package']}",
            file=sys.stderr,
        )


if __name__ == "__main__":
    main()
