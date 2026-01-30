/**
 * Knowledge Search Test API
 * Wrapper around executeKnowledgeSearch for testing and debugging
 */

import { json } from '@sveltejs/kit';
import { executeKnowledgeSearch } from '$lib/server/agent/tools.js';

/**
 * Test knowledge search with stats
 * POST /api/knowledge/search
 * Body: {
 *   tenant_id: string,
 *   query: string,
 *   category?: string,
 *   limit?: number (default: 5, max: 20)
 * }
 */
export async function POST({ request }) {
	try {
		const { tenant_id, query, category, limit = 5 } = await request.json();

		// Validate input
		if (!tenant_id || !query) {
			return json(
				{
					success: false,
					error: 'tenant_id and query are required'
				},
				{ status: 400 }
			);
		}

		const requestedLimit = Math.min(Math.max(1, limit), 20);

		console.log(
			`[Search Test] Tenant: ${tenant_id}, Query: "${query}", Category: ${category || 'all'}, Limit: ${requestedLimit}`
		);

		// Execute search with timing
		const startTime = Date.now();
		const searchResult = await executeKnowledgeSearch(tenant_id, query, category);
		const duration = Date.now() - startTime;

		// Handle search failure
		if (!searchResult.found) {
			return json({
				success: true,
				query,
				results: [],
				stats: {
					count: 0,
					avgScore: 0,
					minScore: 0,
					maxScore: 0,
					duration,
					message: searchResult.message || searchResult.error || 'No results found'
				}
			});
		}

		// Apply limit and calculate stats
		const results = searchResult.results?.slice(0, requestedLimit) || [];
		const scores = results.map((r) => r.relevance_score);

		const stats = {
			count: results.length,
			totalFound: searchResult.count,
			avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
			minScore: scores.length > 0 ? Math.min(...scores) : 0,
			maxScore: scores.length > 0 ? Math.max(...scores) : 0,
			duration
		};

		console.log(
			`[Search Test] Found ${stats.totalFound} results, showing ${stats.count}. Avg score: ${stats.avgScore.toFixed(3)}, Duration: ${duration}ms`
		);

		return json({
			success: true,
			query,
			category: category || null,
			results,
			stats
		});
	} catch (error) {
		console.error('[Search Test] Error:', error);
		return json(
			{
				success: false,
				error: 'Internal server error',
				details: error.message
			},
			{ status: 500 }
		);
	}
}
