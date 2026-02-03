# encoding: utf-8
import re
import json

def structure_content(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    lines = text.split('\n')
    slides = []
    
    current_slide = {"title": "OTTOBITE Garson Rehberi", "content": []}
    header_pattern = re.compile(r'^\d+\.?\s+.+')
    
    for line in lines:
        line = line.strip()
        if not line: continue
        
        # Sayfa numaralarını atla
        if line.startswith("SAYFA") or line.startswith("===="):
            continue
            
        if header_pattern.match(line):
            if current_slide:
                slides.append(current_slide)
            current_slide = {
                "title": line,
                "content": []
            }
        else:
            item_type = "text"
            clean_item = line
            
            if line.startswith('•') or line.startswith('-'):
                item_type = "bullet"
                clean_item = line.lstrip('•- ').strip()
            elif line.endswith(':'):
                item_type = "subheader"
            # Özel başlık tespiti (Kalın olması gerekenler)
            elif "kesinlikle kabul edilemez" in line.lower():
                item_type = "emphasis"
            elif line == "Mutfak ve Bar": # Başlık gibi duranlar
                 item_type = "subheader"
                 
            if "OTTOBITE" in line and len(line) < 30: continue
            
            if clean_item:
                current_slide["content"].append({
                    "type": item_type,
                    "text": clean_item
                })
    
    if current_slide:
        slides.append(current_slide)
        
    return slides

slides = structure_content('cleaned_content_v9.txt')
with open('structured_data_v4.json', 'w', encoding='utf-8') as f:
    json.dump(slides, f, ensure_ascii=False, indent=2)

print("Structured V4 complete.")
