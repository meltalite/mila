/**
 * Admin Layout Server
 * Ensures user is authenticated before accessing admin pages
 */

/** @type {import('./$types').LayoutServerLoad} */
export function load({ locals }) {
	return {
		user: locals.user
	};
}
