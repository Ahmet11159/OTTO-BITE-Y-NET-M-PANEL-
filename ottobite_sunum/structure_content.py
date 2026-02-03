# encoding: utf-8
import re
import json

def polish_text(text):
    # Final cleanup of remaining spaced-out words
    replacements = [
        (r'y\s*aln\s*ız\s*c\s*a', 'yalnızca'),
        (r'g\s*ör\s*e\s*v', 'görev'),
        (r'u\s*y\s*g\s*ul\s*anmak', 'uygulanmak'),
        (r'h\s*a\s*zırl\s*anmış', 'hazırlanmış'),
        (r'ok\s*unmak', 'okunmak'),
        (r't\s*em\s*pos\s*unu', 'temposunu'),
        (r'r\s*uh', 'ruh'),
        (r'y\s*ön\s*etir', 'yönetir'),
        (r'd\s*ur\s*uş\s*undan', 'duruşundan'),
        (r'd\s*eğ\s*erlendirir', 'değerlendirir'),
        (r'ö\s*nündedir', 'önündedir'),
        (r'u\s*nutulmamalıdır', 'unutulmamalıdır'),
        (r'k\s*alit\s*esini', 'kalitesini'),
        (r'y\s*er', 'yer'),
        (r'a\s*l\s*an', 'alan'),
        (r'a\s*çık', 'açık'),
        (r'h\s*azır', 'hazır'),
        (r'd\s*ur\s*ur', 'durur'),
        (r'g\s*e\s*zilme\s*z', 'gezilmez'),
        (r'd\s*ur\s*ulma\s*z', 'durulmaz'),
        (r'y\s*as\s*l\s*anılma\s*z', 'yaslanılmaz'),
        (r'b\s*ek\s*lenme\s*z', 'beklenmez'),
        (r'h\s*ar\s*ek\s*et', 'hareket'),
        (r'k\s*ur\s*ulur', 'kurulur'),
        (r'k\s*onuş\s*ulma\s*z', 'konuşulmaz'),
        (r'il\s*gileniy\s*or\s*um', 'ilgileniyorum'),
        (r'o\s*luy\s*or\s*um', 'oluyorum'),
        (r'k\s*ontr\s*ol', 'kontrol'),
        (r'y\s*ük\s*s\s*ek', 'yüksek'),
        (r's\s*e\s*viy\s*ede', 'seviyede'),
        (r'k\s*esinlik\s*le', 'kesinlikle'),
        (r'g\s*üv\s*enliği', 'güvenliği'),
        (r'k\s*oor\s*din\s*as\s*y\s*on', 'koordinasyon'),
        (r'h\s*izmet', 'hizmet'),
        (r's\s*ür\s*ek\s*l\s*iliği', 'sürekliliği'),
        (r'd\s*eng\s*e', 'denge'),
        (r'y\s*ük\s*s\s*ek\s*lik\s*t\s*e', 'yükseklikte'),
        (r'g\s*ecik\s*me\s*si', 'gecikmesi'),
        (r'k\s*al\s*dırm\s*ay\s*a', 'kaldırmaya'),
        (r'm\s*ecbur', 'mecbur'),
        (r'ç\s*at\s*al', 'çatal'),
        (r'b\s*ıç\s*ak', 'bıçak'),
        (r'e\s*k\s*ip\s*man', 'ekipman'),
        (r'p\s*l\s*anl\s*anır', 'planlanır'),
        (r'p\s*rof\s*es\s*y\s*on\s*el', 'profesyonel'),
        (r'u\s*nutu\s*l\s*m\s*a\s*s\s*ı\s*n\s*a', 'unutulmasına'),
        (r'g\s*er\s*ek\s*siz', 'gereksiz'),
        (r'm\s*üş\s*t\s*eri', 'müşteri'),
        (r't\s*ak\s*ım', 'takım'),
        (r'ç\s*al\s*ış\s*m\s*ak', 'çalışmak'),
        (r'k\s*us\s*ur\s*s\s*uz', 'kusursuz'),
        (r'n\s*ez\s*ak\s*et\s*le', 'nezaketle'),
        (r'b\s*aş\s*arı', 'başarı'),
        (r'a\s*nl\s*am\s*al\s*ar', 'anlamalar'),
        # Add basic grammar fixes
        (r' \.', '.'),
        (r' ,', ','),
    ]
    for pattern, replacement in replacements:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text

def structure_content(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Polish text one last time
    text = polish_text(text)
    
    lines = text.split('\n')
    slides = []
    current_slide = {"title": "OTTOBITE Garson Rehberi", "content": []} # Default start
    
    # Regex for numbered headers like "1. Garsonluk Bilinci" or "32. Gereksiz Yorum"
    header_pattern = re.compile(r'^\d+\.?\s+.+')
    
    # Regex to detect sub-headers or slide breaks if not numbered
    # Looking at the text, sections start with "1.", "2." etc.
    # But there are also "Amac" and "Giriş".
    
    # Special Handling for Introduction
    # First few lines until "1." are Intro.
    
    intro_lines = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check if line is a numbered header
        if header_pattern.match(line):
            # Save previous slide
            if current_slide:
                slides.append(current_slide)
            
            # Start new slide
            current_slide = {
                "title": line,
                "content": []
            }
        else:
            # Add content to current slide
            # Clean bullets
            if line.startswith('•') or line.startswith('-'):
                line = line.lstrip('•- ').strip()
                if line:
                    current_slide["content"].append(line)
            else:
                # If it's just text, add it (maybe append to previous bullet if it looks like continuation?)
                # For PPTX, separate lines are usually separate bullets.
                # Avoid adding "SAYFA" or "====" lines (cleaned previously but good to check)
                if "OTTOBITE" in line and len(line) < 20: # Skip branding header repeat
                    continue
                current_slide["content"].append(line)

    # Append last slide
    if current_slide:
        slides.append(current_slide)
        
    return slides

slides = structure_content('cleaned_content_v6.txt')

with open('structured_data.json', 'w', encoding='utf-8') as f:
    json.dump(slides, f, ensure_ascii=False, indent=2)

print(f"Structured {len(slides)} slides. Check structured_data.json")
