const fs = require('fs');
let code = fs.readFileSync('src/server/api.ts', 'utf8');

const s1 = code.indexOf("const verifyToken = (token: string) => {");
const e1 = code.indexOf("};", code.indexOf("return { error: 'PHOTO_UPLOAD_TOKEN_INVALID' };")) + 2;

const badBlock = code.substring(s1, e1);
// badBlock contains:
// const verifyToken ... 
// if (parts.length !== 3) return ...
// app.get('/api/organizations/me'
// ... all the routes ...
// const [header, body, signature] = parts;
// ...
// return { error: 'PHOTO_UPLOAD_TOKEN_INVALID' };
// };

// We want to extract the routes.
const routesStart = badBlock.indexOf("  app.get('/api/organizations/me'");
const routesEnd = badBlock.indexOf("      const [header, body, signature] = parts;");

const routes = badBlock.substring(routesStart, routesEnd);

const fixedVerifyToken = `  const verifyToken = (token: string) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return { error: 'PHOTO_UPLOAD_TOKEN_NOT_FOUND' };
      const [header, body, signature] = parts;
      const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(header + '.' + body).digest('base64url');
      if (signature !== expectedSig) return { error: 'PHOTO_UPLOAD_TOKEN_NOT_FOUND' };
      const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
      if (payload.exp && Date.now() > payload.exp) return { error: 'PHOTO_UPLOAD_TOKEN_EXPIRED' };
      return { payload };
    } catch(e) {
      return { error: 'PHOTO_UPLOAD_TOKEN_INVALID' };
    }
  };\n`;

code = code.substring(0, s1) + fixedVerifyToken + routes + code.substring(e1);
fs.writeFileSync('src/server/api.ts', code);
console.log("Fixed!");
