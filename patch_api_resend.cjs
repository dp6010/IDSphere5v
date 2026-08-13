const fs = require('fs');
let code = fs.readFileSync('src/server/api.ts', 'utf8');

const oldBody = "const emailBody = `Hello,\\n\\nYour IDSphere identity card has been approved and is now available.\\n\\nView My ID Card:\\n${idUrl}\\n\\nThank you,\\nIDSphere`;";
const newBody = "let emailBody = `Hello,\\n\\nYour IDSphere identity card has been approved and is now available.\\n\\n`;\n      if (reg.validTill) {\n        emailBody += `Your ID is valid until ${new Date(reg.validTill).toLocaleDateString()}.\\n\\n`;\n      }\n      emailBody += `View My ID Card:\\n${idUrl}\\n\\nThank you,\\nIDSphere`;";

code = code.replace(oldBody, newBody);

const idUrlRegex = /\$\{process.env.APP_URL \|\| req.headers.origin \|\| 'http:\/\/localhost:3000'\}/g;
code = code.replace(idUrlRegex, "${process.env.APP_URL || 'http://localhost:3000'}");

fs.writeFileSync('src/server/api.ts', code);
