
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const checklistPath = path.join(__dirname, '../public/assets/categories/체크리스트(전문가)_251205_싱크앤두랩.xlsx');

console.log("Reading:", checklistPath);

if (require('fs').existsSync(checklistPath)) {
    const wb = XLSX.readFile(checklistPath);
    const sheetName = '전문가 체크리스트(공유)';
    console.log("Reading Sheet:", sheetName);
    const sheet = wb.Sheets[sheetName];
    // Get raw data with header:1 (array of arrays)
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log("First 5 rows:");
    rawData.slice(0, 5).forEach((row, i) => {
        console.log(`Row ${i}:`, JSON.stringify(row));
    });
} else {
    console.error("File not found!");
}
