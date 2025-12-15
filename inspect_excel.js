import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = 'public/assets/categories/체크리스트(시민, 전문가)_251205_싱크앤두랩_수정.xlsx';
const fileBuffer = fs.readFileSync(filePath);
const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

const targetSheetName = "시민 체크리스트(공유)";
if (workbook.SheetNames.includes(targetSheetName)) {
    const sheet = workbook.Sheets[targetSheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log(`\n--- Inspecting contents of sheet: ${targetSheetName} ---`);
    for (let i = 0; i < 20; i++) {
        console.log(`Row ${i}:`, JSON.stringify(data[i]));
    }
} else {
    console.log(`\nSheet "${targetSheetName}" not found! Available: ${workbook.SheetNames}`);
}
