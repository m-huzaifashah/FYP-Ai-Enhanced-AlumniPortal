import requests

jd_text = "Looking for a Python backend engineer with AWS experience."
with open("dummy.pdf", "wb") as f:
    f.write(b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 55\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(M. Huzaifa Habib Shah Software Engineer MERN Express.js MongoDB React.js) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000219 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n325\n%%EOF")

res = requests.post("http://127.0.0.1:8001/analyze", data={"job_description": jd_text}, files={"file": ("dummy.pdf", open("dummy.pdf", "rb"))})
data = res.json()
print("SBERT SCORE:", data.get("xgb_detail", {}).get("sbert_score"))
print("METHOD:", data.get("semantic_detail", {}).get("method"))
