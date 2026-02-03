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
            
            # Logic Update:
            # 1. Starts with • or - : BULLET
            # 2. Ends with : : SUBHEADER
            # 3. Quoted speech or sentences : BODY_TEXT (Window candidate)
            # 4. "kabul edilemez" etc : EMPHASIS
            
            if line.startswith('•') or line.startswith('-'):
                item_type = "bullet"
                clean_item = line.lstrip('•- ').strip()
            
            elif line.endswith(':'):
                item_type = "subheader"
            
            elif "kabul edilemez" in line.lower() or "zorunludur" in line.lower() or "esastır" in line.lower():
                # Check formatting length. If it's a long sentence, maybe Body Text with emphasis?
                # Let's keep strict emphasis for short impactful lines.
                if len(line) < 60:
                    item_type = "emphasis"
                else:
                    item_type = "body_text"
            
            elif line.startswith('“') or line.startswith('"'):
                item_type = "quote_box" # New type for speech bubbles
            
            elif line == "OTTOBITE":
                continue
                
            else:
                # Default fallback is body text (Intro sentences)
                # Ensure it's not a title fragment
                if len(line) < 4: continue
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

with open('structured_data_final_v6.json', 'w', encoding='utf-8') as f:
    json.dump(slides, f, ensure_ascii=False, indent=2)

print("Structured Final V6 complete.")
