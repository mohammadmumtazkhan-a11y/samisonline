import os, requests

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'client', 'public', 'assets', 'products')
os.makedirs(OUT, exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://samisonline.com/'
}

# Today's Deals
todays = [
    ("blue-swimming-crab.webp", "https://poa-stores.s3.eu-north-1.amazonaws.com/products/Hs10g3dFnT04bTeaDeCWrjy1h34C2XZH5ZZCTrIT.webp"),
    ("red-bream-fish.jpeg", "https://poa-stores.s3.eu-north-1.amazonaws.com/products/9ngpdwdYION9eklcxkpoP1LQal9pXAcBoN1H1pYA.jpeg"),
    ("samis-bundle-protein.jpeg", "https://poa-stores.s3.eu-north-1.amazonaws.com/products/vGWKmD9ZLtHMCdDar9ndAY8jHpFd1cHlel4nqA5S.jpeg"),
    ("badia-jollof.webp", "https://app.samisonline.com/images/products/Badia-Jollof-small.webp"),
    ("badia-cebolla-onion.webp", "https://app.samisonline.com/images/products/badia-cebolla-onion.webp"),
    ("badia-barbecue.webp", "https://app.samisonline.com/images/products/badia-barbecue.webp"),
]

# Back in Stock
back = [
    ("indomie-chicken.jpg", "https://app.samisonline.com/images/products/carton-of-indomie-chicken-flavour-instant-noodles-40-packs-x-70g.jpg"),
    ("maltina-can.jpg", "https://app.samisonline.com/images/products/samis283.jpg"),
    ("scotch-bonnet-pepper.jpg", "https://app.samisonline.com/images/products/samis217.jpg"),
    ("ologi-yellow-corn.jpg", "https://app.samisonline.com/images/products/Ologi-Yellow-Corn-600x600-1.jpg"),
    ("ata-rodo-scotch-bonnet.jpg", "https://app.samisonline.com/images/products/samis-0003-IMG-33779.jpg"),
]

# Health & Beauty (from earlier truncated data)
health = [
    ("amstel-malta.jpg", "https://app.samisonline.com/images/products/Amstel-Malta-Malt-Drink-33cl-Pack-of-24.jpg"),
]

all_items = todays + back + health

for name, url in all_items:
    target = os.path.join(OUT, name)
    try:
        print(f"Downloading {name}...")
        r = requests.get(url, headers=headers, timeout=30)
        r.raise_for_status()
        with open(target, 'wb') as f:
            f.write(r.content)
        print(f"  Saved ({len(r.content)} bytes)")
    except Exception as e:
        print(f"  FAILED: {e}")

print("Done!")
