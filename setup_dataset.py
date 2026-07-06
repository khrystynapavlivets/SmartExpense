import os
import zipfile
import shutil
from pathlib import Path
from dotenv import load_dotenv
from kaggle.api.kaggle_api_extended import KaggleApi

load_dotenv()

TARGET_DIR = Path("data/sample_documents")
DATASET = "onchutrng/sroie20192021"
DOWNLOAD_DIR = Path("data/_kaggle_tmp")
N = 100

TARGET_DIR.mkdir(parents=True, exist_ok=True)
DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

print("Authenticating Kaggle API...")
api = KaggleApi()
api.authenticate()

print(f"Downloading dataset {DATASET}...")
api.dataset_download_files(DATASET, path=str(DOWNLOAD_DIR), unzip=False)

zip_files = list(DOWNLOAD_DIR.glob("*.zip"))
if not zip_files:
    raise FileNotFoundError("Zip archive not found after download")

zip_path = zip_files[0]
print(
    f"Found archive: {zip_path.name} ({zip_path.stat().st_size / 1024 / 1024:.1f} MB)"
)

print("Searching for receipt images in archive...")
with zipfile.ZipFile(zip_path, "r") as zf:
    all_names = zf.namelist()

    jpg_entries = sorted(
        [
            n
            for n in all_names
            if "0325updated.task1train" in n and n.lower().endswith(".jpg")
        ]
    )[:N]

    if not jpg_entries:
        raise FileNotFoundError("No .jpg files found in task1train folder")

    print(f"First {N} images: {[Path(e).name for e in jpg_entries]}")

    for entry in jpg_entries:
        filename = Path(entry).name
        dest = TARGET_DIR / filename
        with zf.open(entry) as src, open(dest, "wb") as dst:
            dst.write(src.read())
        print(f"  Copied: {filename}")

shutil.rmtree(DOWNLOAD_DIR)
print(f"\nTemporary files removed.")

print(f"\nFiles in {TARGET_DIR}:")
for f in sorted(TARGET_DIR.iterdir()):
    size_kb = f.stat().st_size / 1024
    print(f"  {f.name:40s}  {size_kb:8.1f} KB")

print(f"\nTotal files: {len(list(TARGET_DIR.iterdir()))}")
