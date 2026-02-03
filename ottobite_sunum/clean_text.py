import re

def clean_text(text):
    # 1. Temel satır birleştirme: Satır sonundaki tireleri ve gereksiz yeni satırları kaldır
    # Bu PDF çıktısında satır sonları bazen kelime ortasında olabiliyor, ama buradaki çıktı satır satır görünüyor.
    # Önce genel bir temizlik yapalım.
    
    lines = text.split('\n')
    cleaned_lines = []
    
    for line in lines:
        line = line.strip()
        # Sayfa numaralarını ve ayraçları atla
        if line.startswith('====') or line.startswith('SAYFA') or not line:
            continue
            
        # 2. Harf aralarındaki boşlukları düzeltme (Heuristik yaklaşım)
        # "G ar s on" -> "Garson", "O TT OBITE" -> "OTTOBITE"
        # Tek harf + boşluk + tek harf desenlerini bulup birleştirme
        
        # Çok agresif olmadan, en az 3 ardışık tek harf grubunu hedefleyelim
        # Örnek: "k a l e m" -> "kalem"
        
        # Regex mantığı: (Kelimelerin başı veya boşluktan sonra) (Tek harf + Boşluk) + (Tek harf)
        
        def fix_spaced_words(match):
            # Eşleşen grubu al (örn: "G ar s on")
            content = match.group(0)
            # Boşlukları kaldır
            return content.replace(' ', '')

        # " s a l o n " gibi uzun dizileri yakalamak için
        # (Tek Harf + Boşluk){2,} + Tek Harf
        # Ancak Türkçe karakterleri de kapsamalı.
        
        # Basitçe: Tüm satırı tarayıp, eğer satırda çok fazla tek harf ve boşluk varsa birleştirme denemesi yapabiliriz.
        # Ama daha güvenli bir yöntem:
        # Kelime kelime bakalım.
        
        # Alternatif yaklaşım:
        # Satırdaki kelimelere bakalım. Eğer kelimeler tek harf ise ve ardışık geliyorsa birleştirelim.
        
        words = line.split(' ')
        new_words = []
        buffer = []
        
        for word in words:
            if len(word) == 1 and word.isalpha():
                buffer.append(word)
            else:
                if buffer:
                    # Bufferdaki tek harfleri birleştir
                    joined = "".join(buffer)
                    # Eğer oluşan kelime anlamlı uzunluktaysa (örn > 1) ekle
                    if len(joined) > 1:
                        new_words.append(joined)
                    else:
                        # Tek başına kalmış bir harfse (veya "ve" bağlacı bozulmuşsa)
                        new_words.extend(buffer)
                    buffer = []
                
                # Eğer word boş ise (fazla boşluklardan) atla
                if not word:
                    continue
                    
                # Eğer word, parçalanmış bir kelimenin son parçasıysa? (Örn: "k a l em" -> "em" buraya düşer)
                # Bu çok karmaşık.
                
                new_words.append(word)
        
        if buffer:
             new_words.append("".join(buffer))
             
        # Basit regex replace daha iyi çalışabilir.
        # Örnek desen: r'\b([a-zA-ZçğıöşüÇĞİÖŞÜ])\s+(?=[a-zA-ZçğıöşüÇĞİÖŞÜ]\b)'
        # Bir harf, sonra boşluk, sonra yine bir harf geliyorsa, o boşluğu sil.
        
        # Bu desen: "K al em" -> "K" ile "a" arasını siler -> "Kal em". Sonra tekrar çalıştırırsak "Kalem" olur mu?
        # Python re.sub soldan sağa çalışır. Tek seferde iç içe çözmeyebilir. While döngüsü ile dönmek gerekebilir.
        
        temp_line = line
        prev_line = ""
        while temp_line != prev_line:
            prev_line = temp_line
            # Harf + Boşluk + Harf (kelime sınırları önemli değil ki "G ar" da G bir kelime gibi durabilir başta)
            # Sadece tek harf olanları hedefleyelim.
            # \b harf \s+ harf
            temp_line = re.sub(r'(^|\s)([a-zA-ZçğıöşüÇĞİÖŞÜ])\s+([a-zA-ZçğıöşüÇĞİÖŞÜ])', r'\1\2\3', temp_line)
            
        cleaned_lines.append(temp_line)

    return "\n".join(cleaned_lines)

# Dosyayı oku
with open('full_content.txt', 'r', encoding='utf-8') as f:
    text = f.read()

cleaned_text = clean_text(text)

# Sonuçları yaz
with open('cleaned_content.txt', 'w', encoding='utf-8') as f:
    f.write(cleaned_text)

print("Cleaning complete. Check cleaned_content.txt")
