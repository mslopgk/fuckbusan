import os
from PIL import Image

# Configuration
INPUT_IMAGE_PATH = 'public/assets/중분류사진.png'
OUTPUT_DIR = 'public/assets/categories/middle'
GRID_ROWS = 5
GRID_COLS = 5
CROP_BOTTOM_PERCENT = 0.25 # Assume text occupies bottom 25%

# 25 Names derived from general_diagnosis.json (Board 5 + Road 3 + Park 5 + Facilities 12)
CATEGORY_NAMES = [
    # Board (5)
    "보행공간",
    "차량진입구역",
    "건물 앞 열린 광장_쉼터(공개공지)", # Sanitized comma
    "자전거도로",
    "시설물구역",
    
    # Road (3)
    "생활도로(국지도로)", # Shortened for filename safety
    "횡단보도",
    "속도저감장치",
    
    # Park (5)
    "진입공간(보행 접근로)",
    "산책로",
    "위생공간(화장실)",
    "편의공간(편의시설_안내시설)",
    "휴게공간",
    
    # Facilities (12)
    "안내시설",
    "가로등(보행등)",
    "신호등",
    "버스승차대",
    "택시승차대",
    "두리발승차대",
    "지하철출입구",
    "휴게(벤치)",
    "휴게(파고라)",
    "휴지통",
    "음수대",
    "기타지원시설"
]

def sanitize_filename(name):
    return "".join([c for c in name if c not in r'\/:*?"<>|']).strip()

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"Created directory: {OUTPUT_DIR}")

    if not os.path.exists(INPUT_IMAGE_PATH):
        print(f"Error: Input file not found at {INPUT_IMAGE_PATH}")
        return

    try:
        img = Image.open(INPUT_IMAGE_PATH)
        width, height = img.size
        
        cell_width = width // GRID_COLS
        cell_height = height // GRID_ROWS
        
        print(f"Image Size: {width}x{height}")
        print(f"Cell Size: {cell_width}x{cell_height}")

        count = 0
        for row in range(GRID_ROWS):
            for col in range(GRID_COLS):
                if count >= len(CATEGORY_NAMES):
                    break
                
                left = col * cell_width
                top = row * cell_height
                right = left + cell_width
                bottom = top + cell_height
                
                # Crop the cell
                cell_img = img.crop((left, top, right, bottom))
                
                # Further crop to remove text (bottom portion)
                # Keep top 1 - CROP_BOTTOM_PERCENT
                crop_height = int(cell_height * (1 - CROP_BOTTOM_PERCENT))
                final_img = cell_img.crop((0, 0, cell_width, crop_height))
                
                name = CATEGORY_NAMES[count]
                safe_name = sanitize_filename(name)
                output_path = os.path.join(OUTPUT_DIR, f"{safe_name}.png")
                
                final_img.save(output_path)
                print(f"Saved: {output_path}")
                
                count += 1
                
        print(f"Successfully processed {count} images.")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
