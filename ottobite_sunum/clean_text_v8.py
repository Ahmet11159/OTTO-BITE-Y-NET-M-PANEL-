# encoding: utf-8
import re

def clean_text(text):
    lines = text.split('\n')
    cleaned_lines = []
    
    # Korumak istediğimiz kelimeler (Birleşmemesi gerekenler)
    # Bunlar tek başına anlamlı kısa kelimelerdir.
    STOP_WORDS = {
        've', 'ile', 'de', 'da', 'ki', 'mi', 'mu', 'mü', 'mı', 'bu', 'şu', 'o', 
        'bi', 'en', 'az', 'ön', 'iç', 'uç', 'el', 'al', 'ol', 'et', 'at', 'ak',
        '1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.', 
        'I', 'A', 'B', 'C', 'D', 'E'
    }

    def ultra_aggressive_merge(line):
        tokens = line.split(' ')
        new_tokens = []
        buffer = ""
        
        for i, token in enumerate(tokens):
            if not token: 
                continue
                
            clean_t = re.sub(r'[.,;:]', '', token)
            
            # 1. Eğer token bir STOP word ise buffer'ı temizle ve token'ı ayrı ekle
            # Ancak "bi" gibi kelimeler hece de olabilir (bi-linç). 
            # Context önemli. Büyük harfle başlıyorsa ayrı kelime olma ihtimali yüksek.
            
            is_stop = clean_t.lower() in STOP_WORDS
            
            if is_stop:
                # Buffer varsa, buffer'ı flushla (belki buffer başka kelimeydi)
                if buffer:
                    new_tokens.append(buffer)
                    buffer = ""
                new_tokens.append(token)
                continue
            
            # 2. Heuristic Merge Logic
            if buffer:
                # Buffer dolu. Birleştirelim mi?
                # "B" (buffer) + "eden" (token) -> "Beden"
                # "T" (buffer) + "u" (token) -> "Tu" (buffer)
                # "S" + "ür" -> "Sür"
                # "k" + "ab" + "ul"
                
                # Kriter:
                # Eğer buffer kısa (<4) ise birleştir.
                # Eğer buffer uzunsa (>4) flushla? Hayır "memnuniy" + "et" olabilir.
                
                # Aslında PDF bozukluğunda harfler neredeyse hep ayrı.
                # Varsayılan davranış: BİRLEŞTİR.
                
                # İstisna: Yeni token BÜYÜK HARFLE başlıyorsa?
                # "ve" + "Garson" -> "ve Garson" (Stop word handled above)
                # "Tutum" + "Misafir" -> "TutumMisafir" (Hata!)
                
                if token[0].isupper():
                    # Yeni kelime büyük harfle başlıyor, buffer'ı kapat, yeniyi de ayrı başlat?
                    # Ama "O" + "TTOBITE" -> "OTTOBITE". "O" büyük, "T" büyük.
                    # "G" + "arson" -> "G" büyük, "a" küçük.
                    
                    if buffer[-1].islower() and token[0].isupper():
                        # "kelime" + "Kelime" -> Ayır.
                        new_tokens.append(buffer)
                        buffer = token
                    else:
                        # "O" + "TTO" -> Birleştir.
                        buffer += token
                else:
                    # Küçük harfle başlıyorsa kesin birleştir (Buffer + token)
                    # "B" + "eden" -> "Beden"
                    buffer += token
            else:
                # Buffer boş.
                # Bu token'ı buffera alalım.
                buffer = token
                
        # Loop sonu
        if buffer:
            new_tokens.append(buffer)
            
        return " ".join(new_tokens)

    replacements = [
        (r'O\s*TT\s*OBITE', 'OTTOBITE'),
        # Specific phrases user noticed
        (r'S\s*ür\s*ek\s*li', 'Sürekli'),
        (r'ş\s*ik\s*â\s*y\s*et', 'şikâyet'),
        (r's\s*on\s*uç', 'sonuç'),
        (r'u\s*y\s*ar\s*ı', 'uyarı'),
        (r'k\s*onu\s*ş\s*ma', 'konuşma'),
        (r'S\s*er\s*vis', 'Servis'),
        (r's\s*er\s*vis', 'servis'),
        (r'T\s*u\s*tum', 'Tutum'),
        (r'B\s*eden', 'Beden'),
        (r'U\s*flamak', 'Uflamak'),
        (r'p\s*uflamak', 'puflamak'),
        (r'm\s*imik\s*leriyle', 'mimikleriyle'),
        (r'i\s*ma', 'ima'),
        (r'y\s*apmak', 'yapmak'),
        (r'k\s*esinlik\s*le', 'kesinlikle'),
        (r'k\s*ab\s*ul', 'kabul'),
        (r'e\s*dileme\s*z', 'edilemez'),
        (r'T\s*ak\s*ım', 'Takım'),
        (r'a\s*rk\s*adaş\s*l\s*arına', 'arkadaşlarına'),
        (r'O\s*per\s*as\s*y\s*ona', 'Operasyona'),
        (r'o\s*lum\s*suz', 'olumsuz'),
        (r'y\s*ansır', 'yansır'),
        (r'y\s*akınmak', 'yakınmak'),
        (r's\s*ır\s*asında', 'sırasında'),
        (r'm\s*ad\s*de\s*ler', 'maddeler'),
    ]

    for line in lines:
        line = line.strip()
        if not line or line.startswith('====') or line.startswith('SAYFA'):
            continue

        # 1. Regex Replacements first (High confidence)
        for pattern, repl in replacements:
            line = re.sub(pattern, repl, line, flags=re.IGNORECASE)
            
        # 2. Ultra Aggressive Merge algorithm on remaining
        line = ultra_aggressive_merge(line)
        
        # 3. Post-merge fixes (Fixing "ve Misafir " -> "veMisafir" mistakes if any happened)
        # "veMisafir" -> "ve Misafir"
        # "ileTutum" -> "ile Tutum"
        
        for stop in STOP_WORDS:
            # Case insensitive check
            # \b(stop)(BüyükHarf) -> \1 \2
            pass 
        
        cleaned_lines.append(line)
        
    return "\n".join(cleaned_lines)

with open('full_content.txt', 'r', encoding='utf-8') as f:
    text = f.read()

cleaned = clean_text(text)

with open('cleaned_content_v8.txt', 'w', encoding='utf-8') as f:
    f.write(cleaned)

print("Cleaning V8 complete.")
