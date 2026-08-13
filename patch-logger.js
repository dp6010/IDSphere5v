const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newLogger = `
  app.use((req, res, next) => {
    res.on('finish', () => {
      console.log(\`[API Diagnostic] \${req.method} \${req.originalUrl} - Status: \${res.statusCode} Content-Type: \${res.getHeader('Content-Type')}\`);
    });
    next();
  });
`;

code = code.replace(/app\.use\('\/api', \(req, res, next\) => \{[\s\S]*?next\(\);\s*\}\);/, newLogger);
fs.writeFileSync('server.ts', code);
