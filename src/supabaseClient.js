import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tikpnpkjqysudiunszip.supabase.co'
const supabaseAnonKey = 'sb_publishable_0_9lcTl1xiEzlAE28A99HA_FylKl4R8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
