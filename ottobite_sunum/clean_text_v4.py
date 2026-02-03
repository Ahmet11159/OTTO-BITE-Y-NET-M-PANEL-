# encoding: utf-8
import re

def clean_text(text):
    lines = text.split('\n')
    cleaned_lines = []
    
    # 1. Aşama: Bilinen parça birleştirmeleri (Multi-char chunks)
    replacements = [
        (r'O\s*TT\s*OBITE', 'OTTOBITE'),
        (r'OTT\s*OBITE', 'OTTOBITE'),
        (r'ser\s*vis', 'servis'),
        (r'gör\s*ev', 'görev'),
        (r'al\s*an', 'alan'),
        (r'kur\s*abilme\s*si', 'kurabilmesi'),
        (r'kor\s*uy\s*abilme\s*si', 'koruyabilmesi'),
        (r'ha\s*zırl\s*anmış\s*tır', 'hazırlanmıştır'),
        (r'tempo\s*sunu', 'temposunu'),
        (r'kalit\s*esini', 'kalitesini'),
        (r'el\s*cep\s*t\s*e', 'el cepte'),
        (r'g\s*ezilme\s*z', 'gezilmez'),
        (r'bağ\s*lı', 'bağlı'),
        (r'yas\s*lanılma\s*z', 'yaslanılmaz'),
        (r'çağrıl\s*abilirim', 'çağrılabilirim'),
        (r'yak\s*laşma', 'yaklaşma'),
        (r'yak\s*laşırk\s*en', 'yaklaşırken'),
        (r'göz\s*teması', 'göz teması'),
        (r'bak\s*madan', 'bakmadan'),
        (r'alın\s*maz', 'alınmaz'),
        (r'il\s*gileniy\s*or\s*um', 'ilgileniyorum'),
        (r'yar\s*dımcı', 'yardımcı'),
        (r'konuş\s*ma', 'konuşma'),
        (r'konuş\s*ulma\s*z', 'konuşulmaz'),
        (r'bölünme\s*z', 'bölünmez'),
        (r'kur\s*ulma\s*z', 'kurulmaz'),
        (r'mutlu', 'mutlu'),
        (r'ayrılması', 'ayrılması'),
        (r'düzgün', 'düzgün'),
        (r'hatasız', 'hatasız'),
        (r'operasyon', 'operasyon'),
        (r'istisna', 'istisna'),
        (r'deneyim', 'deneyim'),
        (r'hareket', 'hareket'),
        (r'sırasında', 'sırasında'),
        (r'yanlış', 'yanlış'),
        (r'yorum', 'yorum'),
        (r'hakkında', 'hakkında'),
        (r'bildirimleri', 'bildirimleri'),
        (r'dok\s*üman', 'doküman'),
        (r'mis\s*afir', 'misafir'),
    ]

    # 2. Aşama: Agresif Tek Harf Birleştirme
    # Bu regex, boşlukla ayrılmış tek harfleri bulur ve birleştirir.
    # Örn: "k a l e m" -> "kalem", "v e" -> "ve", "D a vr" -> "Davr"
    # Dikkat: "o masaya" -> "omasaya" riskini göze alıyoruz, gerekirse sonradan açarız.
    
    # Desen: (KelimeSınırı)(TekHarf)(Boşluk)(TekHarf)(KelimeSınırı)
    # Ancak Python re'da bu loop ile yapılmalı.
    
    def aggressive_merge(line):
        # Sadece harfler için birleştirme yap. Noktalama işaretlerine dokunma.
        # Desen: Bir harf, sonra boşluk, sonra bir harf.
        # Öncesinde ve sonrasında harf olmamasına gerek yok, akışkan birleştirme istiyoruz.
        # "t e m p o" -> "temp o" -> "tempo"
        
        old_line = ""
        while old_line != line:
            old_line = line
            # ([Harf])\s+([Harf]) -> \1\2
            # Sadece TR harfleri.
            line = re.sub(r'([a-zA-ZçğıöşüÇĞİÖŞÜ])\s+([a-zA-ZçğıöşüÇĞİÖŞÜ])', r'\1\2', line, flags=re.IGNORECASE)
        return line

    for line in lines:
        line = line.strip()
        if not line or line.startswith('====') or line.startswith('SAYFA'):
            continue
            
        # Önce replacement listesi
        for pattern, replacement in replacements:
            line = re.sub(pattern, replacement, line, flags=re.IGNORECASE)
            
        # Sonra agresif birleştirme
        line = aggressive_merge(line)
        
        # 3. Aşama: Son Düzeltmeler (Yanlış birleşenler için ayırma)
        # "omasaya" -> "o masaya", "veo" -> "ve o" (eğer varsa)
        # Bu metinde "o" zamiri nadir, bağlaç "ve" çok sık. "ve" zaten bitişik.
        
        # Kelime içi düzeltmeler
        line = re.sub(r'\bomasaya\b', 'o masaya', line, flags=re.IGNORECASE)
        line = re.sub(r'\bveo\b', 've o', line, flags=re.IGNORECASE)
        
        cleaned_lines.append(line)

    return "\n".join(cleaned_lines)

with open('full_content.txt', 'r', encoding='utf-8') as f:
    text = f.read()

cleaned_text = clean_text(text)

with open('cleaned_content_v4.txt', 'w', encoding='utf-8') as f:
    f.write(cleaned_text)

print("Cleaning V4 complete. Check cleaned_content_v4.txt")
