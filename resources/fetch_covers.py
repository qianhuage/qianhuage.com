"""Restore missing, reviewed cover assets from covers.json.

Run with Python 3 and Pillow installed. Sources are reviewed before being added
so similarly named works are never matched automatically at page-load time.
"""
from io import BytesIO
import json
from pathlib import Path
from urllib.request import Request, urlopen
from PIL import Image, ImageOps

root = Path(__file__).resolve().parent
manifest_path = root / 'covers.json'
manifest = json.loads(manifest_path.read_text())
failed = []
for artwork in manifest.values():
    destination = root / artwork['path']
    if destination.exists():
        continue
    if artwork.get('generated') or artwork.get('supplied'):
        failed.append(artwork['title'])
        print(f'Restore the reviewed artwork from version control: {artwork["path"]}')
        continue
    try:
        request = Request(artwork['image_url'], headers={
            'User-Agent': 'QianhuaPortfolio/1.0 (qianhuage.com)',
        })
        with urlopen(request, timeout=25) as response:
            image = ImageOps.exif_transpose(Image.open(BytesIO(response.read())))
            image.load()
        if image.width < 80 or image.height < 100:
            raise ValueError('Source returned a placeholder-sized image')
        image.thumbnail((960, 640) if artwork.get('kind') in ('film-still', 'video-thumbnail') else (480, 640))
        destination.parent.mkdir(parents=True, exist_ok=True)
        image.convert('RGB').save(destination, 'WEBP', quality=84)
        artwork.update(width=image.width, height=image.height)
        print(f'Saved {artwork["title"]}')
    except Exception as error:
        failed.append(artwork['title'])
        print(f'Could not fetch {artwork["title"]}: {error}')
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
if failed:
    raise SystemExit(f'{len(failed)} cover(s) need another reviewed source.')
