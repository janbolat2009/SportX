import { supabase, isSupabaseConfigured } from '../lib/supabase';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const storageService = {
  /**
   * Upload an avatar image file to the Supabase 'avatars' storage bucket
   */
  async uploadAvatar(userId: string, file: File): Promise<string> {
    if (!file) throw new Error('No file provided');

    // Validation 1: MIME Type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error('Unsupported file format. Please upload PNG, JPEG, WebP, or GIF.');
    }

    // Validation 2: File Size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 5MB limit.');
    }

    if (!isSupabaseConfigured()) {
      // Local demo fallback: create data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Avatar upload failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  },

  getAvatarPublicUrl(filePath: string): string {
    if (!isSupabaseConfigured() || !filePath) return filePath;
    if (filePath.startsWith('http') || filePath.startsWith('data:')) return filePath;
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  },
};
