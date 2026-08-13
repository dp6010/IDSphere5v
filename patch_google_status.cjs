const fs = require('fs');
let code = fs.readFileSync('src/server/google.ts', 'utf8');
code = code.replace(/Registrations!A:F/g, 'Registrations!A:H');
fs.writeFileSync('src/server/google.ts', code);
