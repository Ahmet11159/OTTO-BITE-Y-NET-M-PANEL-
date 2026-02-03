# encoding: utf-8
import re

def clean_text(text):
    # 1. Genel temizlik
    lines = text.split('\n')
    cleaned_lines = []
    
    # Özel düzeltme haritası (Sık geçen hatalar)
    replacements = [
        (r'OTT\s*OBITE', 'OTTOBITE'),
        (r'G\s*ar\s*s\s*on', 'Garson'),
        (r'Gar\s*son', 'Garson'),
        (r'Da\s*vr\s*anış', 'Davranış'),
        (r'da\s*vr\s*anış', 'davranış'),
        (r'ser\s*vis', 'servis'),
        (r'gör\s*ev', 'görev'),
        (r'al\s*an', 'alan'),
        (r'benims\s*eme\s*si', 'benimsemesi'),
        (r'kur\s*abilme\s*si', 'kurabilmesi'),
        (r'kor\s*uy\s*abilme\s*si', 'koruyabilmesi'),
        (r'ha\s*zırl\s*anmış\s*tır', 'hazırlanmıştır'),
        (r'ok\s*unmak', 'okunmak'),
        (r'uy\s*gul\s*anmak', 'uygulanmak'),
        (r'tempo\s*sunu', 'temposunu'),
        (r'dur\s*uş\s*undan', 'duruşundan'),
        (r'iş\s*letme', 'işletme'),
        (r'kalit\s*esini', 'kalitesini'),
        (r'kur\s*al\s*l\s*arı', 'kuralları'),
        (r'kur\s*al', 'kural'),
        (r'tartışma\s*ya', 'tartışmaya'),
        (r'ek\s*sik\s*siz', 'eksiksiz'),
        (r'du\s*ru\s*ş', 'duruş'),
        (r'D\s*u\s*r\s*u\s*ş', 'Duruş'),
        (r'S\s*a\s*l\s*o\s*n', 'Salon'),
        (r'İ\s*ç\s*i\s*n\s*d\s*e\s*k\s*i', 'İçindeki'),
        (r'T\s*a\s*v\s*ı\s*r', 'Tavır'),
        (r'el\s*cep\s*t\s*e', 'el cepte'),
        (r'dur\s*ulma\s*z', 'durulmaz'),
        (r'çağrıl\s*abilirim', 'çağrılabilirim'),
        (r'M\s*a\s*s\s*a', 'Masa'),
        (r'y\s*a\s*k\s*l\s*a\s*ş\s*m\s*a', 'yaklaşma'),
        (r'İ\s*l\s*e\s*t\s*i\s*ş\s*i\s*m', 'İletişim'),
        (r'yak\s*laşırk\s*en', 'yaklaşırken'),
        (r'göz\s*teması', 'göz teması'),
        (r'gö\s*z\s*t\s*eması', 'göz teması'),
        (r'konuş\s*ulma\s*z', 'konuşulmaz'),
        (r'bakmadan', 'bakmadan'),
        (r'alınma\s*z', 'alınmaz'),
        (r'il\s*gileniy\s*or\s*um', 'ilgileniyorum'),
        (r'kontr\s*ol', 'kontrol'),
        (r'D\s*i\s*s\s*i\s*p\s*l\s*i\s*n\s*i', 'Disiplini'),
        (r'mis\s*afir', 'misafir'),
        (r'dik\s*k\s*at', 'dikkat'),
        (r'ke\s*sinlik\s*le', 'kesinlikle'),
        (r'gör\s*ünür', 'görünür'),
        (r'bak\s*mıy\s*or\s*um', 'bakmıyorum'),
        (r'sav\s*unma', 'savunma'),
        (r'yön\s*et\s*i\s*c\s*i', 'yönetici'),
        (r'per\s*sonel', 'personel'),
        (r'harek\s*et', 'hareket'),
        (r'memnuniy\s*et', 'memnuniyet'),
    ]

    for line in lines:
        line = line.strip()
        if not line or line.startswith('====') or line.startswith('SAYFA'):
            continue
            
        # 1. Regex Replacements
        for pattern, replacement in replacements:
            line = re.sub(pattern, replacement, line, flags=re.IGNORECASE)
            
        # 2. General heuristic for split suffixes
        # "s i", "l a r ı", "l i k" gibi common suffixleri birleştir
        # word + space + suffix
        # (word)\s+(suffix)
        
        # Çok agresif birleştirme:
        # En az 2 harfli bir kelime, boşluk, en az 1 harfli bir kelime -> Birleştirince valid mi?
        # Bu zor.
        
        # O yüzden manuel listeyi zengin tuttum ve ek olarak:
        # Tek harf + Boşluk + Tek Harf -> Birleştir
        temp_line = line
        prev_line = ""
        while temp_line != prev_line:
            prev_line = temp_line
            temp_line = re.sub(r'(^|\s)([a-zA-ZçğıöşüÇĞİÖŞÜ])\s+([a-zA-ZçğıöşüÇĞİÖŞÜ])', r'\1\2\3', temp_line)
        line = temp_line

        # "l ar", "l er" eklerini birleştir
        line = re.sub(r'([a-zA-ZçğıöşüÇĞİÖŞÜ])\s+(lar|ler|nın|nin|nun|nün|yı|yi|yu|yü)\b', r'\1\2', line, flags=re.IGNORECASE)
        line = re.sub(r'([a-zA-ZçğıöşüÇĞİÖŞÜ])\s+(dır|dir|dur|dür|tür|tır)\b', r'\1\2', line, flags=re.IGNORECASE)
        line = re.sub(r'([a-zA-ZçğıöşüÇĞİÖŞÜ])\s+(maz|mez|mak|mek)\b', r'\1\2', line, flags=re.IGNORECASE)

        cleaned_lines.append(line)

    return "\n".join(cleaned_lines)

# Dosyayı oku
with open('full_content.txt', 'r', encoding='utf-8') as f:
    text = f.read()

cleaned_text = clean_text(text)

# Sonuçları yaz
with open('cleaned_content_v2.txt', 'w', encoding='utf-8') as f:
    f.write(cleaned_text)

print("Cleaning complete. Check cleaned_content_v2.txt")
