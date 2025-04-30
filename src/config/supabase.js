import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvrczydbpwudetstwvor.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2cmN6eWRicHd1ZGV0c3R3dm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMDE3MTAsImV4cCI6MjA2MTU3NzcxMH0.fcMpeQUh-BTmgykkGaYR8tHK0z7IdaCvd9Egmy6lBCI';

export const supabase = createClient(supabaseUrl, supabaseKey);