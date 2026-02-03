# encoding: utf-8
import re
import json

def structure_content(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    lines = text.split('\n')
    slides = []
    
    current_slide = {"title": "OTTOBITE Garson Rehberi", "content": []}
    
    # Header logic: 
    # 1. Numbered lines "1. ...", "35. ..."
    # 2. Known subheaders in the manual text flow?
    # Actually, the manual text is clean.
    # Lines ending with ":" are usually subheaders or context.
    # Items with "•" are bullets.
    
    header_pattern = re.compile(r'^\d+\.?\s+.+')
    
    for line in lines:
        line = line.strip()
        if not line: continue
        
        # Start new slide upon numbered header
        if header_pattern.match(line):
            if current_slide:
                slides.append(current_slide)
            
            # Remove repeated number if present in text? No, use as is.
            current_slide = {
                "title": line,
                "content": []
            }
        else:
            # Classification
            item_type = "text"
            clean_item = line
            
            if line.startswith('•') or line.startswith('-'):
                # Bullet
                item_type = "bullet"
                clean_item = line.lstrip('•- ').strip()
            # Special case for "kesinlikle kabul edilemez" emphasis lines
            elif "kabul edilemez" in line.lower() or "zorunludur" in line.lower():
                if len(line) < 50: # Short emphasis lines
                    item_type = "emphasis"
            # Subheaders ending with ":" or Title Case short lines
            elif line.endswith(':'):
                item_type = "subheader"
            # Subheaders that don't end in colon but act like it (e.g. "Duruş ve Salon İçindeki Tavır")
            elif len(line) < 50 and not line.endswith('.') and line[0].isupper():
                # Check if it's just a sentence fragment or a real subheader
                # Manual check: "Duruş ve ..." is subheader.
                # "Garson salondayken:" is subheader.
                item_type = "subheader"

            if "OTTOBITE" == line: continue # Intro title repeated?
            
            if clean_item:
                current_slide["content"].append({
                    "type": item_type,
                    "text": clean_item
                })

    if current_slide:
        slides.append(current_slide)
        
    return slides

slides = structure_content('perfect_text.txt')

with open('structured_data_final.json', 'w', encoding='utf-8') as f:
    json.dump(slides, f, ensure_ascii=False, indent=2)

print("Structured Final complete.")
