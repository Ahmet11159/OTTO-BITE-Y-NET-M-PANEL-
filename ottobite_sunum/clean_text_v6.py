# encoding: utf-8
import re

def clean_text(text):
    lines = text.split('\n')
    cleaned_lines = []
    
    # Kapsamlı ve spesifik düzeltme listesi
    replacements = [
        (r'O\s*TT\s*OBITE', 'OTTOBITE'),
        (r'OTT\s*OBITE', 'OTTOBITE'),
        
        # Garson
        (r'G\s*ars\s*on', 'Garson'),
        (r'Gar\s*son', 'Garson'),
        (r'G\s*ar\s*s\s*on', 'Garson'),
        
        # Davranış
        (r'D\s*a\s*vr\s*anış\s*l\s*arı', 'Davranışları'),
        (r'D\s*a\s*vr\s*anış', 'Davranış'),
        (r'Da\s*vr\s*anış', 'Davranış'),
        (r'da\s*vr\s*anış', 'davranış'),
        
        # Servis
        (r's\s*er\s*vis', 'servis'),
        (r'S\s*er\s*vis', 'Servis'),
        (r'ser\s*vis', 'servis'),
        
        # Personel
        (r'per\s*s\s*onelin\s*in', 'personelinin'),
        (r'per\s*s\s*onel', 'personel'),
        (r'pers\s*onel', 'personel'),
        
        # Salon
        (r's\s*al\s*on', 'salon'),
        (r'S\s*al\s*on', 'Salon'),
        
        # Diğer Terimler
        (r'k\s*ur\s*abilme\s*si', 'kurabilmesi'),
        (r'k\s*or\s*uy\s*abilme\s*si', 'koruyabilmesi'),
        (r'k\s*ur\s*al\s*l\s*arı', 'kuralları'),
        (r'k\s*ur\s*al', 'kural'),
        (r'h\s*a\s*zırl\s*anmış\s*tır', 'hazırlanmıştır'),
        (r'ha\s*zırl\s*anmış\s*tır', 'hazırlanmıştır'),
        (r'mis\s*afir', 'misafir'),
        (r'd\s*ok\s*üman', 'doküman'),
        (r'dok\s*üman', 'doküman'),
        (r'b\s*enims\s*eme\s*si', 'benimsemesi'),
        (r'm\s*emnuniy\s*etini', 'memnuniyetini'),
        (r'd\s*üzenini', 'düzenini'),
        (r'önceliğini', 'önceliğini'),
        (r'Z\s*ih\s*n\s*iy\s*et', 'Zihniyet'),
        (r't\s*empos\s*unu', 'temposunu'),
        (r'd\s*ur\s*uş\s*undan', 'duruşundan'),
        (r'b\s*ak\s*ışından', 'bakışından'),
        (r't\s*ar\s*zından', 'tarzından'),
        (r'd\s*eğ\s*erlendirir', 'değerlendirir'),
        (r'S\s*or\s*umluluk', 'Sorumluluk'),
        (r'k\s*alit\s*esini', 'kalitesini'),
        (r't\s*emsil', 'temsil'),
        (r'e\s*ks\s*iks\s*iz', 'eksiksiz'),
        (r'u\s*y\s*g\s*ul\s*anır', 'uygulanır'),
        (r'd\s*ur\s*uş', 'duruş'),
        (r'h\s*azır', 'hazır'),
        (r'd\s*ur\s*ur', 'durur'),
        (r'y\s*ak\s*laşma', 'yaklaşma'),
        (r'y\s*ak\s*laşırk\s*en', 'yaklaşırken'),
        (r'k\s*onuş\s*ulmaz', 'konuşulmaz'),
        (r'g\s*öz\s*t\s*eması', 'göz teması'),
        (r's\s*ip\s*ariş', 'sipariş'),
        (r'k\s*onuş\s*ma', 'konuşma'),
        (r'i\s*l\s*gileniy', 'ilgileniy'),
        (r'y\s*ar\s*dımcı', 'yardımcı'),
        (r'k\s*ontr\s*ol', 'kontrol'),
        (r'D\s*isiplini', 'Disiplini'),
        (r'g\s*ör\s*ünür', 'görünür'),
        (r'T\s*elef\s*on', 'Telefon'),
        (r'k\s*esinlik\s*le', 'kesinlikle'),
        (r'k\s*ullanılmaz', 'kullanılmaz'),
        (r'k\s*ullanılma\s*ması', 'kullanılmaması'),
        (r'g\s*er\s*eken', 'gereken'),
        (r'i\s*fadeler', 'ifadeler'),
        (r'k\s*açmaz', 'kaçmaz'),
        (r'b\s*eklenmez', 'beklenmez'),
        (r'h\s*arek\s*et', 'hareket'),
        (r'b\s*ilinciyle', 'bilinciyle'),
        (r'ç\s*ağrıl\s*abilirim', 'çağrılabilirim'),
        (r'y\s*as\s*l\s*anılmaz', 'yaslanılmaz'),
        (r'd\s*uvar\s*a', 'duvara'),
        (r'b\s*ağ\s*lı', 'bağlı'),
        (r'g\s*ezilmez', 'gezilmez'),
        (r'c\s*ept\s*e', 'cepte'),
        (r'b\s*oş\s*bo\s*ş\s*a', 'boş boş'),
        (r'a\s*yakt\s*a', 'ayakta'),
        (r'T\s*avır', 'Tavır'),
        (r'İ\s*çindek\s*i', 'İçindeki'),
        (r's\s*ırasınd\s*a', 'sırasında'),
        (r't\s*artışmay\s*a', 'tartışmaya'),
        
        # Genel Harfler
        (r' \.', '.'),
        (r' ,', ','),
    ]

    for line in lines:
        line = line.strip()
        if not line or line.startswith('====') or line.startswith('SAYFA'):
            continue
            
        for pattern, replacement in replacements:
            line = re.sub(pattern, replacement, line, flags=re.IGNORECASE)
            
        # Düzeltmeler sonrası kalan bariz boşlukları temizle (tek harf - boşluk - tek harf)
        # Sadece STOP words olmayanlar için.
        # "t e m p o" -> "tempo" ama "v e" -> "ve"
        # Bu patternleri manuel listeye ekledim, loop riski almayacağım artık.
        
        cleaned_lines.append(line)

    return "\n".join(cleaned_lines)

with open('full_content.txt', 'r', encoding='utf-8') as f:
    text = f.read()

cleaned_text = clean_text(text)

with open('cleaned_content_v6.txt', 'w', encoding='utf-8') as f:
    f.write(cleaned_text)

print("Cleaning V6 complete. Check cleaned_content_v6.txt")
