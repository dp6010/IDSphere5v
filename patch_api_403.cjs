const fs = require('fs');
let code = fs.readFileSync('src/server/api.ts', 'utf8');

const targetFormAPI = `  app.delete('/api/organizations/:orgId/forms/:formId', authMiddleware, async (req: Request, res: Response) => {
    try {
      const email = (req as any).userEmail;
      const org = await googleService.getOrganizationByAdminEmail(email);
      if (!org || org.organizationId !== req.params.orgId) {
        return res.status(403).json({ error: 'Forbidden' });
      }`;

const replaceFormAPI = `  app.delete('/api/organizations/:orgId/forms/:formId', authMiddleware, async (req: Request, res: Response) => {
    try {
      const email = (req as any).userEmail;
      const org = await googleService.getOrganizationByAdminEmail(email);
      if (!org || org.organizationId !== req.params.orgId) {
        return res.status(403).json({ error: 'Not authorized to delete this form.' });
      }`;

code = code.replace(targetFormAPI, replaceFormAPI);

const targetRegAPI = `  app.delete('/api/organizations/:orgId/registrations/:registrationId', authMiddleware, async (req: Request, res: Response) => {
    try {
      const email = (req as any).userEmail;
      const org = await googleService.getOrganizationByAdminEmail(email);
      if (!org || org.organizationId !== req.params.orgId) {
        return res.status(403).json({ error: 'Forbidden' });
      }`;

const replaceRegAPI = `  app.delete('/api/organizations/:orgId/registrations/:registrationId', authMiddleware, async (req: Request, res: Response) => {
    try {
      const email = (req as any).userEmail;
      const org = await googleService.getOrganizationByAdminEmail(email);
      if (!org || org.organizationId !== req.params.orgId) {
        return res.status(403).json({ error: 'Not authorized to delete this registration.' });
      }`;

code = code.replace(targetRegAPI, replaceRegAPI);

fs.writeFileSync('src/server/api.ts', code);
