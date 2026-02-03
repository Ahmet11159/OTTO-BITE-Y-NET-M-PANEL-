import os
import re
import subprocess

# Re-extract original PPTX for fresh start
subprocess.run(['rm', '-rf', '/Users/ahmet11159/.gemini/antigravity/scratch/pptx_work/pptx_extracted'], check=True)
subprocess.run([
    'unzip', '-o', 
    '/Users/ahmet11159/.gemini/antigravity/scratch/pptx_work/OTTOBITE_Garson_Rehberi.pptx',
    '-d', '/Users/ahmet11159/.gemini/antigravity/scratch/pptx_work/pptx_extracted'
], check=True, capture_output=True)

# Complete Modern Light Theme - NO DARK COLORS
# Background: Pure white / very light
# Accent: Soft coral/peach
# Text: Medium gray (readable but not harsh)
# Boxes: Very light gray with subtle borders

ALL_DARK_COLORS = [
    '1A1A2E', '1a1a2e',
    '2D2D44', '2d2d44', 
    '16213E', '16213e',
    '0F3460', '0f3460',
    '333333',
    '2A2A3D', '2a2a3d',
    '3D3D5C', '3d3d5c',
    '4A4A6A', '4a4a6a',
    '252538', '252538',
    '3A3A50', '3a3a50',  # The dark boxes in the screenshot
    '2A2A40', '2a2a40',
    '1F1F35', '1f1f35',
    '353550', '353550',
    '454560', '454560',
    '2E2E45', '2e2e45',
    '4A4A60', '4a4a60',
    '3B3B55', '3b3b55',
    '5A5A70', '5a5a70',
]

def update_slide(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return False
    
    original = content
    
    # 1. Replace ALL dark backgrounds with pure white
    for dark in ALL_DARK_COLORS:
        content = re.sub(
            f'srgbClr val="{dark}"',
            'srgbClr val="FFFFFF"',
            content,
            flags=re.IGNORECASE
        )
    
    # 2. Main background - pure white
    content = re.sub(r'srgbClr val="1A1A2E"', 'srgbClr val="FFFFFF"', content, flags=re.IGNORECASE)
    
    # 3. Accent/Title color - Soft warm coral (modern & friendly)
    content = re.sub(r'srgbClr val="B84C3C"', 'srgbClr val="E85A4F"', content, flags=re.IGNORECASE)
    content = re.sub(r'srgbClr val="FF6B6B"', 'srgbClr val="E85A4F"', content, flags=re.IGNORECASE)
    
    # 4. Text colors - Medium blue-gray (readable, not too dark)
    content = re.sub(r'srgbClr val="CCCCCC"', 'srgbClr val="4A5568"', content, flags=re.IGNORECASE)
    content = re.sub(r'srgbClr val="FFFFFF"', 'srgbClr val="2D3748"', content, flags=re.IGNORECASE)  
    content = re.sub(r'srgbClr val="EEEEEE"', 'srgbClr val="4A5568"', content, flags=re.IGNORECASE)
    content = re.sub(r'srgbClr val="E0E0E0"', 'srgbClr val="718096"', content, flags=re.IGNORECASE)
    
    # 5. Gray boxes - Very light warm gray
    content = re.sub(r'srgbClr val="666666"', 'srgbClr val="A0AEC0"', content, flags=re.IGNORECASE)
    
    # 6. Now fix - change the main page background rectangle from any dark to pure white
    # The first rectangle is usually the background
    # Also change any remaining dark boxes to light gray
    for dark in ALL_DARK_COLORS:
        content = content.replace(f'val="{dark}"', 'val="F7FAFC"')
        content = content.replace(f'val="{dark.upper()}"', 'val="F7FAFC"')
        content = content.replace(f'val="{dark.lower()}"', 'val="F7FAFC"')
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Process all slides
slides_dir = '/Users/ahmet11159/.gemini/antigravity/scratch/pptx_work/pptx_extracted/ppt/slides'
count = 0
for filename in os.listdir(slides_dir):
    if filename.endswith('.xml') and not filename.startswith('_'):
        if update_slide(os.path.join(slides_dir, filename)):
            count += 1

# Update layouts and masters too
for dirname in ['slideLayouts', 'slideMasters']:
    dir_path = f'/Users/ahmet11159/.gemini/antigravity/scratch/pptx_work/pptx_extracted/ppt/{dirname}'
    for filename in os.listdir(dir_path):
        if filename.endswith('.xml') and not filename.startswith('_'):
            update_slide(os.path.join(dir_path, filename))

print(f'Updated {count} slides with pure light theme')

# Create final PPTX
output = '/Users/ahmet11159/.gemini/antigravity/scratch/pptx_work/OTTOBITE_Final_Modern.pptx'
if os.path.exists(output):
    os.remove(output)
os.chdir('/Users/ahmet11159/.gemini/antigravity/scratch/pptx_work/pptx_extracted')
subprocess.run(['zip', '-r', output, '.', '-x', '*.DS_Store'], check=True, capture_output=True)
print(f'Created: {output}')
