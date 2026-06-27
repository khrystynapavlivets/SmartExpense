from typing import Literal

from pydantic import BaseModel

from app.services.ai_base import get_ai_client
from app.core.config import settings


class DocumentClassification(BaseModel):
    document_type: Literal["receipt", "utility_bill", "taxi", "invoice", "other"]


PROMPT = """You are a document classifier. Based on the text extracted from a document,
determine what type of document it is and return exactly one of these values:

- receipt: store purchase, supermarket, café, restaurant, retail shop
- utility_bill: electricity, water, gas, internet, phone bill
- taxi: ride-hailing, cab, Uber, Bolt, transport receipt
- invoice: B2B document with invoice number, due date, line items
- other: anything that does not fit the above categories
"""


def classify_document(raw_text: str) -> str:
    result = get_ai_client().chat.completions.create(
        model=settings.GROQ_CLASSIFIER_MODEL,
        messages=[
            {"role": "system", "content": PROMPT},
            {"role": "user", "content": raw_text},
        ],
        temperature=0,
        response_model=DocumentClassification,
    )

    return result.document_type


