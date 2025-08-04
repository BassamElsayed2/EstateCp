import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jytsaziogmmbytstkyvm.supabase.co";

const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5dHNhemlvZ21tYnl0c3RreXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMjA5MDQsImV4cCI6MjA2OTY5NjkwNH0.gTh00wmIBShp-BxkY8HG-yqY5szqeBmEzGaGYZ8MqaQ";

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
