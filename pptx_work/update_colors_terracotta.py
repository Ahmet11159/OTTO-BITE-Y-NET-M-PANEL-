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

# Warm Terracotta Theme - Based on uploaded image
# Background: Warm terracotta/copper
# Title: Dark brown
# Subtitle: Light cream/beige

def update_slide(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return False
    
    original = content
    
    # All possible dark background colors -> Terracotta
    dark_bgs = [
        '1A1A2E', '1a1a2e', '2D2D44', '16213E', '0F3460', 
        '333333', '2A2A3D', '3D3D5C', '4A4A6A', '252538',
        '3A3A50', '2A2A40', '1F1F35', '353550', '454560',
        '2E2E45', '4A4A60', '3B3B55', '5A5A70', 'FFFFFF',
        'FAFBFC', 'F7FAFC', 'F5F7FA', 'EDF2F7'
    ]
    
    for dark in dark_bgs:
        # Main background - Warm Terracotta
        content = re.sub(
            f'srgbClr val="{dark}"',
            'srgbClr val="C4785C"',  # Warm terracotta/copper
            content,
            flags=re.IGNORECASE
        )
    
    # Title color (OTTOBITE) - Dark brown/maroon  
    content = re.sub(r'srgbClr val="B84C3C"', 'srgbClr val="4A2C2A"', content, flags=re.IGNORECASE)
    content = re.sub(r'srgbClr val="E85A4F"', 'srgbClr val="4A2C2A"', content, flags=re.IGNORECASE)
    content = re.sub(r'srgbClr val="FF6B6B"', 'srgbClr val="4A2C2A"', content, flags=re.IGNORECASE)
    
    # Subtitle/body text - Light cream/beige
    content = re.sub(r'srgbClr val="CCCCCC"', 'srgbClr val="F5E6D3"', content, flags=re.IGNORECASE)
    content = re.sub(r'srgbClr val="718096"', 'srgbClr val="F5E6D3"', content, flags=re.IGNORECASE)
    content = re.sub(r'srgbClr val="4A5568"', 'srgbClr val="F5E6D3"', content, flags=re.IGNORECASE)
    content = re.sub(r'srgbClr val="2D3748"', 'srgbClr val="F5E6D3"', content, flags=re.IGNORECASE)
    
    # Page numbers - Lighter terracotta
    content = re.sub(r'srgbClr val="666666"', 'srgbClr val="D4A088"', content, flags=re.IGNORECASE)
    content = re.sub(r'srgbClr val="A0AEC0"', 'srgbClr val="D4A088"', content, flags=re.IGNORECASE)
    
    # Info boxes - Slightly darker terracotta
    # Find rounded rectangles with solid fill and update
    content = re.sub(r'srgbClr val="3A3A50"', 'srgbClr val="A86B4F"', content, flags=re.IGNORECASE)
    content = re.sub(r'srgbClr val="F7FAFC"', 'srgbClr val="A86B4F"', content, flags=re.IGNORECASE)
    
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

# Update layouts and masters
for dirname in ['slideLayouts', 'slideMasters']:
    dir_path = f'/Users/ahmet11159/.gemini/antigravity/scratch/pptx_work/pptx_extracted/ppt/{dirname}'
    for filename in os.listdir(dir_path):
        if filename.endswith('.xml') and not filename.startswith('_'):
            update_slide(os.path.join(dir_path, filename))

print(f'Updated {count} slides with Terracotta theme')

# Create final PPTX
output = '/Users/ahmet11159/.gemini/antigravity/scratch/pptx_work/OTTOBITE_Terracotta.pptx'
if os.path.exists(output):
    os.remove(output)
os.chdir('/Users/ahmet11159/.gemini/antigravity/scratch/pptx_work/pptx_extracted')
subprocess.run(['zip', '-r', output, '.', '-x', '*.DS_Store'], check=True, capture_output=True)
print(f'Created: {output}')
