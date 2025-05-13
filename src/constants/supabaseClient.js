// supabaseClient.js - Using environment variables (recommended)
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// For React Native, you might use react-native-config or @react-native-async-storage/async-storage
// Make sure to set these in your environment or config
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_FALLBACK_URL';
const supabaseAnonKey = process.env.SUPABASE_KEY || 'YOUR_FALLBACK_KEY';

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for React Native
  },
  global: {
    // Custom headers if needed
    headers: {
      'X-Client-Info': `${Platform.OS}-${Platform.Version}`,
    },
  },
});

export default supabase;