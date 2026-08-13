import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

let supabaseUrl = process.env.SUPABASE_URL || '';
if (supabaseUrl.endsWith('/')) supabaseUrl = supabaseUrl.slice(0, -1);
if (supabaseUrl.endsWith('/rest/v1')) supabaseUrl = supabaseUrl.slice(0, -8);
if (supabaseUrl.endsWith('/')) supabaseUrl = supabaseUrl.slice(0, -1);

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'student-photos';

// Minimal Supabase client for storage only
let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

export const supabaseService = {
  isConfigured() {
    return !!supabase;
  },

  async uploadPhoto(orgId: string, formId: string, registrationId: string, file: Express.Multer.File): Promise<string> {
    if (!supabase) throw new Error('PHOTO_STORAGE_NOT_CONFIGURED');

    const ext = file.originalname.split('.').pop() || 'jpg';
    const filePath = `${orgId}/${formId}/${registrationId}/photo.${ext}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      throw new Error(`PHOTO_UPLOAD_FAILED: ${error.message || JSON.stringify(error)}`);
    }

    return `${bucketName}/${data.path}`;
  },

  async getSignedUrl(storagePath: string): Promise<string | null> {
    if (!supabase) return null;
    
    // The path format is usually "bucketName/folder/file"
    const parts = storagePath.split('/');
    if (parts.length < 2) return null;
    
    const bucket = parts.shift();
    const filePath = parts.join('/');

    const { data, error } = await supabase.storage
      .from(bucket!)
      .createSignedUrl(filePath, 60 * 60); // 1 hour

    if (error || !data) {
       console.error("Supabase signed url error", error);
       return null;
    }
    return data.signedUrl;
  }
};
