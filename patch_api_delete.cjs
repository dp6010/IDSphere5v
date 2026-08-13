const fs = require('fs');
let code = fs.readFileSync('src/server/api.ts', 'utf8');

const newFormEndpoint = `
  app.delete('/api/organizations/:orgId/forms/:formId', authMiddleware, async (req: Request, res: Response) => {
    try {
      const email = (req as any).userEmail;
      const org = await googleService.getOrganizationByAdminEmail(email);
      if (!org || org.organizationId !== req.params.orgId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      await googleService.deleteForm(req.params.orgId, req.params.formId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
`;

code = code.replace("app.patch('/api/organizations/:orgId/forms/:formId', authMiddleware, async (req: Request, res: Response) => {", newFormEndpoint + "\n  app.patch('/api/organizations/:orgId/forms/:formId', authMiddleware, async (req: Request, res: Response) => {");

const newRegEndpoint = `
  app.delete('/api/organizations/:orgId/registrations/:registrationId', authMiddleware, async (req: Request, res: Response) => {
    try {
      const email = (req as any).userEmail;
      const org = await googleService.getOrganizationByAdminEmail(email);
      if (!org || org.organizationId !== req.params.orgId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      await googleService.deleteRegistration(req.params.orgId, req.params.registrationId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
`;

code = code.replace("app.patch('/api/organizations/:orgId/registrations/:registrationId/status', authMiddleware, async (req: Request, res: Response) => {", newRegEndpoint + "\n  app.patch('/api/organizations/:orgId/registrations/:registrationId/status', authMiddleware, async (req: Request, res: Response) => {");

fs.writeFileSync('src/server/api.ts', code);
