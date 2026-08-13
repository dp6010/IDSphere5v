const fs = require('fs');
let code = fs.readFileSync('src/server/google.ts', 'utf8');

const targetFormLog = `    const rows = response.data.values || [];
    let rowIndex = -1;`;
const replaceFormLog = `    const rows = response.data.values || [];
    console.log('[Delete Form Diagnostic] Number of rows fetched: ' + rows.length);
    let rowIndex = -1;`;
code = code.replace(targetFormLog, replaceFormLog);

const targetRegLog = `    const rows = response.data.values || [];
    let rowIndex = -1;
    let photoReference = null;`;
const replaceRegLog = `    const rows = response.data.values || [];
    console.log('[Delete Registration Diagnostic] Number of rows fetched: ' + rows.length);
    let rowIndex = -1;
    let photoReference = null;`;
code = code.replace(targetRegLog, replaceRegLog);

fs.writeFileSync('src/server/google.ts', code);
