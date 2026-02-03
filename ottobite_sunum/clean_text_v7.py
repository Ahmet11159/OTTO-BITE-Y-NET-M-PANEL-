# encoding: utf-8
import re

def clean_text(text):
    lines = text.split('\n')
    cleaned_lines = []
    
    # 1. Kapsamlı Replacement Listesi (Görseldeki hatalara göre güncellendi)
    # Sıralama: En uzundan en kısaya
    replacements = [
        # OTTOBITE & Başlıklar
        (r'O\s*TT\s*OBITE', 'OTTOBITE'),
        (r'OTT\s*OBITE', 'OTTOBITE'),
        (r'A\s*na\s*F\s*ikir', 'Ana Fikir'),
        (r'S\s*on\s*Ha\s*tırl\s*a\s*tma', 'Son Hatırlatma'),
        (r'D\s*ikk\s*a\s*t', 'Dikkat'),
        (r'G\s*ars\s*on', 'Garson'),
        (r'G\s*ar\s*s\s*on', 'Garson'),
        
        # Kelimeler
        (r'i\s*s\s*t\s*er', 'ister'),
        (r'r\s*ehber\s*de', 'rehberde'),
        (r'h\s*izmet', 'hizmet'),
        (r'd\s*e\s*ğ\s*il', 'değil'),
        (r'm\s*ark\s*amızın', 'markamızın'),
        (r'y\s*aş\s*a\s*y\s*an', 'yaşayan'),
        (r't\s*emsilcisiyiz', 'temsilcisiyiz'),
        (r'S\s*or\s*umluluk', 'Sorumluluk'),
        (r'n\s*e\s*z\s*ak\s*etle', 'nezaketle'),
        (r'p\s*r\s*of\s*e\s*s\s*y\s*onel', 'profesyonel'),
        (r's\s*er\s*gile\s*y\s*en', 'sergileyen'),
        (r'y\s*a\s*l\s*nız\s*ca', 'yalnızca'),
        (r'ö\s*r\s*ülmüş', 'örülmüş'),
        (r'd\s*ene\s*yim', 'deneyim'),
        (r's\s*unmak\s*tır', 'sunmaktır'),
        (r'b\s*aş\s*arı', 'başarı'),
        (r'm\s*utf\s*aktan', 'mutfaktan'),
        (r'k\s*asaya', 'kasaya'),
        (r't\s*en', 'ten'),
        (r'b\s*ara', 'bara'),
        (r'k\s*adar', 'kadar'),
        (r'n\s*ok\s*tada', 'noktada'),
        (r'a\s*ynı', 'aynı'),
        (r't\s*ek', 'tek'),
        (r'e\s*kip', 'ekip'),
        (r'o\s*l\s*abi\s*lmek\s*tir', 'olabilmektir'),
        (r'a\s*l\s*tında', 'altında'),
        (r'b\s*irimde', 'birimde'),
        (r'o\s*lur\s*sak', 'olursak'),
        (r'o\s*l\s*alım', 'olalım'),
        (r'h\s*er\s*birimiz', 'her birimiz'),
        (r'b\s*irimler', 'birimler'),
        (r'a\s*r\s*ası', 'arası'),
        (r'k\s*us\s*ur\s*suz', 'kusursuz'),
        (r'u\s*yum', 'uyum'),
        (r'y\s*ük\s*sek', 'yüksek'),
        (r'h\s*ar\s*ek\s*et', 'hareket'),
        (r'e\s*der\s*ek', 'ederek'),
        (r'm\s*is\s*afirlerimiz\s*e', 'misafirlerimize'),
        (r'r\s*uh', 'ruh'),
        (r'h\s*alini', 'halini'),
        (r'y\s*ön\s*etir', 'yönetir'),
        (r'ak\s*ışını', 'akışını'),
        (r's\s*er\s*vis', 'servis'),
        (r'S\s*er\s*vis', 'Servis'),
        (r'g\s*ör\s*ev', 'görev'),
        (r'd\s*ok\s*üman', 'doküman'),
        (r'p\s*er\s*s\s*onel', 'personel'),
        (r't\s*artışma', 'tartışma'),
        (r'u\s*ygul\s*anmak', 'uygulanmak'),
        (r'h\s*azırl\s*anmış', 'hazırlanmış'),
        (r'k\s*ur\s*abilme', 'kurabilme'),
        (r'k\s*or\s*uy\s*abilme', 'koruyabilme'),
        (r'm\s*emn\s*uniy\s*et', 'memnuniyet'),
        (r'd\s*üzenini', 'düzenini'),
        (r'b\s*enims\s*eme', 'benimseme'),
        (r'ak\s*ış', 'akış'),
        (r'k\s*esint\s*isiz', 'kesintisiz'),
        (r'i\s*ler\s*leme', 'ilerleme'),
        (r'b\s*ağ\s*lantılı', 'bağlantılı'),
        (r'p\s*lanl\s*ama', 'planlama'),
        (r'G\s*ör\s*üş\s*ü', 'Görüşü'),
        (r'y\s*ığıl\s*a', 'yığıla'),
        (r'y\s*er\s*leş', 'yerleş'),
        
        # Kelime başı/sonu düzeltmeleri
        (r'\bde\s+ğil\b', 'değil'),
        (r'\bS\s+on\b', 'Son'),
        (r'\bH\s+a\b', 'Ha'),
        (r'\bt\s+a\b', 'ta'),
        (r'\bv\s+e\b', 've'), # "v e" -> ve (Dikkat stop word ama güvenli artık)
    ]
    
    # 2. Agresif Temizlik Fonksiyonu (V4'ten esinlenildi ama kontrollü)
    # Temel mantık: Metindeki tüm "tek harf + boşluk + tek harf" yapılarını birleştir.
    # Ancak "A ve B" gibi durumları koru.
    
    SAFE_WORDS = {'ve', 'ile', 'bi', 'bu', 'şu', 'o', 'A', 'B', 'C', '1', '2', '3', '4'}
    
    def aggressive_fix(line):
        tokens = line.split(' ')
        new_tokens = []
        buffer = ""
        
        for token in tokens:
            if not token: 
                continue
                
            # Noktalama temizliği
            clean_t = re.sub(r'[.,;:]', '', token)
            
            # Eğer buffer doluysa ve gelen token tek harfse (veya kısa heceyse) ekle
            if buffer:
                # Bir önceki token bir parça idi (buffer).
                # Eğer şimdiki token STOP word değilse birleştir.
                if clean_t in SAFE_WORDS and len(buffer) > 2: 
                    # Buffer yeterince uzun, belki kelime bitti, yeni kelime bu safe word.
                    new_tokens.append(buffer)
                    buffer = ""
                    new_tokens.append(token)
                else:
                    # Birleştirmeye devam
                    buffer += token
            else:
                # Buffer boş.
                # Eğer bu token tek harfse veya çok kısaysa (len<3) ve safe word değilse buffera al.
                if len(clean_t) < 3 and clean_t not in SAFE_WORDS:
                     buffer = token
                else:
                    new_tokens.append(token)
        
        if buffer:
            new_tokens.append(buffer)
            
        return " ".join(new_tokens)

    for line in lines:
        line = line.strip()
        if not line or line.startswith('====') or line.startswith('SAYFA'):
            continue
            
        # 1. Regex Pass
        for pattern, replacement in replacements:
            line = re.sub(pattern, replacement, line, flags=re.IGNORECASE)
        
        # 2. Heuristik Pass (Regex'in kaçırdığı "t a k ı m" gibiler için)
        # Sadece harflerden oluşan ve aralarında boşluk olan dizileri bul.
        # r'\b([a-zA-ZçğıöşüÇĞİÖŞÜ])\s+([a-zA-ZçğıöşüÇĞİÖŞÜ])\b' -> bu 2 harf birleştirir.
        # Bunu loop ile yaparsak: t a k ı m -> ta k ı m -> tak ı m -> takı m -> takım
        
        old_line = ""
        while old_line != line:
            old_line = line
            # Stop words koruması: "v e" -> "ve" olsun ama "A ve B" -> "AveB" olmasın.
            # Regex: (Harf) (Harf)
            # Bu regex "ve" yi de birleştirir. Zaten "ve" bitişik olmalı.
            
            # Risk: "o" (zamir).
            # Metinde "o" zamiri tek başına neredeyse yok, hep kelime eki gibi duruyor "G ars on".
            
            # Güvenli mod: Sadece bilinen bozukluk paternleri.
            # "b i r", "i ç i n", "k a d a r".
            
            line = re.sub(r'(\b[a-zA-ZçğıöşüÇĞİÖŞÜ])\s+([a-zA-ZçğıöşüÇĞİÖŞÜ]\b)', r'\1\2', line)
            
        # Son temizlik
        line = re.sub(r'(\w)\s+([,:.;])', r'\1\2', line) # "kelime ," -> "kelime,"
        
        cleaned_lines.append(line)

    return "\n".join(cleaned_lines)

with open('full_content.txt', 'r', encoding='utf-8') as f:
    text = f.read()

cleaned_text = clean_text(text)

with open('cleaned_content_v7.txt', 'w', encoding='utf-8') as f:
    f.write(cleaned_text)

print("Cleaning V7 complete. Check cleaned_content_v7.txt")
