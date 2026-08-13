const fs = require('fs');
let code = fs.readFileSync('src/server/api.ts', 'utf8');

code = code.replace(/\$\{process\.env\.APP_URL \|\| 'http:\/\/localhost:3000'\}/g, "${process.env.APP_URL || req.headers.origin || 'http://localhost:3000'}");

fs.writeFileSync('src/server/api.ts', code);
