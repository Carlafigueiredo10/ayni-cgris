import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uprcgywrotmabwnyorur.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwcmNneXdyb3RtYWJ3bnlvcnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMDk3NzMsImV4cCI6MjA3OTY4NTc3M30.5gSX2S3N_5X_7r_iCTqKxMOMHGxPj15vyfS1PlrtreY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
