import { createClient } from '@supabase/supabase-js';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateTwitter() {
  const { data, error } = await supabase
    .from('profile')
    .update({ 
      socials: { 
        twitter: 'https://twitter.com/nombrebinaire' 
      } 
    })
    .eq('id', 1)
    .select();

  if (error) {
    console.error('Error updating profile:', error);
  } else {
    console.log('Profile updated successfully:', data);
  }
}

updateTwitter();
