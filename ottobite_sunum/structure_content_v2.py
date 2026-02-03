# encoding: utf-8
import re
import json

def polish_text(text):
    # Final cleanup of remaining spaced-out words (Targeting V7 residuals if any)
    # Most work done in clean_text_v7.py but safety net here
    replacements = [
        (r'D\s*u\s*r\s*u\s*ş', 'Duruş'),
        (r'S\s*a\s*l\s*o\s*n', 'Salon'),
        (r'İ\s*ç\s*i\s*n\s*d\s*e\s*k\s*i', 'İçindeki'),
        (r'T\s*a\s*v\s*\ı\s*r', 'Tavır'),
        (r'D\s*av\s*ran\s*ış', 'Davranış'),
        (r'D\s*is\s*ip\s*li\s*ni', 'Disiplini'),
        (r'İ\s*l\s*et\s*iş\s*im', 'İletişim'),
        (r'M\s*a\s*s\s*a\s*y\s*a', 'Masaya'),
        (r'Y\s*a\s*k\s*l\s*aş\s*ma', 'Yaklaşma'),
        (r' \.', '.'),
        (r' ,', ','),
        (r'\bHa\s+zırl\b', 'Hazırlık'),
        (r's\s*al\s*on', 'salon'),
        (r'g\s*or\s*ev', 'görev'),
    ]
    for pattern, replacement in replacements:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text

def structure_content(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    text = polish_text(text)
    
    lines = text.split('\n')
    slides = []
    
    # Starting slide logic
    current_slide = {"title": "OTTOBITE Garson Rehberi", "content": []}
    
    # Header detection
    header_pattern = re.compile(r'^\d+\.?\s+.+')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if header_pattern.match(line):
            if current_slide:
                slides.append(current_slide)
            
            current_slide = {
                "title": line,
                "content": []
            }
        else:
            if line.startswith('•') or line.startswith('-'):
                line = line.lstrip('•- ').strip()
                if line:
                    current_slide["content"].append(line)
            else:
                if "OTTOBITE" in line and len(line) < 20: 
                    continue
                # Skip page markers
                if line.startswith("SAYFA") or line.startswith("===="):
                    continue
                    
                current_slide["content"].append(line)

    if current_slide:
        slides.append(current_slide)
        
    return slides

slides = structure_content('cleaned_content_v7.txt')

with open('structured_data_v2.json', 'w', encoding='utf-8') as f:
    json.dump(slides, f, ensure_ascii=False, indent=2)

print(f"Structured {len(slides)} slides. Check structured_data_v2.json")
