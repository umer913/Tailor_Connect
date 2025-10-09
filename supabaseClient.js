
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbtvxvgmqbypbijybqus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndidHZ4dmdtcWJ5cGJpanlicXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDAzNjcsImV4cCI6MjA3NTUxNjM2N30.d0wr8YLZNp0W-KgX41ceP8c6IF0XOCaaU4fpUdgiQ04';


export const supabase = createClient(supabaseUrl, supabaseKey);

