# encoding: utf-8
import re

def clean_text(text):
    lines = text.split('\n')
    cleaned_lines = []
    
    replacements = [
        (r'O\s*TT\s*OBITE', 'OTTOBITE'),
        (r'OTT\s*OBITE', 'OTTOBITE'),
        # ... (Diğer kritik replacementlar)
        (r'ser\s*vis', 'servis'),
        (r'gör\s*ev', 'görev'),
        (r'mis\s*afir', 'misafir'),
        (r'dok\s*üman', 'doküman'),
    ]
    
    # Kelime olarak korunması gerekenler (Birleştirilmemeli)
    STOP_WORDS = {'ve', 'ile', 'o', 'bu', 'şu', 'bir', 'iki', 'üç', 'A', 'B', 'C', 'D', 'E', 'a', 'b', 'c', 'd', 'e', 'I', 'i'}

    def safe_merge_line(line):
        # Kelimeleri ayır
        # Ancak punctuation (.,;:) ayırmamalıyız tam olarak, kelimelere yapışık olabilir.
        # Basitçe boşluktan split edelim.
        tokens = line.split(' ')
        
        # Merge pass
        # tokens listesi üzerinde dön.
        # i ve i+1 nci elemanlara bak.
        # Eğer birleştirilebilirlerse birleştir, i yerinde kalsın, i+1'i sil, tekrar kontrol et.
        
        i = 0
        while i < len(tokens) - 1:
            curr = tokens[i]
            next_t = tokens[i+1]
            
            # Temizlik (noktalama işaretlerini yoksayarak kontrol et)
            curr_clean = re.sub(r'[^\w]', '', curr)
            next_clean = re.sub(r'[^\w]', '', next_t)
            
            # Birleştirme Kriterleri:
            # 1. Her ikisi de kelime karakteri içermeli (sadece nokta ise birleşmez)
            if not curr_clean or not next_clean:
                i += 1
                continue
                
            # 2. Biri veya ikisi birden "Tek Harf" (veya çok kısa 1-2 harf) olmalı.
            is_curr_short = len(curr_clean) <= 1
            is_next_short = len(next_clean) <= 1
            
            if is_curr_short or is_next_short:
                # 3. Stop Word kontrolü
                if curr_clean in STOP_WORDS or next_clean in STOP_WORDS:
                    # Birleştirme (örn "ve o")
                    i += 1
                    continue
                
                # Birleştir!
                tokens[i] = curr + next_t # Boşluksuz birleştir
                del tokens[i+1]
                # i artmaz, yeni oluşan token ile bir sonrakini dene (örn "G" + "a" -> "Ga", sonra "Ga" + "r")
            else:
                i += 1
                
        return " ".join(tokens)

    for line in lines:
        line = line.strip()
        if not line or line.startswith('====') or line.startswith('SAYFA'):
            continue
            
        # Replacement listesi (Hala gerekli, çünkü 'ser vis' gibiler 3+3 harf olabilir)
        for pattern, replacement in replacements:
            line = re.sub(pattern, replacement, line, flags=re.IGNORECASE)
            
        line = safe_merge_line(line)
        cleaned_lines.append(line)

    return "\n".join(cleaned_lines)

with open('full_content.txt', 'r', encoding='utf-8') as f:
    text = f.read()

cleaned_text = clean_text(text)

with open('cleaned_content_v5.txt', 'w', encoding='utf-8') as f:
    f.write(cleaned_text)

print("Cleaning V5 complete. Check cleaned_content_v5.txt")
