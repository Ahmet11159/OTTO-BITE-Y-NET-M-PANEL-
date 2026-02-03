import os
import re

# Modern color palette
COLORS = {
    # Old -> New mappings
    '1A1A2E': 'F5F7FA',  # Dark navy -> Light gray-blue (background)
    'B84C3C': 'E07A5F',  # Dark red -> Modern coral/terracotta (accent)
    'CCCCCC': '5C6B73',  # Gray -> Modern slate gray (text)
    '666666': '9CA3AF',  # Dark gray -> Medium gray (page numbers)
    '1a1a2e': 'F5F7FA',  # lowercase variants
    'b84c3c': 'E07A5F',
    'cccccc': '5C6B73',
    # Additional dark backgrounds that might be used
    '2D2D44': 'F0F4F8',  # Another dark shade -> light
    '16213E': 'EEF2F6',  # Very dark -> light blue-gray
    '0F3460': 'E8EEF4',  # Navy -> light
    # Gray box backgrounds
    '333333': 'E2E8F0',  # Dark gray box -> light gray box
    '2A2A3D': 'E2E8F0',  # Dark box variant
    '3D3D5C': 'E2E8F0',  # Dark box variant
    '4A4A6A': 'CBD5E1',  # Slightly lighter dark box
    '252538': 'F1F5F9',  # Very dark -> very light
}

# Text colors that should become dark on light background
TEXT_DARK_COLORS = {
    'FFFFFF': '1F2937',  # White text -> Dark gray text
    'ffffff': '1F2937',
    'EEEEEE': '374151',  # Off-white -> gray
    'eeeeee': '374151',
    'E0E0E0': '4B5563',  # Light gray text -> darker gray
    'e0e0e0': '4B5563',
}

def update_colors_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return False
    
    original = content
    
    # Replace background and accent colors
    for old, new in COLORS.items():
        # Match srgbClr val="COLOR"
        content = re.sub(
            f'srgbClr val="{old}"',
            f'srgbClr val="{new}"',
            content,
            flags=re.IGNORECASE
        )
        # Match hex colors in other formats
        pattern = f'val="{old}"'
        replacement = f'val="{new}"'
        content = content.replace(pattern, replacement)
    
    # Replace white text with dark text
    for old, new in TEXT_DARK_COLORS.items():
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

# Process all slide files
slides_dir = '/Users/ahmet11159/.gemini/antigravity/scratch/pptx_work/pptx_extracted/ppt/slides'
updated_count = 0
for filename in os.listdir(slides_dir):
    if filename.endswith('.xml') and not filename.startswith('_'):
        filepath = os.path.join(slides_dir, filename)
        if update_colors_in_file(filepath):
            updated_count += 1
            print(f'Updated: {filename}')

# Also update slide layouts and master
layouts_dir = '/Users/ahmet11159/.gemini/antigravity/scratch/pptx_work/pptx_extracted/ppt/slideLayouts'
for filename in os.listdir(layouts_dir):
    if filename.endswith('.xml') and not filename.startswith('_'):
        filepath = os.path.join(layouts_dir, filename)
        if update_colors_in_file(filepath):
            print(f'Updated layout: {filename}')

masters_dir = '/Users/ahmet11159/.gemini/antigravity/scratch/pptx_work/pptx_extracted/ppt/slideMasters'
for filename in os.listdir(masters_dir):
    if filename.endswith('.xml') and not filename.startswith('_'):
        filepath = os.path.join(masters_dir, filename)
        if update_colors_in_file(filepath):
            print(f'Updated master: {filename}')

print(f'\nTotal slides updated: {updated_count}')
