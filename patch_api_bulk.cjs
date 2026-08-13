const fs = require('fs');
let code = fs.readFileSync('src/server/api.ts', 'utf8');

const statusRegex = /const { status } = req\.body;/;
code = code.replace(statusRegex, 'const { status, validFrom, validTill } = req.body;');

const updateStatusRegex = /await googleService\.updateRegistrationStatus\(orgId, registrationId, status\);/;
code = code.replace(updateStatusRegex, 'await googleService.updateRegistrationStatus(orgId, registrationId, status, validFrom, validTill);');

const emailBodyRegex = /const emailBody = \`Hello,\\n\\nYour IDSphere identity card has been approved and is now available\.\\n\\nView My ID Card:\\n\$\{idUrl\}\\n\\nThank you\.\`;/;
code = code.replace(emailBodyRegex, "let emailBody = `Hello,\\n\\nYour IDSphere identity card has been approved and is now available.\\n\\n`;\n            if (validTill) {\n              emailBody += `Your ID is valid until ${new Date(validTill).toLocaleDateString()}.\\n\\n`;\n            }\n            emailBody += `View My ID Card:\\n${idUrl}\\n\\nThank you.`;");


const bulkFormsEndpoint = `
  app.delete('/api/organizations/:orgId/forms/bulk', authMiddleware, async (req: Request, res: Response) => {
    try {
      const email = (req as any).userEmail;
      const org = await googleService.getOrganizationByAdminEmail(email);
      if (!org || org.organizationId !== req.params.orgId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const { formIds } = req.body;
      if (!Array.isArray(formIds)) return res.status(400).json({ error: 'formIds must be an array' });

      for (const formId of formIds) {
        try {
          await googleService.deleteForm(req.params.orgId, formId);
        } catch (e) {
          console.error(\`Failed to delete form \${formId}: \`, e);
        }
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
`;

code = code.replace("  app.delete('/api/organizations/:orgId/forms/:formId', authMiddleware, async (req: Request, res: Response) => {", bulkFormsEndpoint + "\n  app.delete('/api/organizations/:orgId/forms/:formId', authMiddleware, async (req: Request, res: Response) => {");

const bulkRegsEndpoint = `
  app.delete('/api/organizations/:orgId/registrations/bulk', authMiddleware, async (req: Request, res: Response) => {
    try {
      const email = (req as any).userEmail;
      const org = await googleService.getOrganizationByAdminEmail(email);
      if (!org || org.organizationId !== req.params.orgId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const { registrationIds } = req.body;
      if (!Array.isArray(registrationIds)) return res.status(400).json({ error: 'registrationIds must be an array' });

      for (const regId of registrationIds) {
        try {
          await googleService.deleteRegistration(req.params.orgId, regId);
        } catch (e) {
          console.error(\`Failed to delete registration \${regId}: \`, e);
        }
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
`;

code = code.replace("  app.delete('/api/organizations/:orgId/registrations/:registrationId', authMiddleware, async (req: Request, res: Response) => {", bulkRegsEndpoint + "\n  app.delete('/api/organizations/:orgId/registrations/:registrationId', authMiddleware, async (req: Request, res: Response) => {");

fs.writeFileSync('src/server/api.ts', code);
