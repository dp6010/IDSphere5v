const fs = require('fs');
let code = fs.readFileSync('src/server/google.ts', 'utf8');

const targetDriveDel = `      } else {
        try {
          const drive = getDrive();
          await drive.files.delete({ fileId: photoReference });
          console.log('[Delete Registration Diagnostic] Photo Cleanup: success (Drive)');
        } catch (e) {
          console.error('[Delete Registration Diagnostic] Photo Cleanup: failure (Drive):', e);
        }
      }
    }`;

const replaceDriveDel = `      } else {
        try {
          const drive = getDrive();
          await drive.files.delete({ fileId: photoReference });
          console.log('[Delete Registration Diagnostic] Photo Cleanup: success (Drive)');
        } catch (e: any) {
          console.error('[Delete Registration Diagnostic] Photo Cleanup: failure (Drive):', e);
          throw new Error('Registration row deleted, but failed to delete photo from Drive: ' + e.message);
        }
      }
    }`;

code = code.replace(targetDriveDel, replaceDriveDel);

const targetSupaDel = `        try {
          const { supabaseService } = require('./supabase');
          await supabaseService.deleteFile(photoReference);
          console.log('[Delete Registration Diagnostic] Photo Cleanup: success (Supabase)');
        } catch (e) {
          console.error('[Delete Registration Diagnostic] Photo Cleanup: failure (Supabase):', e);
        }
      }`;

const replaceSupaDel = `        try {
          const { supabaseService } = require('./supabase');
          await supabaseService.deleteFile(photoReference);
          console.log('[Delete Registration Diagnostic] Photo Cleanup: success (Supabase)');
        } catch (e: any) {
          console.error('[Delete Registration Diagnostic] Photo Cleanup: failure (Supabase):', e);
          throw new Error('Registration row deleted, but failed to delete photo from Supabase: ' + e.message);
        }
      }`;

code = code.replace(targetSupaDel, replaceSupaDel);

fs.writeFileSync('src/server/google.ts', code);
