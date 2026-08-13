const fs = require('fs');
let code = fs.readFileSync('src/server/api.ts', 'utf8');

const target = `      let idEmailSent = alreadySent;
      if (status === 'ACTIVE' && previousStatus !== 'ACTIVE' && !alreadySent) {
         // Send ID email`;

const replacement = `      let idEmailSent = alreadySent;
      const isNowActive = status === 'ACTIVE' || status === 'VERIFIED';
      const wasActive = previousStatus === 'ACTIVE' || previousStatus === 'VERIFIED';

      if (isNowActive && !wasActive && !alreadySent) {
         // Send ID email`;

code = code.replace(target, replacement);

const target2 = 'const emailBody = `Hello,\\n\\nYour IDSphere identity card has been approved and is now available.\\n\\nView My ID Card:\\n${idUrl}\\n\\nThank you.`;';
const replacement2 = 'const emailBody = `Hello,\\n\\nYour IDSphere identity card has been approved and is now available.\\n\\nView My ID Card:\\n${idUrl}\\n\\nThank you,\\nIDSphere`;';

code = code.replace(target2, replacement2);

fs.writeFileSync('src/server/api.ts', code);
