const fs = require('fs');
let code = fs.readFileSync('src/server/api.ts', 'utf8');

const targetFormAPI = `      await googleService.deleteForm(req.params.orgId, req.params.formId);
      console.log('[Delete Form Diagnostic] Result: success');
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }`;

const replaceFormAPI = `      await googleService.deleteForm(req.params.orgId, req.params.formId);
      console.log('[Delete Form Diagnostic] Result: success');
      res.json({ success: true });
    } catch (e: any) {
      if (e.message.includes('not found in spreadsheet')) {
        return res.status(404).json({ error: 'Form not found.' });
      }
      res.status(500).json({ error: e.message });
    }`;

code = code.replace(targetFormAPI, replaceFormAPI);

const targetRegAPI = `      await googleService.deleteRegistration(req.params.orgId, req.params.registrationId);
      console.log('[Delete Registration Diagnostic] Result: success');
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }`;

const replaceRegAPI = `      await googleService.deleteRegistration(req.params.orgId, req.params.registrationId);
      console.log('[Delete Registration Diagnostic] Result: success');
      res.json({ success: true });
    } catch (e: any) {
      if (e.message.includes('Registration not found')) {
        return res.status(404).json({ error: 'Registration not found.' });
      }
      res.status(500).json({ error: e.message });
    }`;

code = code.replace(targetRegAPI, replaceRegAPI);

fs.writeFileSync('src/server/api.ts', code);
