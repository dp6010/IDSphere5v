const fs = require('fs');
let code = fs.readFileSync('src/server/api.ts', 'utf8');

const missingRoutes = `
  app.get('/api/organizations/me', authMiddleware, async (req: Request, res: Response) => {
    try {
      const email = (req as any).userEmail;
      const org = await googleService.getOrganizationByAdminEmail(email);
      res.json(org);
    } catch (error: any) {
      if (error.message === 'ORGANIZATION_NOT_FOUND') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.get('/api/organizations/:orgId/registrations/:registrationId/verify-token', authMiddleware, async (req: Request, res: Response) => {
    try {
      const email = (req as any).userEmail;
      const org = await googleService.getOrganizationByAdminEmail(email);
      if (!org || org.organizationId !== req.params.orgId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const token = generateToken({
        orgId: req.params.orgId,
        registrationId: req.params.registrationId,
        purpose: 'verify_id'
      });
      res.json({ token });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/public/verify/:token', async (req: Request, res: Response) => {
    try {
      const verification = verifyToken(req.params.token);
      if (verification.error) return res.status(404).json({ error: 'Student Not Found' });
      const payload = verification.payload;
      
      const org = await googleService.getOrganizationById(payload.orgId);
      if (!org) return res.status(404).json({ error: 'Student Not Found' });
      
      const forms = await googleService.getForms(payload.orgId);
      const form = forms.find(f => f.formId === payload.formId || !payload.formId); // fallback
      
      const regs = await googleService.getRegistrations(payload.orgId);
      const reg = regs.find(r => r.registrationId === payload.registrationId);
      if (!reg) return res.status(404).json({ error: 'Student Not Found' });
      
      let photoUrl = null;
      let photoFileId = null;
      const cleanData: any = {};
      
      Object.entries(reg.submittedData).forEach(([key, val]) => {
         if (key.toLowerCase().includes('photo') && typeof val === 'string' && val.length > 20 && !val.includes(' ')) {
            photoFileId = val;
         } else {
            cleanData[key] = val;
         }
      });
      
      if (photoFileId) {
         if (photoFileId.startsWith(process.env.SUPABASE_STORAGE_BUCKET || 'student-photos')) {
            photoUrl = await supabaseService.getSignedUrl(photoFileId);
         } else {
            photoUrl = \`/api/public/photo/\${payload.orgId}/\${photoFileId}\`;
         }
      }
      
      res.json({
        orgName: org.organizationName,
        formName: form?.name || 'Registration',
        status: reg.status,
        data: cleanData,
        photoUrl
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Server Error' });
    }
  });

  app.get('/api/public/photo/:orgId/:fileId(*)', async (req: Request, res: Response) => {
     try {
       const fileId = req.params.fileId;
       if (fileId.startsWith(process.env.SUPABASE_STORAGE_BUCKET || 'student-photos')) {
         const signedUrl = await supabaseService.getSignedUrl(fileId);
         if (!signedUrl) return res.status(404).send('Not found');
         return res.redirect(signedUrl);
       }

       const org = await googleService.getOrganizationById(req.params.orgId);
       if (!org) return res.status(404).send('Not found');
       const drive = getDrive();
       const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
       res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
       response.data.pipe(res);
     } catch (e) {
       res.status(404).send('Image not found');
     }
  });

  app.post('/api/public/photo-upload/:token', upload.single('photo'), async (req: Request, res: Response) => {
    try {
      const verification = verifyToken(req.params.token);
      if (verification.error) return res.status(403).json({ error: 'PHOTO_UPLOAD_TOKEN_EXPIRED_OR_INVALID' });
      const payload = verification.payload;
      
      if (payload.purpose !== 'photo_upload') {
         return res.status(403).json({ error: 'Invalid token purpose' });
      }

      const file = (req as any).file;
      if (!file) return res.status(400).json({ error: 'No photo provided' });

      // Max size is 5MB
      if (file.size > 5 * 1024 * 1024) return res.status(400).json({ error: 'PHOTO_TOO_LARGE' });

      // Check type
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.mimetype)) {
         return res.status(400).json({ error: 'PHOTO_INVALID_TYPE' });
      }
      
      if (!supabaseService.isConfigured()) {
         return res.status(500).json({ error: 'PHOTO_STORAGE_NOT_CONFIGURED' });
      }

      try {
        const storagePath = await supabaseService.uploadPhoto(payload.orgId, payload.formId, payload.registrationId, file);
        await googleService.updateRegistrationPhoto(payload.orgId, payload.registrationId, storagePath);
        res.json({ success: true, storagePath });
      } catch (e: any) {
        console.error("Supabase / Sheets upload err", e);
        res.status(500).json({ error: e.message || 'PHOTO_UPLOAD_FAILED' });
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Server Error' });
    }
  });
`;

// Insert the missing routes right after the definition of verifyToken
const tokenIdx = code.indexOf('};', code.indexOf('const verifyToken ='));
if (tokenIdx > -1) {
   code = code.substring(0, tokenIdx + 2) + missingRoutes + code.substring(tokenIdx + 2);
}

fs.writeFileSync('src/server/api.ts', code);
