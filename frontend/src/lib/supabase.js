import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "https://dpvmxgoyvctielnsptok.supabase.co";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "sb_publishable_vnGFtyRoS73SbyPo49RRCw_1wrO6xwD";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
