const fs = require('fs');
let code = fs.readFileSync('src/server/google.ts', 'utf8');

const oldPush = `      registrations.push({
        registrationId: row[0],
        formId: row[1],
        submittedAt: row[2],
        status: row[3] || 'PENDING',
        submittedData: submittedData,
        photoReference: photoRef,
        idEmailSent: row[5] === 'TRUE'
      });`;

const newPush = `      registrations.push({
        registrationId: row[0],
        formId: row[1],
        submittedAt: row[2],
        status: row[3] || 'PENDING',
        submittedData: submittedData,
        photoReference: photoRef,
        idEmailSent: row[5] === 'TRUE',
        validFrom: row[6] || null,
        validTill: row[7] || null
      });`;
code = code.replace(oldPush, newPush);
fs.writeFileSync('src/server/google.ts', code);
