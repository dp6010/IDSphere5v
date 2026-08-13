const fs = require('fs');
let code = fs.readFileSync('src/server/api.ts', 'utf8');

const oldVerifyRes = `      res.json({
        orgName: org.organizationName,
        formName: form?.name || 'Registration',
        status: reg.status,
        data: cleanData,
        photoUrl
      });`;

const newVerifyRes = `      res.json({
        orgName: org.organizationName,
        formName: form?.name || 'Registration',
        status: reg.status,
        validFrom: reg.validFrom || null,
        validTill: reg.validTill || null,
        data: cleanData,
        photoUrl
      });`;

code = code.replace(oldVerifyRes, newVerifyRes);
fs.writeFileSync('src/server/api.ts', code);
