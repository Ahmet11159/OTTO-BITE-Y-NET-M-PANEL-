# encoding: utf-8
import re

def clean_text(text):
    lines = text.split('\n')
    cleaned_lines = []
    
    # Kapsamlı Replacement Listesi (Son düzeltmeler)
    replacements = [
        # GLOBAL 
        (r'O\s*TT\s*OBITE', 'OTTOBITE'),
        (r'OTT\s*OBITE', 'OTTOBITE'),
        
        # HEADERS & PHRASES (Görselden ve metinden tespit edilenler)
        (r'M\s*u\s*tf\s*ak\s*v\s*ebar', 'Mutfak ve Bar'),
        (r'M\s*u\s*tf\s*ak\s*ve\s*b\s*ar', 'Mutfak ve Bar'),
        (r'M\s*u\s*tf\s*ak', 'Mutfak'),
        (r'E\s*mirverilenyer', 'Emir verilen yer'),
        (r'E\s*mir\s*verilen\s*yer', 'Emir verilen yer'),
        (r'İ\s*letişimsaygılıvenetolmalıdır', 'İletişim saygılı ve net olmalıdır'),
        (r'Y\s*oğunlukta\s*S\s*essizve\s*K\s*ontr\s*ol\s*lü\s*Çalışma', 'Yoğunlukta Sessiz ve Kontrollü Çalışma'),
        (r'Sessizve', 'Sessiz ve'),
        (r'Kontr\s*ol\s*lü', 'Kontrollü'),
        (r'S\s*esyüks\s*el\s*tme', 'Ses yükseltme'),
        (r'S\s*es\s*yükseltme', 'Ses yükseltme'),
        (r'K\s*o\s*şturma', 'Koşturma'),
        (r'sebebi\s*de\s*ğildir', 'sebebi değildir'),
        (r'Kontr\s*ol\s*lüçalışangarson', 'Kontrollü çalışan garson'),
        (r'Kontrollüçalışangarson', 'Kontrollü çalışan garson'),
        (r'yoğunluğuyönetir', 'yoğunluğu yönetir'),
        (r'Misafir\s*Önünde\s*Ekip\s*Disiplini', 'Misafir Önünde Ekip Disiplini'),
        (r'M\s*isafir', 'Misafir'),
        (r'al\s*anı', 'alanı'),
        (r'd\s*eğildir', 'değildir'),
        (r'd\s*e\s*ğil', 'değil'),
        (r'\bde\s*ğil\b', 'değil'),  # word boundary check
        
        # OTHERS
        (r'S\s*on\s*Ha\s*tırl\s*a\s*tma', 'Son Hatırlatma'),
        (r'B\s*eden\s*D\s*ili', 'Beden Dili'),
        (r'S\s*erv\s*is', 'Servis'),
        (r's\s*ırasınd\s*a', 'sırasında'),
        (r'ş\s*ik\s*â\s*y\s*et', 'şikâyet'),
        (r'e\s*tmek', 'etmek'),
        (r'y\s*akınmak', 'yakınmak'),
        (r'u\s*flamak', 'uflamak'),
        (r'p\s*uflamak', 'puflamak'),
        (r'm\s*imik\s*leriyle', 'mimikleriyle'),
        (r'i\s*ma', 'ima'),
        (r'y\s*apmak', 'yapmak'),
        (r'k\s*esinlik\s*le', 'kesinlikle'),
        (r'k\s*ab\s*ul', 'kabul'),
        (r'e\s*dileme\s*z', 'edilemez'),
        (r'G\s*ar\s*sonun', 'Garsonun'),
        (r'i\s*f\s*ade\s*si', 'ifadesi'),
        (r'b\s*eden', 'beden'),
        (r'T\s*ak\s*ım', 'Takım'),
        (r'a\s*rk\s*adaş\s*l\s*arına', 'arkadaşlarına'),
        (r'O\s*per\s*as\s*y\s*ona', 'Operasyona'),
        (r'o\s*lums\s*uz', 'olumsuz'),
        (r'y\s*ansır', 'yansır'),
        (r'm\s*add\s*eler', 'maddeler'),
        (r'u\s*ygul\s*anmak', 'uygulanmak'),
        (r'z\s*or\s*undadır', 'zorunludur'),
        (r'bağ\s*lı', 'bağlı'),
        (r'g\s*er\s*ek\s*en', 'gereken'),
        (r'i\s*l\s*et\s*iş\s*im', 'iletişim'),
        (r'y\s*ak\s*l\s*aş\s*ma', 'yaklaşma'),
        (r'y\s*üz\s*üne', 'yüzüne'),
        (r'k\s*ullanıl', 'Kullanıl'),
        (r's\s*an\s*iy\s*e', 'Saniye'),
        (r'ilgileniy\s*or\s*um', 'İlgileniyorum'),
        (r'y\s*ar\s*dımcı', 'yardımcı'),
        (r'o\s*luy\s*or\s*um', 'oluyorum'),
        (r'h\s*izmet', 'Hizmet'),
        (r'g\s*ecik\s*me\s*si', 'Gecikmesi'),
         (r's\s*er\s*gile\s*y\s*en', 'sergileyen'),
        (r'k\s*e\s*y\s*i\s*f\s*l\s*i', 'keyifli'),
        (r's\s*a\s*ğ\s*l\s*adık', 'sağladık'),
        (r'g\s*ör\s*üş\s*er\s*ek', 'görüşerek'),
        (r'b\s*a\s*ş\s*ın\s*a', 'başına'),
        (r'g\s*iz\s*lemek', 'gizlemek'),
        (r'i\s*s\s*tisna\s*i', 'istisnai'),
        (r'v\s*ur\s*g\s*ul\s*anar\s*ak', 'vurgulanarak'),
        (r'a\s*k\s*t\s*arılır', 'aktarılır'),
        (r'i\s*htiy\s*aç', 'ihtiyaç'),
        (r'ö\s*ncelik\s*l\s*idir', 'önceliklidir'),
        (r'o\s*na\s*yı', 'onayı'),
        (r'm\s*u\s*t\s*ab\s*ak\s*a\s*t', 'mutabakat'),
        (r'z\s*or\s*unludur', 'zorunludur'),
        (r'b\s*o\s*ş\s*l\s*u\s*k', 'boşluk'),
        (r'y\s*ar\s*a\s*t\s*m\s*a\s*y\s*ac\s*ak', 'yaratmayacak'),
        (r'b\s*a\s*ğ\s*l\s*antılı', 'bağlantılı'),
         (r'M\s*u\s*tf\s*ak', 'Mutfak'),
    ]
    
    # 2. Logic:
    # Bozuk: "Mu tf ak"
    # Logic: Eğer bir satırda "tek harf boşluk tek harf" deseni varsa merge et.
    # Ancak "ve" koru. "de" koru.
    
    # Yeni bir algoritma: Single Letter Merger (v9)
    # Satırdaki tokenler: "Mu" "tf" "ak". Hepsi len<=2.
    # Merge -> "Mutfak".
    
    def merge_shorts(line):
        tokens = line.split(' ')
        new_tokens = []
        buffer = ""
        
        # Stop words: bunları asla merge'e dahil etme.
        # "ve", "de", "Ki", "Bu", "Şu", "O", "Bi", "En", "Az", "Ön", "İç", "Uç", "El", "Al", "Un", "İş"
        STOP = {'ve', 'de', 'da', 'ki', 'bu', 'şu', 'o', 'bi', 'en', 'az', 'ön', 'iç', 'uç', 'el', 'al', 'un', 'iş', 'İş', 'Ve', 'De', 'Da', 'Ki', 'Bu', 'Şu', 'O', 'Bi', 'En', 'Az', 'Ön', 'İç', 'Uç', 'El', 'Al', 'Un'}
        
        for token in tokens:
            if not token: continue
            
            # Temiz token (noktalama hariç)
            clean = re.sub(r'[.,;:]', '', token)
            is_stop = clean in STOP
            
            # Kriter: Token kısa mı? Lex <= 2 (Mu, tf, ak, Ses, yüks, el, tme)
            # "Sesyüks" (7) -> Uzun
            # "el" (2) -> Kısa
            # "tme" (3) -> Kısa (Limit 3 olsun)
            
            is_short = len(clean) <= 3
            
            if is_stop:
                if buffer:
                    new_tokens.append(buffer)
                    buffer = ""
                new_tokens.append(token)
            else:
                if is_short:
                    # Kısa token, buffera ekle
                    buffer += token
                else:
                    # Uzun token
                    if buffer:
                        # Önce bufferı flushla (belki "Ses" + "yüks" idi)
                        # Ama "Sesyüks" zaten uzun.
                        # Eğer buffer varsa, buffer + token birleşsin mi?
                        # "S" + "esyüks" -> Evet
                        # "Mutfak" (buffer) + "Masası" (token) -> Hayır
                        
                        # Eğer buffer kısa parçaların toplamıysa ve yeni gelen uzunsa:
                        # Genelde PDF hatası: "S" + "esyüks".
                        # Yani birleştirelim.
                        
                        buffer += token
                    else:
                        # Buffer yok, bu uzun tokenı buffera al (belki devamı kısadır "yüks" + "el") - Hayır "Sesyüks" tek başına anlamlı olabilir ama devamı "el" ise "Sesyüksel" olur.
                        # En güzeli: Uzun tokenı buffera ekle. Buffer flushlama sadece STOP word veya Satır Sonu.
                        buffer += token
        
        if buffer:
            new_tokens.append(buffer)
            
        return " ".join(new_tokens)

    for line in lines:
        line = line.strip()
        if not line or line.startswith('====') or line.startswith('SAYFA'):
            continue
            
        # 1. Regex Replacements (Garantili Düzeltmeler)
        for pattern, replacement in replacements:
            line = re.sub(pattern, replacement, line, flags=re.IGNORECASE)
        
        # 2. Genel Merge logic (V9) çalıştırılabilir ama regex listesi çok kapsamlı tutulduğu için
        # "Mu tf ak" gibi şeyleri regex ile yakalamak daha güvenli şu an.
        # "M u tf ak" -> Regex yakalar.
        
        # "Sesyüks el tme" -> Bu regexte yok. Bunu mergeleyelim.
        # line = merge_shorts(line) # RISKLI. "Misafir Garson" -> "MisafirGarson" yapar.
        
        # O yüzden merge_shorts yerine "boşluk silme" regexi:
        # (\w+)\s+(el)\s+(tme) -> \1\2\3
        # (\w+)\s+(leri)
        
        suffixes = ['lar', 'ler', 'nın', 'nin', 'nun', 'nün', 'ye', 'ya', 'yı', 'yi', 'yu', 'yü', 'sı', 'si', 'su', 'sü', 'dır', 'dir', 'dur', 'dür', 'tır', 'tir', 'tur', 'tür', 'mak', 'mek', 'maz', 'mez', 'el', 'tme', 'me', 'ma', 'sın', 'sin', 'sun', 'sün', 'ız', 'iz', 'uz', 'üz']
        
        for s in suffixes:
            # Word + Space + Suffix -> WordSuffix
            pattern = r'(\w)\s+(' + s + r')\b' 
            line = re.sub(pattern, r'\1\2', line, flags=re.IGNORECASE)
        
        cleaned_lines.append(line)

    return "\n".join(cleaned_lines)

# Read file
with open('full_content.txt', 'r', encoding='utf-8') as f:
    text = f.read()

cleaned_text = clean_text(text)

with open('cleaned_content_v9.txt', 'w', encoding='utf-8') as f:
    f.write(cleaned_text)

print("Cleaning V9 complete.")
