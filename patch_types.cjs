const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');
code = code.replace("idEmailSent?: boolean;", "idEmailSent?: boolean;\n  validFrom?: string | null;\n  validTill?: string | null;");
fs.writeFileSync('src/types/index.ts', code);
