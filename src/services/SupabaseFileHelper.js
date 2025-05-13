// SupabaseFileHelper.js - Helper functions for handling file uploads and URLs

import { supabase } from '../constants/supabaseClient'; // Adjust path to your supabase client

export class SupabaseFileHelper {
  // Generate a public URL for a file in Supabase storage
  static getPublicUrl(bucketName, filePath) {
    try {
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting public URL:', error);
      return null;
    }
  }

  // Create a signed URL for a file (useful for private files)
  static async getSignedUrl(bucketName, filePath, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
  }

  // Upload a file to Supabase storage
  static async uploadFile(bucketName, filePath, fileUri, contentType = 'application/octet-stream') {
    try {
      // Create form data for upload
      const formData = new FormData();
      
      // For React Native file uploads
      formData.append('file', {
        uri: fileUri,
        type: contentType,
        name: filePath.split('/').pop(),
      });

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, formData, {
          cacheControl: '3600',
          upsert: false,
          contentType: contentType,
        });

      if (error) {
        console.error('Upload error:', error);
        return { success: false, error };
      }

      console.log('Upload successful:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Upload exception:', error);
      return { success: false, error };
    }
  }

  // Delete a file from Supabase storage
  static async deleteFile(bucketName, filePath) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Delete exception:', error);
      return { success: false, error };
    }
  }

  // Check if a file exists in Supabase storage
  static async fileExists(bucketName, filePath) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(filePath.split('/').slice(0, -1).join('/'), {
          limit: 1,
          search: filePath.split('/').pop(),
        });

      return !error && data && data.length > 0;
    } catch (error) {
      console.error('File exists check error:', error);
      return false;
    }
  }

  // Get file info including size and metadata
  static async getFileInfo(bucketName, filePath) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(filePath.split('/').slice(0, -1).join('/'), {
          limit: 1,
          search: filePath.split('/').pop(),
        });

      if (error || !data || data.length === 0) {
        return null;
      }

      return data[0];
    } catch (error) {
      console.error('Get file info error:', error);
      return null;
    }
  }
}

// Usage examples:
// const publicUrl = SupabaseFileHelper.getPublicUrl('documents', 'path/to/file.pdf');
// const signedUrl = await SupabaseFileHelper.getSignedUrl('documents', 'path/to/file.pdf', 3600);
// const uploadResult = await SupabaseFileHelper.uploadFile('documents', 'uploads/file.pdf', fileUri, 'application/pdf');