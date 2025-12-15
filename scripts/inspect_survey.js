import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excelPath = path.join(__dirname, '../public/assets/categories/설문_초안_싱크앤두랩_1203.xlsx');

try {
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0]; // Assume first sheet
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Array of arrays

    console.log("Sheet Name:", sheetName);
    console.log("Headers (Row 0):", data[0]);
    for (let i = 1; i <= 20; i++) {
        console.log(`Row ${i}:`, data[i]);
    }
} catch (error) {
    console.error("Error reading file:", error);
}
