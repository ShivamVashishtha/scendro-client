import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cysxroarrrmxormensil.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5c3hyb2FycnJteG9ybWVuc2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTg2NDEyOCwiZXhwIjoyMDYxNDQwMTI4fQ.REH2lnXzgrSE5bfix4c1yyzZDmNhd81Qwh6UazdEnH4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
