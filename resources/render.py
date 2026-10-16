"""Render the static resource directory from catalog data."""
from pathlib import Path
from html import escape as e
from urllib.parse import urlparse
from collections import Counter
import re
import json

root = Path(__file__).resolve().parent
data = json.loads((root / 'catalog.json').read_text())
items = data['resources']
counts = Counter(r['format'] for r in items)
total = len(items)
filters = f'<button class="category active" type="button" data-category="all" aria-pressed="true"><span>All entries</span><span>{total}</span></button>'
for category in ['read', 'books', 'watch', 'browse', 'use', 'build']:
    filters += f'<button class="category" type="button" data-category="{category}" aria-pressed="false"><span>{category.title()}</span><span>{counts[category]:02}</span></button>'
rows = []
for i, r in enumerate(items, 1):
    domain = urlparse(r['url']).netloc.removeprefix('www.')
    if r['format'] == 'books':
        subtitle = ' · '.join(str(r[k]) for k in ['author', 'year'] if r.get(k))
    elif r['format'] == 'watch':
        subtitle = ' · '.join(str(r[k]) for k in ['director', 'speaker', 'year'] if r.get(k))
    elif r.get('speaker'):
        subtitle = f"{r['speaker']} · {r['year']} · {r['collection']}"
    elif r.get('publication'):
        subtitle = f"{r['author']} · {r['year']} · {r['publication']}"
    elif r.get('director'):
        subtitle = f"{r['director']} · {r['year']} · {r['collection']}"
    else:
        subtitle = f"{r['topic']} · {domain}" if r.get('topic') else domain
    note = f'<span class="resource-note">{e(r["note"])}</span>' if r.get('note') and r['format'] != 'watch' else ''
    title = ' title="Details and viewing information"' if r['format'] == 'watch' else ''
    aliases = f' data-search-aliases="{e(" | ".join(r["aliases"]), quote=True)}"' if r.get('aliases') else ''
    language = f' lang="{e(r["title_language"], quote=True)}"' if r.get('title_language') else ''
    rows.append(f'<li class="resource" data-category="{r["format"]}" data-date="{r["date"]}"{aliases}><a class="resource-link" href="{e(r["url"], quote=True)}"{title} target="_blank" rel="noopener noreferrer" aria-labelledby="resource-title-{i}" aria-describedby="resource-detail-{i}"><span class="resource-number" aria-hidden="true">{i:03}</span><span class="resource-name"><span class="resource-title" id="resource-title-{i}"{language} dir="auto">{e(r["title"])}</span><span id="resource-detail-{i}" class="resource-detail"><span class="resource-domain">{e(subtitle)}</span>{note}<span class="sr-only"> (opens in a new tab)</span></span></span><span class="resource-type">{r["format"]}</span><time datetime="{r["date"]}" title="Added to the directory">{r["date"].replace("-", ".")}</time><span class="resource-arrow" aria-hidden="true">↗</span></a></li>')
p = root / 'index.html'
s = p.read_text()
s = re.sub(r'(<nav class="categories"[^>]*>).*?(</nav>)', lambda m: m[1] + filters + m[2], s, flags=re.S)
s = re.sub(r'(<ul class="resource-list" id="resource-list">).*?(</ul>)', lambda m: m[1] + '\n'.join(rows) + m[2], s, flags=re.S)
s = re.sub(r'(<span class="index-total">)\d+', lambda m: m[1] + str(total), s)
s = re.sub(r'(<p id="result-count"[^>]*>).*?</p>', lambda m: m[1] + f'{total} entries</p>', s)
s = re.sub(r'Explore \d+ tools, articles, books, films, and references\.', f'Explore {total} tools, articles, books, films, and references.', s)
s = re.sub(r'All \d+ entries are listed here', f'All {total} entries are listed here', s)
s = re.sub(r'resources\.(css|js)\?v=[^" ]+', r'resources.\1?v=book-order-10', s)
p.write_text(s)
print(f'Rendered {total} resources; {counts["read"]} readings; {counts["watch"]} watch entries.')
