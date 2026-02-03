# encoding: utf-8
import re

def clean_text(text):
    lines = text.split('\n')
    cleaned_lines = []
    
    # Kapsamlı düzeltme listesi
    # Sıralama önemli: Daha uzun/spesifik olanlar önce gelmeli.
    replacements = [
        (r'O\s*TT\s*OBITE', 'OTTOBITE'),
        (r'OTT\s*OBITE', 'OTTOBITE'),
        (r'G\s*ar\s*s\s*on', 'Garson'),
        (r'Ga\s*r\s*son', 'Garson'),
        (r'G\s*ar\s*son', 'Garson'),
        (r'Gar\s*son', 'Garson'),
        (r'Da\s*v\s*r\s*a\s*n\s*ı\s*ş', 'Davranış'),
        (r'Da\s*vr\s*anış', 'Davranış'),
        (r'da\s*vr\s*anış', 'davranış'),
        (r'dok\s*üman', 'doküman'),
        (r'ser\s*vis', 'servis'),
        (r'gör\s*ev', 'görev'),
        (r'al\s*an', 'alan'),
        (r'Doğr\s*u', 'Doğru'),
        (r'k\s*ur\s*a\s*b\s*il\s*m\s*e\s*s\s*i', 'kurabilmesi'),
        (r'kur\s*abilme\s*si', 'kurabilmesi'),
        (r'düz\s*enini', 'düzenini'),
        (r'mis\s*afir', 'misafir'),
        (r'memnuniy\s*etini', 'memnuniyetini'),
        (r'kor\s*uy\s*abilme\s*si', 'koruyabilmesi'),
        (r'ha\s*zırl\s*anmış\s*tır', 'hazırlanmıştır'),
        (r'ok\s*unmak', 'okunmak'),
        (r'uy\s*gul\s*anmak', 'uygulanmak'),
        (r'Zihniy\s*et', 'Zihniyet'),
        (r'tempo\s*sunu', 'temposunu'),
        (r'dur\s*uş\s*undan', 'duruşundan'),
        (r'de\s*ğerlendirir', 'değerlendirir'),
        (r'Dikk\s*atlidir', 'Dikkatlidir'),
        (r'dikk\s*at', 'dikkat'),
        (r'Sor\s*umluluk', 'Sorumluluk'),
        (r'kalit\s*esini', 'kalitesini'),
        (r'Kur\s*al', 'Kural'),
        (r'el\s*cep\s*t\s*e', 'el cepte'),
        (r'g\s*ezilme\s*z', 'gezilmez'),
        (r'bağ\s*lı', 'bağlı'),
        (r'Duv\s*ar\s*a\s*y\s*as\s*lanılma\s*z', 'Duvara yaslanılmaz'),
        (r'Duv\s*ar\s*a\s*y\s*as', 'Duvara yas'),
        (r'Duv\s*ar', 'Duvar'),
        (r'Bo\s*ş\s*bo\s*ş\s*a\s*y\s*ak\s*ta', 'Boş boş ayakta'), # Tahmin: Boş boş ayakta
        (r'Bo\s*ş\s*bo\s*ş', 'Boş boş'),
        (r'yak\s*ta', 'ayakta'),
        (r'gö\s*z\s*t\s*eması', 'göz teması'),
        (r'gö\s*z\s*t\s*emas\s*ı', 'göz teması'),
        (r'Göz\s*t\s*eması', 'Göz teması'),
        (r'Gö\s*z\s*önündedir', 'Göz önündedir'),
        (r'yüz\s*üne', 'yüzüne'),
        (r'sip\s*ariş', 'sipariş'),
        (r'il\s*gileniy', 'ilgileniy'),
        (r'il\s*gileniy\s*or\s*um', 'ilgileniyorum'),
        (r'yar\s*dımcı', 'yardımcı'),
        (r'se\s*viy\s*e', 'seviye'),
        (r'se\s*viy', 'seviy'),
        (r'gör\s*ünür', 'görünür'),
        (r'benims\s*eme\s*si', 'benimsemesi'),
        (r'per\s*sonelinin', 'personelinin'),
        (r'per\s*soneli', 'personeli'),
        (r'per\s*sonel', 'personel'),
        (r'iş\s*letme', 'işletme'),
        (r'kur\s*al\s*l\s*arı', 'kuralları'),
        (r'ek\s*sik\s*siz', 'eksiksiz'),
        (r'dur\s*uş', 'duruş'),
        (r'D\s*u\s*r\s*u\s*ş', 'Duruş'),
        (r'S\s*a\s*l\s*o\s*n', 'Salon'),
        (r'yak\s*laşırk\s*en', 'yaklaşırken'),
        (r'yak\s*laşma', 'yaklaşma'),
        (r'ke\s*sinlik\s*le', 'kesinlikle'),
        (r'sav\s*unma', 'savunma'),
        (r'yön\s*et\s*i\s*c\s*i', 'yönetici'), # Belki parça parça
        (r'memnuniy\s*et', 'memnuniyet'),
        (r'Rehber\s*i', 'Rehberi'),
        (r'Önceliğ\s*i', 'Önceliği'),
        (r's\s*er\s*vis', 'servis'), # s er vis
        (r'S\s*er\s*vis', 'Servis'),
        (r'sa\s*hip\s*lenilmelidir', 'sahiplenilmelidir'),
        (r'sa\s*hiplenilmelidir', 'sahiplenilmelidir'),
        (r'bil\s*gilendir', 'bilgilendir'),
        (r'konuş\s*ma', 'konuşma'),
        (r'konuş\s*ulma\s*z', 'konuşulmaz'),
        (r'bölünme\s*z', 'bölünmez'),
        (r'bek\s*lenir', 'beklenir'),
        (r'k\s*ur\s*ulma\s*z', 'kurulmaz'),
        (r'mu\s*tlu', 'mutlu'),
        (r'ay\s*rılması', 'ayrılması'),
        (r'dü\s*z\s*gün', 'düzgün'),
        (r'Ha\s*t\s*asız', 'Hatasız'),
        (r'oper\s*as\s*y\s*on', 'operasyon'),
        (r'Op\s*er\s*as\s*y\s*on', 'Operasyon'),
        (r'is\s*tisna', 'istisna'),
        (r'de\s*ne\s*yim', 'deneyim'),
        (r'ha\s*r\s*ek\s*et', 'hareket'),
        (r's\s*ır\s*as\s*ı\s*n\s*d\s*a', 'sırasında'),
        (r'S\s*ır\s*as\s*ı\s*n\s*d\s*a', 'Sırasında'),
        (r'y\s*an\s*lı\s*ş', 'yanlış'),
        (r'y\s*or\s*um', 'yorum'),
        (r'h\s*ak\s*k\s*ın\s*d\s*a', 'hakkında'),
        (r'b\s*il\s*d\s*i\s*r\s*i\s*m\s*l\s*e\s*r\s*i', 'bildirimleri'),
        (r'b\s*ek\s*l\s*e\s*m\s*e\s*k', 'beklemek'),
        (r'ç\s*a\s*l\s*ı\s*ş\s*m\s*a', 'çalışma'),
        (r'd\s*e\s*s\s*t\s*e\s*k', 'destek'),
        (r'e\s*ğ\s*l\s*e\s*n\s*c\s*e', 'eğlence'),
        (r'm\s*o\s*d\s*u\s*n\s*d\s*a', 'modunda'),
        (r'u\s*y\s*u\s*ş\s*u\s*k\s*l\s*u\s*k', 'uyuşukluk'),
        (r'h\s*a\s*k\s*ı\s*m', 'hakim'),
        (r's\s*o\s*r\s*u\s*n\s*l\s*a\s*r', 'sorunlar'),
        (r'i\s*l\s*e\s*t\s*i\s*ş\s*i\s*m', 'iletişim'),
        (r'k\s*a\s*b\s*u\s*l', 'kabul'),
        (r'e\s*d\s*i\s*l\s*e\s*m\s*e\s*z', 'edilemez'),
        (r'k\s*a\s*b\s*ul\s*ed\s*ile\s*me\s*z', 'kabul edilemez'),
        (r'k\s*abul\s*e\s*d\s*ile\s*me\s*z', 'kabul edilemez'),
        (r'k\s*abul', 'kabul'),
        (r'ed\s*ileme\s*z', 'edilemez'),
        (r'ed\s*ile\s*me\s*z', 'edilemez'),
        (r'y\s*er\s*le\s*ş\s*t\s*ir\s*ilir', 'yerleştirilir'),
        (r'y\s*er\s*le\s*ş', 'yerleş'),
        (r'd\s*ur\s*um', 'durum'),
        (r'ç\s*ö\s*z\s*ü\s*m', 'çözüm'),
        (r's\s*ü\s*r\s*e\s*c\s*i', 'süreci'),
        (r'y\s*ö\s*n\s*e\s*t\s*i\s*c\s*i', 'yönetici'),
        (r'g\s*ö\s*r\s*ü\s*ş\s*e\s*r\s*e\s*k', 'görüşerek'),
        (r'ö\s*z\s*e\s*l', 'özel'),
        (r'k\s*e\s*y\s*i\s*f\s*l\s*i', 'keyifli'),
        (r'd\s*e\s*n\s*e\s*y\s*i\s*m', 'deneyim'),
        (r'd\s*i\s*l\s*e\s*r\s*i\s*z', 'dileriz'),
        (r'g\s*i\s*z\s*l\s*e\s*m\s*e\s*k', 'gizlemek'),
        (r'b\s*o\s*ş\s*l\s*u\s*k', 'boşluk'),
        (r'y\s*a\s*r\s*a\s*t\s*m\s*a\s*y\s*a\s*c\s*a\s*k', 'yaratmayacak'),
        (r'y\s*ed\s*ek\s*le\s*me\s*si', 'yedeklemesi'),
        (r'k\s*a\s*y\s*m\s*a\s*s\s*ı\s*n\s*a', 'kaymasına'),
        (r'h\s*a\s*z\s*ı\s*r\s*l\s*ı\s*k', 'hazırlık'),
        (r't\s*a\s*k\s*i\s*p', 'takip'),
        (r't\s*e\s*k\s*l\s*i\s*f', 'teklif'),
        (r'b\s*ı\s*r\s*a\s*k\s*m\s*a\s*k', 'bırakmak'),
        (r'm\s*e\s*c\s*b\s*u\s*r', 'mecbur'),
        
        # Ekler ve son düzeltmeler
        (r' \.', '.'), # Boşluk nokta
        (r' ,', ','),
    ]

    for line in lines:
        line = line.strip()
        if not line or line.startswith('====') or line.startswith('SAYFA'):
            continue
            
        for pattern, replacement in replacements:
            line = re.sub(pattern, replacement, line, flags=re.IGNORECASE)
        
        # Tek harf bırakma temizliği
        while True:
            # "f a r k" -> "fark" (en az 3 harf)
            new_line = re.sub(r'(\s[a-zA-ZçğıöşüÇĞİÖŞÜ])\s+([a-zA-ZçğıöşüÇĞİÖŞÜ])\s+([a-zA-ZçğıöşüÇĞİÖŞÜ])\s+([a-zA-ZçğıöşüÇĞİÖŞÜ])', r'\1\2\3\4', line)
            if new_line == line:
                break
            line = new_line
            
        cleaned_lines.append(line)

    return "\n".join(cleaned_lines)

with open('full_content.txt', 'r', encoding='utf-8') as f:
    text = f.read()

cleaned_text = clean_text(text)

with open('cleaned_content_v3.txt', 'w', encoding='utf-8') as f:
    f.write(cleaned_text)

print("Cleaning V3 complete. Check cleaned_content_v3.txt")
