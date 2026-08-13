import crypto from 'crypto';
import { Application, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { googleService, getDrive } from './google.js';
import { supabaseService } from './supabase.js';
import { emailService } from './email.js';


const publicFormCache = new Map<string, { data: any, expiresAt: number }>();

export function setupApiRoutes(app: Application, upload: multer.Multer) {
  const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) {
      return res.status(401).json({ error: 'Unauthorized: Missing x-user-email header' });
    }
    (req as any).userEmail = userEmail;
    next();
  };

  
  
  
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-12345';
  
  const generateToken = (payload: any) => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(header + '.' + body).digest('base64url');
    return `${header}.${body}.${signature}`;
  };
  
    const verifyToken = (token: string) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return { error: 'PHOTO_UPLOAD_TOKEN_NOT_FOUND' };
      const [header, body, signature] = parts;
      const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(header + '.' + body).digest('base64url');
      if (signature !== expectedSig) return { error: 'PHOTO_UPLOAD_TOKEN_NOT_FOUND' };
      const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
      if (payload.exp && Date.now() > payload.exp) return { error: 'PHOTO_UPLOAD_TOKEN_EXPIRED' };
      return { payload };
    } catch(e) {
      return { error: 'PHOTO_UPLOAD_TOKEN_INVALID' };
    }
  };
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
            photoUrl = `/api/public/photo/${payload.orgId}/${photoFileId}`;
         }
      }
      
      res.json({
        orgName: org.organizationName,
        formName: form?.name || 'Registration',
        status: reg.status,
        validFrom: reg.validFrom || null,
        validTill: reg.validTill || null,
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
       
       return res.status(404).send('Photo needs to be uploaded again. Legacy format is unsupported.');
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



  app.get('/api/public/organizations/:orgId/forms/:formId/photo-session', async (req: Request, res: Response) => {
    try {
      const forms = await googleService.getForms(req.params.orgId);
      const form = forms.find(f => f.formId === req.params.formId);
      if (!form) return res.status(404).json({ error: 'Form not found' });
      
      const token = generateToken({ 
        orgId: req.params.orgId, 
        formId: req.params.formId, 
        exp: Date.now() + 1000 * 60 * 60 * 24 // 1 day
      });
      res.json({ token });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/organizations/:orgId/registrations/:registrationId/photo-token', authMiddleware, async (req: Request, res: Response) => {
    try {
      const email = (req as any).userEmail;
      const org = await googleService.getOrganizationByAdminEmail(email);
      if (!org || org.organizationId !== req.params.orgId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const regs = await googleService.getRegistrations(req.params.orgId);
      const reg = regs.find(r => r.registrationId === req.params.registrationId);
      if (!reg) return res.status(404).json({ error: 'Registration not found' });
      const token = generateToken({
        orgId: req.params.orgId,
        formId: reg.formId,
        registrationId: req.params.registrationId,
        purpose: 'photo_upload',
        exp: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days
      });
      res.json({ token });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  
  app.get('/api/organizations/:orgId/registrations/:registrationId/identity-token', authMiddleware, async (req: Request, res: Response) => {
    try {
      const email = (req as any).userEmail;
      const org = await googleService.getOrganizationByAdminEmail(email);
      if (!org || org.organizationId !== req.params.orgId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const regs = await googleService.getRegistrations(req.params.orgId);
      const reg = regs.find(r => r.registrationId === req.params.registrationId);
      if (!reg) return res.status(404).json({ error: 'Registration not found' });
      const token = generateToken({
        orgId: req.params.orgId,
        formId: reg.formId,
        registrationId: req.params.registrationId,
        purpose: 'identity_access'
      });
      res.json({ token });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/organizations/:orgId/registrations/:registrationId/resend-photo-email', authMiddleware, async (req: Request, res: Response) => {
    try {
      const email = (req as any).userEmail;
      const org = await googleService.getOrganizationByAdminEmail(email);
      if (!org || org.organizationId !== req.params.orgId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const regs = await googleService.getRegistrations(req.params.orgId);
      const reg = regs.find(r => r.registrationId === req.params.registrationId);
      if (!reg) return res.status(404).json({ error: 'Registration not found' });
      
      const emailKey = Object.keys(reg.submittedData).find(k => k.toLowerCase() === 'email');
      const studentEmail = emailKey ? reg.submittedData[emailKey] : null;

      if (!studentEmail) {
        return res.status(400).json({ error: 'No email found for this student.' });
      }

      const uploadToken = generateToken({
         orgId: req.params.orgId,
         formId: reg.formId,
         registrationId: req.params.registrationId,
         purpose: 'photo_upload'
      });

      const uploadUrl = `${process.env.APP_URL || req.headers.origin || 'http://localhost:3000'}/photo-upload/${uploadToken}`;
      const emailBody = `Hello,\n\nWe noticed you haven't uploaded your photo yet.\n\nPlease upload your passport-size photo using the secure link below:\n\n${uploadUrl}\n\nYour registration will be reviewed after the photo is uploaded.\n\nThank you.`;
      
      // Disabled as requested: no longer sending photo reminders.
      // await emailService.sendEmail(studentEmail, 'Reminder: Complete Your IDSphere Registration', emailBody);
      
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/organizations/:orgId/registrations/:registrationId/resend-id-email', authMiddleware, async (req: Request, res: Response) => {
    try {
      const email = (req as any).userEmail;
      const org = await googleService.getOrganizationByAdminEmail(email);
      if (!org || org.organizationId !== req.params.orgId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const regs = await googleService.getRegistrations(req.params.orgId);
      const reg = regs.find(r => r.registrationId === req.params.registrationId);
      if (!reg) return res.status(404).json({ error: 'Registration not found' });
      
      const emailKey = Object.keys(reg.submittedData).find(k => k.toLowerCase() === 'email');
      const studentEmail = emailKey ? reg.submittedData[emailKey] : null;

      if (!studentEmail) {
        return res.status(400).json({ error: 'No email found for this student.' });
      }

      const idToken = generateToken({
         orgId: req.params.orgId,
         formId: reg.formId,
         registrationId: req.params.registrationId,
         purpose: 'identity_access'
      });

      const idUrl = `${process.env.APP_URL || req.headers.origin || 'http://localhost:3000'}/id/${idToken}`;
      let emailBody = `Hello,\n\nYour IDSphere identity card has been approved and is now available.\n\n`;
      if (reg.validTill) {
        emailBody += `Your ID is valid until ${new Date(reg.validTill).toLocaleDateString()}.\n\n`;
      }
      emailBody += `View My ID Card:\n${idUrl}\n\nThank you,\nIDSphere`;
      
      await emailService.sendEmail(studentEmail, 'Your IDSphere ID Card is Ready', emailBody);
      await googleService.markIdEmailSent(req.params.orgId, req.params.registrationId);
      
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/organizations/:orgId/forms/:formId/public-token', authMiddleware, async (req: Request, res: Response) => {
    try {
      const email = (req as any).userEmail;
      const org = await googleService.getOrganizationByAdminEmail(email);
      if (!org || org.organizationId !== req.params.orgId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const forms = await googleService.getForms(req.params.orgId);
      const form = forms.find(f => f.formId === req.params.formId);
      if (!form) return res.status(404).json({ error: 'Form not found' });
      
      const token = generateToken({
        orgId: req.params.orgId,
        formId: req.params.formId
        // no exp, permanent token
      });
      res.json({ token });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  
  app.get('/api/public/register/:token', async (req: Request, res: Response) => {
    try {
      const token = req.params.token;
      const cached = publicFormCache.get(token);
      if (cached && cached.expiresAt > Date.now()) {
        return res.json(cached.data);
      }

      const verification = verifyToken(token);
      if (verification.error) return res.status(404).json({ error: 'Form Not Found' });
      const payload = verification.payload;
      
      const forms = await googleService.getForms(payload.orgId);
      const form = forms.find(f => f.formId === payload.formId);
      if (!form || form.status !== 'ACTIVE') return res.status(404).json({ error: 'Form Not Found' });
      
      const org = await googleService.getOrganizationById(payload.orgId);
      if (!org) return res.status(404).json({ error: 'Form Not Found' });
      
      const data = { 
        name: form.name, 
        fields: form.fields, 
        organizationName: org.organizationName,
        orgId: payload.orgId,
        formId: payload.formId
      };
      
      publicFormCache.set(token, { data, expiresAt: Date.now() + 60000 }); // 1 min cache
      res.json(data);
    } catch (error: any) {
      if (error.message && (error.message.includes('429') || error.message.includes('quota'))) {
         return res.status(429).json({ error: 'Registration service is temporarily busy. Please try again in a moment.' });
      }
      res.status(500).json({ error: 'Server Error' });
    }
  });

  app.post('/api/public/register/:token', async (req: Request, res: Response) => {
    try {
      const verification = verifyToken(req.params.token);
      if (verification.error) return res.status(404).json({ error: 'Form Not Found' });
      const payload = verification.payload;
      
      let data = req.body;
      if (req.body.data) {
        data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
      }

      const registrationId = await googleService.addRegistration(payload.orgId, payload.formId, data);
      
      const photoUploadToken = generateToken({
        orgId: payload.orgId,
        formId: payload.formId,
        registrationId: registrationId,
        purpose: 'photo_upload'
      });

      // Find student email
      const emailKey = Object.keys(data).find(k => k.toLowerCase() === 'email');
      const studentEmail = emailKey ? data[emailKey] : null;

      let emailSent = false;
      if (studentEmail) {
        const emailBody = `Hello,\n\nYour registration has been received successfully and is currently under review.\n\nThank you.`;
        try {
          await emailService.sendEmail(studentEmail, 'IDSphere Registration Received', emailBody);
          emailSent = true;
        } catch (e) {
          console.error('Failed to send registration email:', e);
        }
      }

      res.json({ success: true, registrationId, photoUploadToken, emailSent });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Failed to submit registration' });
    }
  });

  app.get('/api/organizations/:orgId/forms', authMiddleware, async (req: Request, res: Response) => {
    try {
      const forms = await googleService.getForms(req.params.orgId);
      res.json(forms);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/organizations/:orgId/forms', authMiddleware, async (req: Request, res: Response) => {
    try {
      const org = await googleService.getOrganizationById(req.params.orgId);
      if (!org) return res.status(404).json({ error: 'Org not found' });
      
      const forms = await googleService.getForms(req.params.orgId);
      if (forms.length >= org.maxForms) {
        return res.status(400).json({ error: 'Form limit reached.' });
      }

      const { name, fields } = req.body;
      if (!name) return res.status(400).json({ error: 'Form name is required' });

      const googleToken = req.headers['x-oauth-access-token'] as string;
      console.log(`[OAuth Diagnostic] Google access token present: ${!!googleToken}, Token length: ${googleToken ? googleToken.length : 0}`);

      if (!googleToken) {
        return res.status(401).json({ error: 'Google authorization is required to create a form. Please connect your Google account.' });
      }

      // Check if user is actually admin of THIS org (organization isolation)
      if (org.admin !== (req as any).userEmail) {
        return res.status(403).json({ error: 'You are not authorized to create forms for this organization.' });
      }

      const origin = process.env.APP_URL || req.headers.origin || 'http://localhost:3000';
      const result = await googleService.createForm(req.params.orgId, name, googleToken, origin, fields);
      res.json({ success: true, formId: result.formId, responderUri: result.responderUri });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  

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
          console.error(`Failed to delete form ${formId}: `, e);
        }
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/organizations/:orgId/forms/:formId', authMiddleware, async (req: Request, res: Response) => {
    try {
      const email = (req as any).userEmail;
      const org = await googleService.getOrganizationByAdminEmail(email);
      if (!org || org.organizationId !== req.params.orgId) {
        return res.status(403).json({ error: 'Not authorized to delete this form.' });
      }
      
      console.log('[Delete Form Diagnostic] Operation: DeleteForm');
      console.log('[Delete Form Diagnostic] Organization: ' + req.params.orgId);
      console.log('[Delete Form Diagnostic] Form ID: ' + req.params.formId);
      await googleService.deleteForm(req.params.orgId, req.params.formId);
      console.log('[Delete Form Diagnostic] Result: success');
      res.json({ success: true });
    } catch (e: any) {
      if (e.message.includes('not found in spreadsheet')) {
        return res.status(404).json({ error: 'Form not found.' });
      }
      res.status(500).json({ error: e.message });
    }
  });

  app.patch('/api/organizations/:orgId/forms/:formId', authMiddleware, async (req: Request, res: Response) => {
    try {
      const org = await googleService.getOrganizationById(req.params.orgId);
      if (!org) return res.status(404).json({ error: 'Org not found' });
      if (org.admin !== (req as any).userEmail) {
        return res.status(403).json({ error: 'You are not authorized to edit forms for this organization.' });
      }

      const { name, fields } = req.body;
      if (!name) return res.status(400).json({ error: 'Form name is required' });

      const result = await googleService.updateForm(req.params.orgId, req.params.formId, name, fields);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  
  app.get('/api/organizations/:orgId/registrations', authMiddleware, async (req: Request, res: Response) => {
    try {
      const regs = await googleService.getRegistrations(req.params.orgId);
      res.json(regs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/organizations/:orgId/registrations/sync', authMiddleware, async (req: Request, res: Response) => {
    try {
      const googleToken = req.headers['x-oauth-access-token'] as string;
      const result = await googleService.syncRegistrations(req.params.orgId, googleToken);
      res.json(result);
    } catch (error: any) {
      if (error.message && (error.message.includes('GOOGLE_FORMS_PERMISSION_DENIED') || error.message.includes('GOOGLE_FORMS_RESPONSE_PERMISSION_DENIED'))) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });


  app.get('/api/organizations/:orgId/registrations/:registrationId/photo/:fileId(*)', authMiddleware, async (req: Request, res: Response) => {
    try {
      const email = (req as any).userEmail;
      const fileId = req.params.fileId;
      
      if (fileId.startsWith(process.env.SUPABASE_STORAGE_BUCKET || 'student-photos')) {
         const signedUrl = await supabaseService.getSignedUrl(fileId);
         if (!signedUrl) return res.status(404).json({ error: 'Photo not found' });
         const r = await fetch(signedUrl);
         if (!r.ok) return res.status(404).json({ error: 'Photo not found' });
         res.setHeader('Content-Type', r.headers.get('content-type') || 'image/jpeg');
         res.setHeader('Cache-Control', 'private, max-age=3600');
         const buffer = Buffer.from(await r.arrayBuffer());
         return res.send(buffer);
      }

      return res.status(404).json({ error: 'Photo needs to be uploaded again. Legacy format is unsupported.' });
    } catch (error: any) {
      res.status(error.status || 500).json({ error: error.message });
    }
  });

  

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
          console.error(`Failed to delete registration ${regId}: `, e);
        }
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/organizations/:orgId/registrations/:registrationId', authMiddleware, async (req: Request, res: Response) => {
    try {
      const email = (req as any).userEmail;
      const org = await googleService.getOrganizationByAdminEmail(email);
      if (!org || org.organizationId !== req.params.orgId) {
        return res.status(403).json({ error: 'Not authorized to delete this registration.' });
      }
      
      console.log('[Delete Registration Diagnostic] Operation: DeleteRegistration');
      console.log('[Delete Registration Diagnostic] Organization: ' + req.params.orgId);
      console.log('[Delete Registration Diagnostic] Registration ID: ' + req.params.registrationId);
      await googleService.deleteRegistration(req.params.orgId, req.params.registrationId);
      console.log('[Delete Registration Diagnostic] Result: success');
      res.json({ success: true });
    } catch (e: any) {
      if (e.message.includes('Registration not found')) {
        return res.status(404).json({ error: 'Registration not found.' });
      }
      res.status(500).json({ error: e.message });
    }
  });

  app.patch('/api/organizations/:orgId/registrations/:registrationId/status', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { status, validFrom, validTill } = req.body;
      const orgId = req.params.orgId;
      const registrationId = req.params.registrationId;

      // Check current status to avoid duplicate emails
      const regs = await googleService.getRegistrations(orgId);
      const reg = regs.find((r: any) => r.registrationId === registrationId);
      const previousStatus = reg ? reg.status : null;
      const alreadySent = reg ? reg.idEmailSent : false;

      const result = await googleService.updateRegistrationStatus(orgId, registrationId, status, validFrom, validTill);
      
      let idEmailSent = alreadySent;
      const isNowActive = status === 'ACTIVE' || status === 'VERIFIED';
      const wasActive = previousStatus === 'ACTIVE' || previousStatus === 'VERIFIED';

      if (isNowActive && !wasActive && !alreadySent) {
         // Send ID email
         const idToken = generateToken({
            orgId: orgId,
            registrationId: registrationId,
            purpose: 'identity_access'
         });
         
         const emailKey = Object.keys(reg.submittedData).find(k => k.toLowerCase() === 'email');
         const studentEmail = emailKey ? reg.submittedData[emailKey] : null;

         if (studentEmail) {
            const idUrl = `${process.env.APP_URL || req.headers.origin || 'http://localhost:3000'}/id/${idToken}`;
            let emailBody = `Hello,\n\nYour IDSphere identity card has been approved and is now available.\n\n`;
            if (validTill) {
              emailBody += `Your ID is valid until ${new Date(validTill).toLocaleDateString()}.\n\n`;
            }
            emailBody += `View My ID Card:\n${idUrl}\n\nThank you.`;
            try {
              await emailService.sendEmail(studentEmail, 'Your IDSphere ID Card is Ready', emailBody);
              await googleService.markIdEmailSent(orgId, registrationId);
              idEmailSent = true;
            } catch (e) {
              console.error('Failed to send ID email:', e);
            }
         }
      }

      res.json({ ...result, idEmailSent });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Email Integration Endpoints ---
  app.get('/api/email/status', authMiddleware, async (req: Request, res: Response) => {
    try {
      res.json({ configured: emailService.isConfigured() });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to check email status' });
    }
  });

  app.post('/api/email/test', authMiddleware, async (req: Request, res: Response) => {
    try {
      const email = (req as any).userEmail;
      
      // Ensure user is an admin of some organization or authenticated properly
      if (!email) return res.status(401).json({ error: 'Unauthorized' });

      // We send the test email to the SMTP_USER itself as requested
      const targetEmail = process.env.SMTP_USER;
      
      if (!targetEmail) {
         return res.status(500).json({ error: 'EMAIL_SMTP_NOT_CONFIGURED' });
      }

      const subject = 'IDSphere SMTP Test';
      const body = `Hello,\n\nThis is a test email from IDSphere.\n\nIf you received this message, Gmail SMTP integration is working correctly.\n\nRegards,\nIDSphere`;

      await emailService.sendEmail(targetEmail, subject, body);
      
      res.json({ success: true, message: 'Email sent successfully.' });
    } catch (error: any) {
      const msg = error.message === 'EMAIL_SMTP_NOT_CONFIGURED' ? 'Email service is not configured.' : 'Failed to send email.';
      res.status(500).json({ error: msg });
    }
  });
}

