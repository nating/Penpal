import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // 1. Find the user's request
    const { data: userRequests, error } = await supabase
      .from('requests')
      .select('*')
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error reading DB' });
    }

    if (!userRequests || userRequests.length === 0) {
      // No record => nothing to delete
      return res.status(200).json({ success: true });
    }

    const userRequest = userRequests[0];

    // If user has a matched_user_id, we should also mark that user’s record as match_deleted
    if (userRequest.matched_user_id) {
      // Mark partner's record
      await supabase
        .from('requests')
        .update({ match_deleted: true })
        .eq('user_id', userRequest.matched_user_id);
    }

    // Mark the user’s own record as match_deleted as well
    await supabase
      .from('requests')
      .update({ match_deleted: true })
      .eq('id', userRequest.id);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
