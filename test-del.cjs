const fs = require('fs');
let code = fs.readFileSync('src/server/api.ts', 'utf8');

const targetFormDel = `      await googleService.deleteForm(req.params.orgId, req.params.formId);
      res.json({ success: true });`;
      
const replaceFormDel = `      console.log('[Delete Form Diagnostic] Operation: DeleteForm');
      console.log('[Delete Form Diagnostic] Organization: ' + req.params.orgId);
      console.log('[Delete Form Diagnostic] Form ID: ' + req.params.formId);
      await googleService.deleteForm(req.params.orgId, req.params.formId);
      console.log('[Delete Form Diagnostic] Result: success');
      res.json({ success: true });`;
      
code = code.replace(targetFormDel, replaceFormDel);

const targetRegDel = `      await googleService.deleteRegistration(req.params.orgId, req.params.registrationId);
      res.json({ success: true });`;

const replaceRegDel = `      console.log('[Delete Registration Diagnostic] Operation: DeleteRegistration');
      console.log('[Delete Registration Diagnostic] Organization: ' + req.params.orgId);
      console.log('[Delete Registration Diagnostic] Registration ID: ' + req.params.registrationId);
      await googleService.deleteRegistration(req.params.orgId, req.params.registrationId);
      console.log('[Delete Registration Diagnostic] Result: success');
      res.json({ success: true });`;

code = code.replace(targetRegDel, replaceRegDel);

fs.writeFileSync('src/server/api.ts', code);
