# encoding: utf-8
import re
import json

def polish_text(text):
    # Final cleanup
    return text

def structure_content(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    text = polish_text(text)
    lines = text.split('\n')
    slides = []
    
    # Starting slide logic
    current_slide = {"title": "OTTOBITE Garson Rehberi", "content": []}
    
    # Header detection (Numbered headers)
    header_pattern = re.compile(r'^\d+\.?\s+.+')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if header_pattern.match(line):
            if current_slide:
                slides.append(current_slide)
            
            # Remove "9. " prefix if needed? No, user wants it.
            current_slide = {
                "title": line,
                "content": []
            }
        else:
            # Content Classification
            # If line starts with "•" or "-" -> Bullet
            # If line ends with ":" or looks like a sentence without bullet -> Text
            
            item_type = "text"
            clean_item = line
            
            if line.startswith('•') or line.startswith('-'):
                item_type = "bullet"
                clean_item = line.lstrip('•- ').strip()
            elif line.endswith(':'):
                item_type = "subheader"
            else:
                # Check formatting from original PDF context?
                # Using heuristics:
                # If short sentence ending in ':', subheader.
                # If bold-looking emphasis phrase like "kesinlikle kabul edilemez.", text (emphasis).
                item_type = "text"
            
            # Skip page markers
            if line.startswith("SAYFA") or line.startswith("===="):
                continue
                
            if "OTTOBITE" in line and len(line) < 30: # branding
                continue
                
            if clean_item:
                current_slide["content"].append({
                    "type": item_type,
                    "text": clean_item
                })

    if current_slide:
        slides.append(current_slide)
        
    return slides

slides = structure_content('cleaned_content_v8.txt')

with open('structured_data_v3.json', 'w', encoding='utf-8') as f:
    json.dump(slides, f, ensure_ascii=False, indent=2)

print(f"Structured {len(slides)} slides. Check structured_data_v3.json")
