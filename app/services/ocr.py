from pathlib import Path

from PIL import Image


def load_image(image_path: str) -> Image.Image:
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")
    return Image.open(path)


def extract_receipt_data(image_path: str) -> dict:
    """
    Placeholder for receipt parsing pipeline.
    Will use langchain-groq vision model to extract structured fields.
    """
    image = load_image(image_path)
    width, height = image.size

    return {
        "vendor": None,
        "total": None,
        "date": None,
        "address": None,
        "raw_text": None,
        "image_path": image_path,
        "_meta": {"width": width, "height": height},
    }
