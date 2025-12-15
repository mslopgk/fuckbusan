import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const filePath = './busan_data/데이터리스트(대시보드, 공공데이터).xlsx';
// const fileBuffer = fs.readFileSync(filePath);
// const workbook = XLSX.read(fileBuffer, { type: 'buffer' }); 
// Simplified read
const workbook = XLSX.readFile(filePath);

const targetSheetName = workbook.SheetNames[0]; // Read first sheet
if (targetSheetName) {
    const sheet = workbook.Sheets[targetSheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log(`\n--- Inspecting contents of sheet: ${targetSheetName} ---`);
    for (let i = 0; i < 20; i++) {
        console.log(`Row ${i}:`, JSON.stringify(data[i]));
    }
} else {
    console.log(`\nSheet "${targetSheetName}" not found! Available: ${workbook.SheetNames}`);
}
