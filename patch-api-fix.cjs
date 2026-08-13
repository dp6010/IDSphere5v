const fs = require('fs');
let code = fs.readFileSync('src/server/api.ts', 'utf8');

// I need to extract the routes and place them correctly. 
// I'll just use a more careful replacement.

const startMarker = "  app.get('/api/organizations/me', authMiddleware, async (req: Request, res: Response) => {";
const endMarker = "      const [header, body, signature] = parts;";

// The original logic of verifyToken was interrupted.
/*
    const verifyToken = (token: string) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return { error: 'PHOTO_UPLOAD_TOKEN_NOT_FOUND' };
      // I inserted right after this!
*/

const badInsertStart = code.indexOf(startMarker);
const badInsertEnd = code.indexOf(endMarker);

// Let's just restore verifyToken and put the missing routes right after verifyToken's closing brace!

const correctVerifyToken = `    const verifyToken = (token: string) => {
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
  };
`;

// Find where verifyToken started
const verifyTokenStart = code.indexOf("const verifyToken = (token: string) => {");
const verifyTokenEndOriginal = code.indexOf("};", code.indexOf("return { error: 'PHOTO_UPLOAD_TOKEN_INVALID' };")) + 2;

// Re-construct the file properly. I'll just replace the whole verifyToken block up to its real end.
// Wait, my bad insertion was INSIDE verifyToken.
// So the file looks like:
// const verifyToken = (token: string) => {
// try { ... }
// app.get(...)
// ...
// app.post(...)
// const [header, body, signature] = parts; ...

// Let's fetch the actual file contents from verifyToken start to verifyToken end to be sure.
