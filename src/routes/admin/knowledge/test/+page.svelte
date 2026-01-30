<script>
	import Card from '$lib/components/ui/Card.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import SearchResult from '$lib/components/knowledge/SearchResult.svelte';

	/** @type {import('./$types').PageData} */
	export let data;

	// Search parameters
	let selectedTenant = '';
	let selectedCategory = '';
	let query = '';
	let limit = 5;

	// Search state
	let isSearching = false;
	let searchResults = null;
	let searchError = null;
	let expandedResults = new Set();

	// Debounce timer
	let debounceTimer;

	$: canSearch = selectedTenant && query.trim().length > 0;

	async function performSearch() {
		if (!canSearch) return;

		isSearching = true;
		searchError = null;

		try {
			const response = await fetch('/api/knowledge/search', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tenant_id: selectedTenant,
					query: query.trim(),
					category: selectedCategory || undefined,
					limit
				})
			});

			const result = await response.json();

			if (result.success) {
				searchResults = result;
			} else {
				searchError = result.error || 'Search failed';
				searchResults = null;
			}
		} catch (error) {
			searchError = error.message;
			searchResults = null;
		} finally {
			isSearching = false;
		}
	}

	function debouncedSearch() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(performSearch, 500);
	}

	function handleQueryInput() {
		if (canSearch) {
			debouncedSearch();
		}
	}

	function exportResults(format) {
		if (!searchResults || !searchResults.results.length) {
			alert('No results to export');
			return;
		}

		if (format === 'json') {
			exportAsJSON();
		} else if (format === 'csv') {
			exportAsCSV();
		}
	}

	function exportAsJSON() {
		const dataStr = JSON.stringify(searchResults, null, 2);
		const blob = new Blob([dataStr], { type: 'application/json' });
		downloadBlob(blob, 'search-results.json');
	}

	function exportAsCSV() {
		const headers = ['Rank', 'Title', 'Category', 'Relevance Score', 'Content'];
		const rows = searchResults.results.map((r) => [
			r.rank,
			`"${r.title.replace(/"/g, '""')}"`,
			r.category,
			r.relevance_score.toFixed(4),
			`"${r.content.replace(/"/g, '""')}"`
		]);

		const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		downloadBlob(blob, 'search-results.csv');
	}

	function downloadBlob(blob, filename) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function getScoreDistribution() {
		if (!searchResults || !searchResults.results.length) return [];

		const buckets = [
			{ label: '0.8-1.0', min: 0.8, max: 1.0, count: 0, color: 'bg-green-500' },
			{ label: '0.6-0.8', min: 0.6, max: 0.8, count: 0, color: 'bg-blue-500' },
			{ label: '0.4-0.6', min: 0.4, max: 0.6, count: 0, color: 'bg-yellow-500' },
			{ label: '0.2-0.4', min: 0.2, max: 0.4, count: 0, color: 'bg-orange-500' },
			{ label: '0.0-0.2', min: 0.0, max: 0.2, count: 0, color: 'bg-red-500' }
		];

		searchResults.results.forEach((r) => {
			const bucket = buckets.find((b) => r.relevance_score >= b.min && r.relevance_score < b.max);
			if (bucket) bucket.count++;
		});

		return buckets;
	}

	function toggleResultExpansion(rank) {
		if (expandedResults.has(rank)) {
			expandedResults.delete(rank);
		} else {
			expandedResults.add(rank);
		}
		expandedResults = expandedResults;
	}
</script>

<svelte:head>
	<title>Vector Search Test - MILA Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-text-dark">Vector Search Test Tool</h1>
			<p class="text-gray-600 mt-1">Test queries and see relevance scores</p>
		</div>
		<a
			href="/admin/knowledge"
			class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
		>
			Back to Knowledge Base
		</a>
	</div>

	<!-- Query Section -->
	<Card title="Search Query">
		<div class="space-y-4">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Tenant Selection -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						Tenant <span class="text-red-500">*</span>
					</label>
					<select
						bind:value={selectedTenant}
						on:change={handleQueryInput}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="">Select a tenant</option>
						{#each data.tenants as tenant}
							<option value={tenant.id}>{tenant.name}</option>
						{/each}
					</select>
				</div>

				<!-- Category Filter -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						Category (Optional)
					</label>
					<select
						bind:value={selectedCategory}
						on:change={handleQueryInput}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="">All categories</option>
						{#each data.categories as category}
							<option value={category}>{category}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Query Input -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">
					Query <span class="text-red-500">*</span>
				</label>
				<input
					type="text"
					bind:value={query}
					on:input={handleQueryInput}
					placeholder="e.g., beginner yoga class schedule..."
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
				/>
				<p class="text-xs text-gray-500 mt-1">Results update automatically as you type</p>
			</div>

			<!-- Limit Slider -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">
					Result Limit: <span class="font-semibold text-primary">{limit}</span>
				</label>
				<input
					type="range"
					bind:value={limit}
					on:change={handleQueryInput}
					min="1"
					max="20"
					step="1"
					class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
				/>
				<div class="flex justify-between text-xs text-gray-500 mt-1">
					<span>1</span>
					<span>20</span>
				</div>
			</div>
		</div>
	</Card>

	<!-- Loading State -->
	{#if isSearching}
		<Card>
			<div class="flex items-center justify-center py-12">
				<div class="text-center">
					<Spinner size="lg" />
					<p class="text-gray-600 mt-4">Searching knowledge base...</p>
				</div>
			</div>
		</Card>
	{/if}

	<!-- Error State -->
	{#if searchError}
		<Card>
			<div class="bg-red-50 border border-red-200 rounded-lg p-4">
				<div class="flex items-start gap-3">
					<svg class="w-6 h-6 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
					<div>
						<h3 class="font-semibold text-red-800">Search Error</h3>
						<p class="text-sm text-red-700 mt-1">{searchError}</p>
					</div>
				</div>
			</div>
		</Card>
	{/if}

	<!-- Results Section -->
	{#if searchResults && !isSearching}
		<!-- Analytics -->
		<Card title="Search Analytics">
			<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
				<div class="bg-gray-50 rounded-lg p-4">
					<div class="text-sm text-gray-600 mb-1">Results</div>
					<div class="text-2xl font-bold text-text-dark">{searchResults.stats.count}</div>
				</div>
				<div class="bg-gray-50 rounded-lg p-4">
					<div class="text-sm text-gray-600 mb-1">Avg Score</div>
					<div class="text-2xl font-bold text-text-dark">
						{searchResults.stats.avgScore.toFixed(3)}
					</div>
				</div>
				<div class="bg-gray-50 rounded-lg p-4">
					<div class="text-sm text-gray-600 mb-1">Min Score</div>
					<div class="text-2xl font-bold text-text-dark">
						{searchResults.stats.minScore.toFixed(3)}
					</div>
				</div>
				<div class="bg-gray-50 rounded-lg p-4">
					<div class="text-sm text-gray-600 mb-1">Max Score</div>
					<div class="text-2xl font-bold text-text-dark">
						{searchResults.stats.maxScore.toFixed(3)}
					</div>
				</div>
				<div class="bg-gray-50 rounded-lg p-4">
					<div class="text-sm text-gray-600 mb-1">Duration</div>
					<div class="text-2xl font-bold text-text-dark">{searchResults.stats.duration}ms</div>
				</div>
			</div>

			<!-- Score Distribution -->
			{#if searchResults.results.length > 0}
				<div class="mt-6">
					<h3 class="text-sm font-semibold text-gray-700 mb-3">Score Distribution</h3>
					<div class="space-y-2">
						{#each getScoreDistribution() as bucket}
							<div class="flex items-center gap-3">
								<div class="w-20 text-xs text-gray-600">{bucket.label}</div>
								<div class="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
									<div
										class="{bucket.color} h-full flex items-center justify-end pr-2 text-white text-xs font-semibold transition-all duration-300"
										style="width: {(bucket.count / searchResults.results.length) * 100}%"
									>
										{#if bucket.count > 0}
											{bucket.count}
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</Card>

		<!-- Results List -->
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-bold text-text-dark">
				Search Results
				{#if searchResults.stats.totalFound > searchResults.stats.count}
					<span class="text-sm font-normal text-gray-500">
						(showing {searchResults.stats.count} of {searchResults.stats.totalFound})
					</span>
				{/if}
			</h2>
			{#if searchResults.results.length > 0}
				<div class="flex gap-2">
					<button
						on:click={() => exportResults('csv')}
						class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
					>
						Export CSV
					</button>
					<button
						on:click={() => exportResults('json')}
						class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
					>
						Export JSON
					</button>
				</div>
			{/if}
		</div>

		{#if searchResults.results.length === 0}
			<!-- Empty State -->
			<Card>
				<div class="text-center py-12">
					<svg
						class="mx-auto h-12 w-12 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<h3 class="mt-4 text-lg font-medium text-gray-900">No results found</h3>
					<p class="mt-2 text-sm text-gray-500">
						{searchResults.stats.message || 'Try adjusting your query or removing the category filter'}
					</p>
				</div>
			</Card>
		{:else}
			<!-- Results Grid -->
			<div class="space-y-3">
				{#each searchResults.results as result}
					<SearchResult
						{result}
						expanded={expandedResults.has(result.rank)}
						on:toggle={() => toggleResultExpansion(result.rank)}
					/>
				{/each}
			</div>
		{/if}
	{/if}

	<!-- Initial State -->
	{#if !searchResults && !isSearching && !searchError}
		<Card>
			<div class="text-center py-12">
				<svg
					class="mx-auto h-16 w-16 text-gray-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
				<h3 class="mt-4 text-lg font-medium text-gray-900">Ready to search</h3>
				<p class="mt-2 text-sm text-gray-500">
					Select a tenant and enter a query to test the knowledge base search
				</p>
			</div>
		</Card>
	{/if}
</div>
