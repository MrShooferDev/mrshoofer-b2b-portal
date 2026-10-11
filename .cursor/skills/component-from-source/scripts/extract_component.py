#!/usr/bin/env python3
"""Locate a component's compiled code on a Next.js / bundled page.

Examples:
  extract_component.py URL --find Meetings --find Chat
  extract_component.py URL --module 501803 --deps
  extract_component.py URL --css segment
  extract_component.py URL --browser-chunks chunks.txt --find uAngle
"""
import argparse
import concurrent.futures as cf
import hashlib
import os
import re
import sys
import urllib.parse
import urllib.request

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36"
CACHE = os.path.join(os.environ.get("TMPDIR", "/tmp"), "component-extract-cache")
MAX_CHUNKS = 600

MODULE_START = re.compile(
    r'[,\[{](\d{1,7})\s*[,:]\s*(?:\(?[\w$]*(?:,[\w$]+)*\)?\s*=>|function\s*\([\w$,]*\))\s*\{'
)
REQUIRE = re.compile(r'\b(?:e\.i|e\.r|__webpack_require__|[a-z]\.[a-z])\((\d{2,7})\)|\b[a-z]\((\d{3,7})\)')
LABEL = re.compile(r'"((?:[\w@.-]+/)+[\w.-]+\.(?:tsx|jsx|ts|js|mjs))"')


def fetch(url):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, hashlib.sha1(url.encode()).hexdigest())
    if os.path.exists(path):
        with open(path, encoding="utf-8", errors="replace") as f:
            return f.read()
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            text = r.read().decode("utf-8", errors="replace")
    except Exception as exc:  # noqa: BLE001
        print(f"! fetch failed {url}: {exc}", file=sys.stderr)
        return ""
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    return text


def asset_urls(text, page_url, ext):
    clean = text.replace("\\/", "/").replace('\\"', '"')
    found = set()
    for m in re.finditer(r'(?:https?://[^"\'\s()]+|/[^"\'\s()]*|[\w./-]*)_next/static/[^"\'\s()?]+?\.' + ext, clean):
        found.add(urllib.parse.urljoin(page_url, m.group(0)))
    return found


def discover_chunks(page_url, html, extra, done=lambda texts: False):
    base = None
    seen, queue = set(), list(asset_urls(html, page_url, "js")) + list(extra)
    texts = {}
    while queue and len(seen) < MAX_CHUNKS and not (texts and done(texts)):
        batch = [u for u in dict.fromkeys(queue) if u not in seen]
        queue = []
        seen.update(batch)
        with cf.ThreadPoolExecutor(16) as pool:
            for url, text in zip(batch, pool.map(fetch, batch)):
                texts[url] = text
                if base is None and "_next/" in url:
                    base = url[: url.index("_next/")]
                for rel in re.findall(r'"((?:_next/)?static/[\w/.-]*chunks/[\w.-]+\.js)"', text):
                    rel = rel if rel.startswith("_next/") else "_next/" + rel
                    queue.append((base or page_url) + rel if base else urllib.parse.urljoin(page_url, "/" + rel))
                queue.extend(asset_urls(text, page_url, "js"))
    return texts


def split_modules(texts):
    modules = {}
    for url, text in texts.items():
        starts = [(m.start(), m.group(1)) for m in MODULE_START.finditer(text)]
        for i, (pos, mid) in enumerate(starts):
            end = starts[i + 1][0] if i + 1 < len(starts) else len(text)
            body = text[pos:end]
            if mid not in modules or len(body) > len(modules[mid][1]):
                modules[mid] = (url, body)
    return modules


def deps_of(body, modules):
    ids = {a or b for a, b in REQUIRE.findall(body)}
    return [i for i in ids if i in modules]


def short(url):
    return url.rsplit("/", 1)[-1].split("?")[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("--find", action="append", default=[], help="string that must appear in the module (repeatable)")
    ap.add_argument("--module", help="print this module id")
    ap.add_argument("--deps", action="store_true", help="with --module, also print direct dependencies under --max-size")
    ap.add_argument("--max-size", type=int, default=20000)
    ap.add_argument("--label", help="print sections between file-path labels containing this fragment, e.g. cta-12/")
    ap.add_argument("--css", help="print CSS rules whose selector contains this class fragment")
    ap.add_argument("--browser-chunks", help="file with extra chunk URLs (one per line) copied from the browser")
    args = ap.parse_args()

    html = fetch(args.url)
    if not html:
        sys.exit(1)
    csr = "BAILOUT_TO_CLIENT_SIDE_RENDERING" in html
    print(f"# page {len(html)} bytes, client-side bailout: {csr}")
    for exp in sorted(set(re.findall(r'\],\\?"([A-Z][A-Za-z0-9]+)\\?"\]', html)))[:20]:
        print(f"# exported client component: {exp}")

    if args.css:
        for css_url in sorted(asset_urls(html, args.url, "css")):
            css = fetch(css_url)
            rules = re.findall(r'[^{}]*\.' + re.escape(args.css) + r'[^{}]*\{[^{}]*\}', css)
            if rules:
                print(f"\n/* {short(css_url)}: {len(rules)} rules */")
                print("\n".join(r.strip() for r in rules))
        if not (args.find or args.module):
            return

    extra = []
    if args.browser_chunks:
        with open(args.browser_chunks) as f:
            extra = [line.strip() for line in f if line.strip()]
    targets = list(args.find) + ([f",{args.module},"] if args.module else []) + ([args.label] if args.label else [])

    def done(texts):
        return bool(targets) and any(all(t in body for t in targets) for body in texts.values())

    texts = discover_chunks(args.url, html, extra, done)
    modules = split_modules(texts)
    print(f"# {len(texts)} chunks, {len(modules)} modules")

    if args.find:
        hits = [(mid, u, b) for mid, (u, b) in modules.items() if all(s in b for s in args.find)]
        hits.sort(key=lambda h: len(h[2]))
        if not hits:
            files = [short(u) for u, t in texts.items() if all(s in t for s in args.find)]
            print("# no single module matched" + (f"; strings found in: {', '.join(files)}" if files else
                  "; not in discovered chunks - pass --browser-chunks with URLs from the browser's network list"))
        for mid, url, body in hits[:10]:
            labels = LABEL.findall(body)[:3]
            print(f"\n## module {mid} ({len(body)} bytes) in {short(url)}" + (f" labels: {labels}" if labels else ""))
            print(f"   deps: {deps_of(body, modules)}")
            print("   " + body[:300].replace("\n", " "))

    if args.label:
        printed = set()
        for url, text in texts.items():
            marks = [(m.start(), m.group(1)) for m in LABEL.finditer(text)]
            for i, (pos, name) in enumerate(marks):
                if args.label in name and name not in printed:
                    printed.add(name)
                    end = marks[i + 1][0] if i + 1 < len(marks) else min(len(text), pos + 20000)
                    print(f"\n// ===== {name} ({end - pos} bytes) from {short(url)}\n{text[pos:end]}")
        if not printed:
            print(f"# no label containing {args.label!r}")

    if args.module:
        if args.module not in modules:
            print(f"# module {args.module} not found")
            sys.exit(1)
        url, body = modules[args.module]
        print(f"\n// ===== module {args.module} ({len(body)} bytes) from {short(url)}\n{body}")
        if args.deps:
            for dep in deps_of(body, modules):
                durl, dbody = modules[dep]
                if len(dbody) > args.max_size:
                    print(f"\n// ----- dep {dep} skipped ({len(dbody)} bytes, likely a library)")
                else:
                    print(f"\n// ----- dep {dep} ({len(dbody)} bytes) from {short(durl)}\n{dbody}")


if __name__ == "__main__":
    main()
