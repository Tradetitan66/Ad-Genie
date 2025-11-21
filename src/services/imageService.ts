import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface RemoveBackgroundResponse {
  success: boolean;
  imageBase64: string;
  error?: string;
}

export const imageService = {
  async removeBackground(imageBase64: string): Promise<string> {
    const apiUrl = `${SUPABASE_URL}/functions/v1/remove-background`;

    const headers = {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ imageBase64 }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to remove background');
    }

    const data: RemoveBackgroundResponse = await response.json();

    if (!data.success || !data.imageBase64) {
      throw new Error(data.error || 'Failed to remove background');
    }

    return data.imageBase64;
  },

  async uploadToStorage(
    userId: string,
    file: File,
    type: 'logo' | 'product',
    removeBackground = false
  ): Promise<string> {
    let fileToUpload = file;
    let fileName = `${type}-${Date.now()}-${file.name}`;

    if (removeBackground) {
      const base64 = await this.fileToBase64(file);
      const processedBase64 = await this.removeBackground(base64);

      const blob = await this.base64ToBlob(processedBase64);
      fileToUpload = new File([blob], fileName, { type: 'image/png' });
    }

    const filePath = `${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('brand-assets')
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('brand-assets')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  },

  async deleteFromStorage(url: string): Promise<void> {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.indexOf('brand-assets');

    if (bucketIndex === -1) {
      throw new Error('Invalid storage URL');
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from('brand-assets')
      .remove([filePath]);

    if (error) {
      throw error;
    }
  },

  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  },

  async base64ToBlob(base64: string): Promise<Blob> {
    const response = await fetch(base64);
    return response.blob();
  },
};
