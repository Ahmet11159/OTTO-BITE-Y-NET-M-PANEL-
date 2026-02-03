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
        
        if header_pattern.match(line):
            if current_slide:
                slides.append(current_slide)
            current_slide = {
                "title": line,
                "content": []
            }
        else:
            clean_item = line
            item_type = "body_text" # Default
            
            # Logic Update V7:
            # - Starts with '-': INTRO_BOX (Commentary)
            # - Starts with '•': BULLET
            # - Ends with ':': SUBHEADER
            
            if line.startswith('-'):
                # Commentary / Intro
                item_type = "intro_box"
                clean_item = line.lstrip('- ').strip()
                
            elif line.startswith('•'):
                # Bullet
                item_type = "bullet"
                clean_item = line.lstrip('• ').strip()
            
            elif line.endswith(':'):
                item_type = "subheader"
            
            elif "kabul edilemez" in line.lower() or "zorunludur" in line.lower() or "esastır" in line.lower():
                # Strict emphasis for short lines
                if len(line) < 60:
                    item_type = "emphasis"
                else:
                    item_type = "body_text"
            
            elif line.startswith('“') or line.startswith('"'):
                 item_type = "intro_box" # Speech is also commentary-like
            
            elif line == "OTTOBITE":
                continue
            
            else:
                 # Subheader check for non-colon lines?
                 if len(line) < 50 and line[0].isupper() and not line.endswith('.'):
                     item_type = "subheader"
                 else:
                     item_type = "body_text"

            if clean_item:
                current_slide["content"].append({
                    "type": item_type,
                    "text": clean_item
                })

    if current_slide:
        slides.append(current_slide)
        
    return slides

slides = structure_content('perfect_text.txt')

with open('structured_data_final_v7.json', 'w', encoding='utf-8') as f:
    json.dump(slides, f, ensure_ascii=False, indent=2)

print("Structured Final V7 complete.")
