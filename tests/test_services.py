import pytest
from app.schemas.expense import ExpenseCreate

# ---------------------------------------------------------------------------
# OCR service — extract_with_vision
# ---------------------------------------------------------------------------


def test_extract_with_vision_returns_expense_create(mocker, tmp_path):
    # Create a dummy image file
    fake_image = tmp_path / "receipt.jpg"
    fake_image.write_bytes(b"\xff\xd8\xff\xd9")  # minimal JPEG marker

    mock_result = ExpenseCreate(
        vendor="Coffee Shop",
        total=5.50,
        date="2024-06-01",
        address="1 Coffee Ln",
        raw_text="Coffee Shop\nLatte 5.50\nTotal 5.50",
    )

    mock_client = mocker.MagicMock()
    mock_client.chat.completions.create.return_value = mock_result
    mocker.patch("app.services.ocr.get_ai_client", return_value=mock_client)

    from app.services.ocr import extract_with_vision

    result = extract_with_vision(str(fake_image))

    assert result.vendor == "Coffee Shop"
    assert result.total == 5.50
    assert result.image_path == str(fake_image)


def test_extract_with_vision_sets_image_path(mocker, tmp_path):
    fake_image = tmp_path / "receipt.png"
    fake_image.write_bytes(b"\x89PNG\r\n")

    mock_result = ExpenseCreate(vendor="Shop", total=10.0)
    mock_client = mocker.MagicMock()
    mock_client.chat.completions.create.return_value = mock_result
    mocker.patch("app.services.ocr.get_ai_client", return_value=mock_client)

    from app.services.ocr import extract_with_vision

    result = extract_with_vision(str(fake_image))

    assert result.image_path == str(fake_image)


def test_extract_with_vision_uses_png_media_type(mocker, tmp_path):
    fake_image = tmp_path / "scan.png"
    fake_image.write_bytes(b"\x89PNG\r\n")

    mock_result = ExpenseCreate()
    mock_client = mocker.MagicMock()
    mock_client.chat.completions.create.return_value = mock_result
    mocker.patch("app.services.ocr.get_ai_client", return_value=mock_client)

    from app.services.ocr import extract_with_vision

    extract_with_vision(str(fake_image))

    call_messages = mock_client.chat.completions.create.call_args.kwargs["messages"]
    image_url = call_messages[0]["content"][1]["image_url"]["url"]
    assert image_url.startswith("data:image/png;base64,")


def test_extract_with_vision_file_not_found(mocker):
    mocker.patch("app.services.ocr.get_ai_client")
    from app.services.ocr import extract_with_vision

    with pytest.raises(FileNotFoundError):
        extract_with_vision("/nonexistent/path/receipt.jpg")


# ---------------------------------------------------------------------------
# Classifier service — classify_document
# ---------------------------------------------------------------------------

RECEIPT_TEXT = "SUPERMARKET XYZ\nApple 1.50\nBread 2.00\nTotal: 3.50\nCash paid: 5.00"
UTILITY_TEXT = "Kyivenergo\nElectricity bill\nAccount: 123456\nAmount due: 450.00 UAH"
TAXI_TEXT = "Uber\nTrip from Airport to City Center\nDistance: 15 km\nFare: 12.00"
INVOICE_TEXT = (
    "INVOICE #2024-001\nDue date: 2024-07-01\nItem: Consulting 5h x 100\nTotal: 500.00"
)


@pytest.mark.parametrize(
    "text,expected_type",
    [
        (RECEIPT_TEXT, "receipt"),
        (UTILITY_TEXT, "utility_bill"),
        (TAXI_TEXT, "taxi"),
        (INVOICE_TEXT, "invoice"),
    ],
)
def test_classify_document_returns_correct_type(mocker, text, expected_type):
    from app.services.classifier import DocumentClassification

    mock_result = DocumentClassification(document_type=expected_type)
    mock_client = mocker.MagicMock()
    mock_client.chat.completions.create.return_value = mock_result
    mocker.patch("app.services.classifier.get_ai_client", return_value=mock_client)

    from app.services.classifier import classify_document

    result = classify_document(text)

    assert result == expected_type


def test_classify_document_passes_raw_text_to_llm(mocker):
    from app.services.classifier import DocumentClassification

    mock_result = DocumentClassification(document_type="receipt")
    mock_client = mocker.MagicMock()
    mock_client.chat.completions.create.return_value = mock_result
    mocker.patch("app.services.classifier.get_ai_client", return_value=mock_client)

    from app.services.classifier import classify_document

    classify_document(RECEIPT_TEXT)

    call_messages = mock_client.chat.completions.create.call_args.kwargs["messages"]
    user_message = next(m for m in call_messages if m["role"] == "user")
    assert user_message["content"] == RECEIPT_TEXT


def test_classify_document_uses_temperature_zero(mocker):
    from app.services.classifier import DocumentClassification

    mock_result = DocumentClassification(document_type="other")
    mock_client = mocker.MagicMock()
    mock_client.chat.completions.create.return_value = mock_result
    mocker.patch("app.services.classifier.get_ai_client", return_value=mock_client)

    from app.services.classifier import classify_document

    classify_document("some text")

    kwargs = mock_client.chat.completions.create.call_args.kwargs
    assert kwargs["temperature"] == 0
