import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://agiopdmuplnisnaospmr.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnaW9wZG11cGxuaXNuYW9zcG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NTk3ODgsImV4cCI6MjA2MDEzNTc4OH0.Vx8T9FZmtbcn8tCt6RFPifWaEHZsu3H_Nlu5EubVihw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
