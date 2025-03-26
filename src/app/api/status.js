import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query; // from /api/status?userId=xxx
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // 1. Find the user's request
    const { data: requests, error } = await supabase
      .from('requests')
      .select('*')
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error reading DB' });
    }

    if (!requests || requests.length === 0) {
      // No record => user has not requested a penpal
      return res.status(200).json({ status: 'no-request' });
    }

    const request = requests[0];

    // If the user’s match is deleted
    if (request.match_deleted) {
      return res.status(200).json({ status: 'match-deleted' });
    }

    // If the user is matched (matched_user_id is set), check if that partner also marked match as deleted
    if (request.matched_user_id) {
      // Let’s see if the partner's record has match_deleted = true
      const { data: partnerRequests } = await supabase
        .from('requests')
        .select('*')
        .eq('user_id', request.matched_user_id)
        .limit(1);

      if (
        partnerRequests &&
        partnerRequests.length > 0 &&
        partnerRequests[0].match_deleted
      ) {
        // partner has deleted
        return res.status(200).json({ status: 'match-deleted' });
      }

      // otherwise we have a valid match
      return res.status(200).json({
        status: 'matched',
        matchedUserId: request.matched_user_id,
      });
    }

    // If we reach here, user has a request but no match
    return res.status(200).json({ status: 'waiting' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
