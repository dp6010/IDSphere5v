const fs = require('fs');
let code1 = fs.readFileSync('src/pages/Forms.tsx', 'utf8');
code1 = code1.replace(/import\.meta\.env\.VITE_APP_URL/g, "(import.meta as any).env.VITE_APP_URL");
fs.writeFileSync('src/pages/Forms.tsx', code1);

let code2 = fs.readFileSync('src/pages/Registrations.tsx', 'utf8');
code2 = code2.replace(/import\.meta\.env\.VITE_APP_URL/g, "(import.meta as any).env.VITE_APP_URL");
fs.writeFileSync('src/pages/Registrations.tsx', code2);
