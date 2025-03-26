import { supabase } from '../../../lib/supabaseClient';
import { attemptMatch } from './_lib/match';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, userLanguage, targetLanguage } = req.body;

    // Basic validation
    if (!userId || !userLanguage || !targetLanguage) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // 1. Check if user already has a request
    const { data: existingRequests, error: findError } = await supabase
      .from('requests')
      .select('*')
      .eq('user_id', userId);

    if (findError) {
      console.error(findError);
      return res.status(500).json({ error: 'Error reading from DB' });
    }

    // 2. If no record, insert a new one
    if (!existingRequests || existingRequests.length === 0) {
      const { error: insertError } = await supabase.from('requests').insert([
        {
          user_id: userId,
          user_language: userLanguage,
          target_language: targetLanguage,
        },
      ]);
      if (insertError) {
        console.error(insertError);
        return res.status(500).json({ error: 'Could not create request' });
      }
    } else {
      // 3. If there's an existing record, update it
      //    (e.g., user changes languages or previously had a match)
      const existing = existingRequests[0];
      const { error: updateError } = await supabase
        .from('requests')
        .update({
          user_language: userLanguage,
          target_language: targetLanguage,
          // If user is re-signing up, let's reset these states:
          matched_user_id: null,
          match_deleted: false,
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error(updateError);
        return res.status(500).json({ error: 'Could not update request' });
      }
    }

    // 4. Attempt to match
    await attemptMatch();

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
