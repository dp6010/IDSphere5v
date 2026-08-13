const fs = require('fs');
let code = fs.readFileSync('src/server/api.ts', 'utf8');

const badStart = "    const verifyToken = (token: string) => {\n    try {\n      const parts = token.split('.');\n      if (parts.length !== 3) return { error: 'PHOTO_UPLOAD_TOKEN_NOT_FOUND' };\n  app.get('/api/organizations/me'";
const badEnd = "  });\n      const [header, body, signature] = parts;";

const startIdx = code.indexOf(badStart);
const endIdx = code.indexOf(badEnd) + 6;

if (startIdx === -1 || endIdx === -1) {
  console.log("Could not find boundaries!");
  process.exit(1);
}

const theMissingRoutes = code.substring(startIdx + badStart.length - 35, endIdx - 6);

const fixedVerifyToken = `    const verifyToken = (token: string) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return { error: 'PHOTO_UPLOAD_TOKEN_NOT_FOUND' };
      const [header, body, signature] = parts;
      const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(header + '.' + body).digest('base64url');
      if (signature !== expectedSig) return { error: 'PHOTO_UPLOAD_TOKEN_NOT_FOUND' }; // Changing one char usually breaks signature
      const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
      if (payload.exp && Date.now() > payload.exp) return { error: 'PHOTO_UPLOAD_TOKEN_EXPIRED' };
      return { payload };
    } catch(e) {
      return { error: 'PHOTO_UPLOAD_TOKEN_INVALID' };
    }
  };\n` + theMissingRoutes;

// Wait, the block currently ends with:
//   });
//       const [header, body, signature] = parts;
// ...
//     } catch(e) {
//       return { error: 'PHOTO_UPLOAD_TOKEN_INVALID' };
//     }
//   };
const realEndIdx = code.indexOf("  };", endIdx) + 4;

code = code.substring(0, startIdx) + fixedVerifyToken + "\n" + code.substring(realEndIdx);

fs.writeFileSync('src/server/api.ts', code);
console.log("Success");
