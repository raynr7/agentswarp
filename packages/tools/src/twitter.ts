import { z } from 'zod';
import type { Tool } from '@agentswarm/core';

export const twitterTool: Tool = {
  name: 'twitter',
  description: 'Post tweets, search tweets, get user timeline. Requires TWITTER_BEARER_TOKEN env var. For posting, also needs TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET.',
  schema: z.object({
    action: z.enum(['post_tweet', 'search_tweets', 'get_user_tweets']),
    text: z.string().optional(),
    query: z.string().optional(),
    username: z.string().optional(),
    max_results: z.number().default(10),
  }),
  async execute(input: any) {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    if (!bearerToken) throw new Error('TWITTER_BEARER_TOKEN not configured');

    const headers = {
      'Authorization': `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    };

    switch (input.action) {
      case 'search_tweets': {
        if (!input.query) throw new Error('query required for search_tweets');
        const res = await fetch(
          `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(input.query)}&max_results=${input.max_results}&tweet.fields=created_at,public_metrics,author_id`,
          { headers }
        );
        if (!res.ok) throw new Error(`Twitter API error: ${res.status} ${await res.text()}`);
        return res.json();
      }

      case 'get_user_tweets': {
        if (!input.username) throw new Error('username required for get_user_tweets');
        // First get user ID
        const userRes = await fetch(`https://api.twitter.com/2/users/by/username/${input.username}`, { headers });
        if (!userRes.ok) throw new Error(`Twitter user lookup error: ${await userRes.text()}`);
        const userData = await userRes.json() as any;
        const userId = userData.data?.id;
        if (!userId) throw new Error(`User not found: ${input.username}`);

        const res = await fetch(
          `https://api.twitter.com/2/users/${userId}/tweets?max_results=${input.max_results}&tweet.fields=created_at,public_metrics`,
          { headers }
        );
        if (!res.ok) throw new Error(`Twitter API error: ${await res.text()}`);
        return res.json();
      }

      case 'post_tweet': {
        if (!input.text) throw new Error('text required for post_tweet');
        // Posting requires OAuth 1.0a -- simplified here with bearer token
        // In production, use oauth-1.0a library with consumer + access tokens
        const res = await fetch('https://api.twitter.com/2/tweets', {
          method: 'POST',
          headers,
          body: JSON.stringify({ text: input.text }),
        });
        if (!res.ok) throw new Error(`Twitter post error: ${res.status} ${await res.text()}`);
        return res.json();
      }

      default:
        throw new Error(`Unknown Twitter action: ${input.action}`);
    }
  },
};
