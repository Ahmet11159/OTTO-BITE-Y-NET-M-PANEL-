# encoding: utf-8
"""
Perfect Structure Script - Based on detailed PDF analysis
Pattern identified:
- Lines starting with numbers (1., 2., etc.) = Main section headers
- Lines starting with '-' = COMMENTARY (intro_box) - NOT bullets
- Lines starting with '•' = BULLET points
- Short lines ending with ':' = SUBHEADERS
- Lines in quotes = Speech/example text (special)
- Other text = Body text
"""

import re
import json

def structure_content(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    lines = text.split('\n')
    slides = []
    
    current_slide = None
    header_pattern = re.compile(r'^(\d+)\.\s+(.+)')
    
    # First slide is intro
    intro_slide = {
        "title": "OTTOBITE Garson Rehberi",
        "content": []
    }
    
    i = 0
    # Process intro (lines 1-10)
    while i < len(lines) and not header_pattern.match(lines[i].strip()):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        
        if line == "OTTOBITE":
            i += 1
            continue
        
        if line == "Garson Davranışları ve İş Önceliği Rehberi":
            intro_slide["content"].append({"type": "subheader", "text": line})
        elif line.startswith('-'):
            # Commentary text
            clean = line.lstrip('- ').strip()
            intro_slide["content"].append({"type": "intro_box", "text": clean})
        elif line.startswith('•'):
            clean = line.lstrip('• ').strip()
            intro_slide["content"].append({"type": "bullet", "text": clean})
        elif line.endswith(':'):
            intro_slide["content"].append({"type": "subheader", "text": line})
        else:
            intro_slide["content"].append({"type": "body_text", "text": line})
        
        i += 1
    
    slides.append(intro_slide)
    
    # Process main content
    current_slide = None
    
    while i < len(lines):
        line = lines[i].strip()
        
        if not line:
            i += 1
            continue
        
        # Check for header
        match = header_pattern.match(line)
        if match:
            if current_slide:
                slides.append(current_slide)
            
            current_slide = {
                "title": line,
                "content": []
            }
            i += 1
            continue
        
        if current_slide is None:
            i += 1
            continue
        
        # Classify content
        if line.startswith('-'):
            # Commentary/intro box
            clean = line.lstrip('- ').strip()
            current_slide["content"].append({"type": "intro_box", "text": clean})
        
        elif line.startswith('•'):
            # Bullet point
            clean = line.lstrip('• ').strip()
            current_slide["content"].append({"type": "bullet", "text": clean})
        
        elif line.startswith('"') or line.startswith('"'):
            # Quote/speech - also treat as intro_box
            current_slide["content"].append({"type": "intro_box", "text": line})
        
        elif line.endswith(':') and len(line) < 60:
            # Subheader
            current_slide["content"].append({"type": "subheader", "text": line})
        
        elif "kabul edilemez" in line.lower() and len(line) < 40:
            # Emphasis
            current_slide["content"].append({"type": "emphasis", "text": line})
        
        elif "zorunludur" in line.lower() and len(line) < 40:
            current_slide["content"].append({"type": "emphasis", "text": line})
        
        else:
            # Body text
            current_slide["content"].append({"type": "body_text", "text": line})
        
        i += 1
    
    if current_slide:
        slides.append(current_slide)
    
    return slides

slides = structure_content('perfect_text.txt')

# Output
with open('structured_data_perfect.json', 'w', encoding='utf-8') as f:
    json.dump(slides, f, ensure_ascii=False, indent=2)

print(f"✓ Structured {len(slides)} slides from PDF content")

# Print summary
for s in slides[:5]:
    print(f"  - {s['title']}: {len(s['content'])} items")
