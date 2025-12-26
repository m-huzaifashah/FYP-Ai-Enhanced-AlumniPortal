import fitz  # PyMuPDF
import pytesseract
from pdf2image import convert_from_bytes


def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""

    # 🔹 Step 1: Try normal text extraction
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            text += page.get_text()
    except Exception:
        pass

    # 🔹 If text found, return
    if text.strip():
        return text.lower()

    # 🔹 Step 2: OCR fallback for image-based PDFs
    try:
        images = convert_from_bytes(file_bytes)
        ocr_text = ""
        for img in images:
            ocr_text += pytesseract.image_to_string(img)
        return ocr_text.lower()
    except Exception:
        return ""
