import httpx
from pathlib import Path

from .config import DATASETS, RAW_DIR


def download_all():
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    for name, info in DATASETS.items():
        url = info["url"]
        dest = RAW_DIR / info["filename"]

        if dest.exists():
            print(f"[download] {name}: already exists at {dest.name}, skipping")
            continue

        print(f"[download] {name}: downloading {url[:80]}...")
        try:
            with httpx.stream("GET", url, follow_redirects=True, timeout=300) as resp:
                resp.raise_for_status()
                total = int(resp.headers.get("content-length", 0))
                downloaded = 0
                with open(dest, "wb") as f:
                    for chunk in resp.iter_bytes(chunk_size=65536):
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total > 0 and downloaded % (1024 * 1024) < 65536:
                            pct = downloaded / total * 100
                            print(f"  {downloaded / 1024 / 1024:.1f} MB / {total / 1024 / 1024:.1f} MB ({pct:.0f}%)")
            print(f"[download] {name}: saved {dest.name} ({dest.stat().st_size / 1024 / 1024:.1f} MB)")
        except Exception as e:
            print(f"[download] {name}: FAILED - {e}")
            if dest.exists():
                dest.unlink()


def download_etymology_atlas():
    """Download Etymology Atlas from HuggingFace using the datasets library or direct URL."""
    dest = RAW_DIR / "etymologies.parquet"
    if dest.exists():
        print("[download] etymology_atlas: already exists, skipping")
        return

    # Try direct parquet download from HuggingFace
    url = "https://huggingface.co/datasets/lukeslp/etymology-atlas/resolve/main/data/etymologies.parquet"
    print(f"[download] etymology_atlas: downloading from HuggingFace...")
    try:
        with httpx.stream("GET", url, follow_redirects=True, timeout=600) as resp:
            resp.raise_for_status()
            with open(dest, "wb") as f:
                for chunk in resp.iter_bytes(chunk_size=65536):
                    f.write(chunk)
        print(f"[download] etymology_atlas: saved ({dest.stat().st_size / 1024 / 1024:.1f} MB)")
    except Exception as e:
        print(f"[download] etymology_atlas: FAILED - {e}")
        if dest.exists():
            dest.unlink()


if __name__ == "__main__":
    download_all()
    download_etymology_atlas()
