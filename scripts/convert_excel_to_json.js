import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Citizen (General) Parser
// Sheet: '시민 체크리스트(공유)'
// Structure: Col 0 (Big), Col 1 (Mid), Col 3 (Question)
function parseCitizenChecklist(workbook) {
    // Target specific sheet
    const sheetName = '시민 체크리스트(공유)';
    if (!workbook.Sheets[sheetName]) {
        console.error(`Sheet "${sheetName}" not found in Citizen file! Using first sheet.`);
        return parseChecklistFallback(workbook); // Fallback or empty
    }
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const result = {};
    let lastCol0 = '';
    let lastCol1 = '';

    rawData.forEach((row, index) => {
        if (index < 3) return; // Skip headers

        if (row[0] && typeof row[0] === 'string' && row[0].trim()) lastCol0 = row[0].trim();
        if (row[1] && typeof row[1] === 'string' && row[1].trim()) lastCol1 = row[1].trim();

        const bigCat = lastCol0;
        const midCat = lastCol1;
        const question = row[3]; // Col 3

        if (bigCat && midCat && question) {
            if (!result[bigCat]) result[bigCat] = {};
            if (!result[bigCat][midCat]) result[bigCat][midCat] = [];

            const qText = String(question).trim();
            if (qText && qText !== '질문(TBD)' && !qText.includes('Rating')) {
                result[bigCat][midCat].push(qText);
            }
        }
    });

    return result;
}

// 2. Expert Parser
// Sheet: '전문가 체크리스트(공유)'
// Structure: Col 0 (Big), Col 1 (Mid), Col 3 (Question)
function parseExpertChecklist(workbook) {
    const sheetName = '전문가 체크리스트(공유)';
    let sheet = workbook.Sheets[sheetName];
    if (!sheet) {
        // Fallback
        sheet = workbook.Sheets[workbook.SheetNames[0]];
    }
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const result = {};
    let lastCol0 = '';
    let lastCol1 = '';

    rawData.forEach((row, index) => {
        if (index < 3) return;

        if (row[0] && typeof row[0] === 'string' && row[0].trim()) lastCol0 = row[0].trim();
        if (row[1] && typeof row[1] === 'string' && row[1].trim()) lastCol1 = String(row[1]).trim();

        const bigCat = lastCol0;
        const midCat = lastCol1;
        const question = row[3]; // Col 3

        if (bigCat && midCat && question) {
            if (!result[bigCat]) result[bigCat] = {};
            if (!result[bigCat][midCat]) result[bigCat][midCat] = [];

            const qText = String(question).trim();
            if (qText && qText !== '질문(TBD)' && !qText.includes('Rating')) {
                result[bigCat][midCat].push(qText);
            }
        }
    });

    return result;
}

function parseChecklistFallback(workbook) {
    return parseCitizenChecklist({ ...workbook, Sheets: { '시민 체크리스트(공유)': workbook.Sheets[workbook.SheetNames[0]] } });
}

// 2. Survey Parser
function parseSurvey(workbook) {
    const sheetName = 'Ver1';
    if (!workbook.SheetNames.includes(sheetName)) {
        // Fallback or error
        console.warn(`Sheet "${sheetName}" not found in Survey Excel. Using first sheet.`);
    }
    const sheet = workbook.Sheets[workbook.SheetNames.includes(sheetName) ? sheetName : workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let questions = [];
    let qMap = {};

    rawData.slice(1).forEach((row) => {
        // row[1]: ID (Q1), row[2]: Question, row[3]: Type, row[4]: Options
        if (!row[1] || !row[2]) return;

        const id = String(row[1]).trim();
        const text = String(row[2]).trim();
        const rawType = row[3] ? String(row[3]).trim() : '';
        const rawOptions = row[4] ? String(row[4]).trim() : '';

        let type = 'unknown';
        let options = [];

        if (rawType.includes('5점')) {
            type = 'scale_5';
            options = ['매우 불만족', '불만족', '보통', '만족', '매우 만족'];
        } else if (rawType.includes('복수선택')) {
            type = 'multi_select';
            // Parse options like "🔘Option" or "1 Option / 2 Option"
            if (rawOptions.includes('🔘')) {
                options = rawOptions.split('🔘').map(s => s.trim()).filter(s => s);
            } else if (rawOptions.includes('/')) {
                options = rawOptions.split('/').map(s => s.replace(/^\d+/, '').trim()).filter(s => s);
            }
        } else if (rawType.includes('서술형')) {
            type = 'text';
            // Add placeholder based on ID if hardcoded (legacy) or leave empty
            if (id === 'Q11') type = 'text';
        }

        // Hardcoded Logic for Referencing
        let refersTo = null;
        if (id === 'Q3') refersTo = 'Q2';
        if (id === 'Q8') refersTo = 'Q7';
        // Special case for Q11 text input modification is manual, but basic parsing here.

        const questionObj = {
            id,
            category: row[0],
            text,
            type,
            options,
            subQuestions: [] // For Q1-1 etc
        };

        // Manual Override for Q11 Placeholder if generating from Excel (Optional, user edited JSON manually)
        // We will keep Survey DISABLED as requested, but if we were to enable it we'd add it here.

        if (refersTo) questionObj.refersTo = refersTo;

        // Sub-question Linkage (e.g., Q1-1 -> Q1)
        if (id.includes('-')) {
            const parentId = id.split('-')[0];
            if (qMap[parentId]) {
                qMap[parentId].subQuestions.push(questionObj);
            }
        } else {
            // Prevent duplicates (e.g., Q2 appearing twice)
            if (!qMap[id]) {
                questions.push(questionObj);
                qMap[id] = questionObj;
            }
        }
    });
    return questions;
}

// Paths
const checklistPath = path.join(__dirname, '../public/assets/categories/체크리스트(시민)_251205_싱크앤두랩.xlsx');
const expertChecklistPath = path.join(__dirname, '../public/assets/categories/체크리스트(전문가)_251205_싱크앤두랩.xlsx');
const surveyPath = path.join(__dirname, '../public/assets/categories/설문_초안_싱크앤두랩_1203.xlsx');

function convert() {
    // General - Use Citizen Parser
    if (fs.existsSync(checklistPath)) {
        console.log("Converting General (Citizen)...");
        const wb = XLSX.readFile(checklistPath);
        const json = parseCitizenChecklist(wb);
        fs.writeFileSync(path.join(__dirname, '../public/assets/data/general_diagnosis.json'), JSON.stringify(json, null, 2));
        console.log("General Diagnosis Created.");
    }

    // Expert - Use Expert Parser
    if (fs.existsSync(expertChecklistPath)) {
        console.log("Converting Expert...");
        const wb = XLSX.readFile(expertChecklistPath);
        const json = parseExpertChecklist(wb);
        fs.writeFileSync(path.join(__dirname, '../public/assets/data/expert_diagnosis.json'), JSON.stringify(json, null, 2));
        console.log("Expert Diagnosis Created.");
    }

    // Survey - DISABLED to allow direct JSON editing
    // if (fs.existsSync(surveyPath)) {
    //     const wb = XLSX.readFile(surveyPath);
    //     const json = parseSurvey(wb);
    //     fs.writeFileSync(path.join(__dirname, '../public/assets/data/survey.json'), JSON.stringify(json, null, 2));
    //     console.log("Survey JSON Created.");
    // }
}

convert();
