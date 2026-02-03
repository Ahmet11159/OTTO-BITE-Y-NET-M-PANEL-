from PyPDF2 import PdfReader

# PDF dosyasını oku
reader = PdfReader("iş1.pdf")

# Tüm sayfaların içeriğini yazdır
for i, page in enumerate(reader.pages):
    text = page.extract_text()
    print(f"\n{'='*60}")
    print(f"SAYFA {i+1}")
    print('='*60)
    print(text)
