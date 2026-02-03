import os
import re

# Fresh Modern Color Palette - Açık ve canlı renkler
COLORS = {
    # Background colors - Açık ve ferah
    '1A1A2E': 'FAFBFC',  # Çok açık beyazımsı gri
    'F5F7FA': 'FAFBFC',  # Previous update also gets refreshed
    '1a1a2e': 'FAFBFC',
    
    # Accent colors - Canlı ve modern
    'B84C3C': 'FF6B6B',  # Modern koral kırmızı (canlı)
    'E07A5F': 'FF6B6B',  # Previous coral -> vibrant coral
    'b84c3c': 'FF6B6B',
    
    # Text colors - Okunabilir ama koyu değil
    '5C6B73': '4A5568',  # Orta ton gri (koyu değil)
    'CCCCCC': '718096',  # Daha açık gri
    'cccccc': '718096',
    
    # Page numbers
    '666666': 'A0AEC0',  # Açık gri
    '9CA3AF': 'A0AEC0',
    
    # Gray boxes - Çok hafif
    '333333': 'EDF2F7',  # Çok açık gri kutu
    '2A2A3D': 'EDF2F7',
    'E2E8F0': 'EDF2F7',
    '3D3D5C': 'E2E8F0',
    '4A4A6A': 'E2E8F0',
    '252538': 'F7FAFC',
    'CBD5E1': 'E2E8F0',
    'F1F5F9': 'F7FAFC',
}

# White text -> readable dark gray (not too dark)
TEXT_COLORS = {
    'FFFFFF': '2D3748',  # Orta-koyu gri (siyah değil)
    'ffffff': '2D3748',
    '1F2937': '2D3748',  # Previous update
    'EEEEEE': '4A5568',
    'eeeeee': '4A5568',
    '374151': '4A5568',
    'E0E0E0': '718096',
    'e0e0e0': '718096',
    '4B5563': '718096',
}

def update_colors_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return False
    
    original = content
    
    # Replace all colors
    for old, new in {**COLORS, **TEXT_COLORS}.items():
        content = re.sub(
            f'srgbClr val="{old}"',
            f'srgbClr val="{new}"',
            content,
            flags=re.IGNORECASE
        )
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Re-extract original PPTX for fresh start
import subprocess
subprocess.run(['rm', '-rf', '/Users/ahmet11159/.gemini/antigravity/scratch/pptx_work/pptx_extracted'], check=True)
subprocess.run([
    'unzip', '-o', 
    '/Users/ahmet11159/.gemini/antigravity/scratch/pptx_work/OTTOBITE_Garson_Rehberi.pptx',
    '-d', '/Users/ahmet11159/.gemini/antigravity/scratch/pptx_work/pptx_extracted'
], check=True, capture_output=True)

# Process all slide files
slides_dir = '/Users/ahmet11159/.gemini/antigravity/scratch/pptx_work/pptx_extracted/ppt/slides'
updated_count = 0
for filename in os.listdir(slides_dir):
    if filename.endswith('.xml') and not filename.startswith('_'):
        filepath = os.path.join(slides_dir, filename)
        if update_colors_in_file(filepath):
            updated_count += 1

# Also update slide layouts and master
layouts_dir = '/Users/ahmet11159/.gemini/antigravity/scratch/pptx_work/pptx_extracted/ppt/slideLayouts'
for filename in os.listdir(layouts_dir):
    if filename.endswith('.xml') and not filename.startswith('_'):
        filepath = os.path.join(layouts_dir, filename)
        update_colors_in_file(filepath)

masters_dir = '/Users/ahmet11159/.gemini/antigravity/scratch/pptx_work/pptx_extracted/ppt/slideMasters'
for filename in os.listdir(masters_dir):
    if filename.endswith('.xml') and not filename.startswith('_'):
        filepath = os.path.join(masters_dir, filename)
        update_colors_in_file(filepath)

print(f'Total slides updated with new palette: {updated_count}')

# Create new PPTX
import shutil
output_path = '/Users/ahmet11159/.gemini/antigravity/scratch/pptx_work/OTTOBITE_Garson_Rehberi_Fresh.pptx'
if os.path.exists(output_path):
    os.remove(output_path)

os.chdir('/Users/ahmet11159/.gemini/antigravity/scratch/pptx_work/pptx_extracted')
subprocess.run(['zip', '-r', output_path, '.', '-x', '*.DS_Store'], check=True, capture_output=True)
print(f'Created: {output_path}')
