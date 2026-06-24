import base64
from pathlib import Path
import instructor
from groq import Groq

from app.schemas.expense import ExpenseCreate

# Lazy-initialized client — created on first use to avoid import-time failure
_ai_client = None


def _get_client():
    global _ai_client
    if _ai_client is None:
        _ai_client = instructor.from_groq(Groq(), mode=instructor.Mode.JSON)
    return _ai_client


def _encode_image(image_path: str) -> str:
    """Read an image file and return its base64-encoded content."""
    with open(image_path, "rb") as f:
        return base64.standard_b64encode(f.read()).decode("utf-8")


def extract_with_vision(image_path: str) -> ExpenseCreate:
    """
    Send an image to the Groq vision model and extract structured expense data.
    Returns an ExpenseCreate with vendor, total, date, address, and image_path populated.
    """
    b64 = _encode_image(image_path)
    suffix = Path(image_path).suffix.lower()
    media_type = "image/png" if suffix == ".png" else "image/jpeg"

    prompt = (
        "You are a receipt parsing assistant. Look at this receipt image and extract "
        "structured data: vendor name, total amount as a number, date, address, "
        "and raw_text (all text visible on the receipt transcribed as-is). "
        "If any field is not present, set it to null."
    )

    # instructor parses the model response directly into ExpenseCreate via JSON mode
    result = _get_client().chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{media_type};base64,{b64}"},
                    },
                ],
            }
        ],
        temperature=0,
        response_model=ExpenseCreate,
    )
    result.image_path = image_path
    return result


if __name__ == "__main__":
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

    PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
    TEST_IMAGE = str(PROJECT_ROOT / "data/sample_documents/X00016469612.jpg")

    print(f"Testing vision pipeline on: {TEST_IMAGE}\n")
    try:
        data = extract_with_vision(TEST_IMAGE)
        print("Result:")
        print(data.model_dump_json(indent=2))
    except Exception as e:
        print(f"Failed: {e}")
