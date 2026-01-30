<script>
	import ScoreBar from './ScoreBar.svelte';
	import { goto } from '$app/navigation';

	export let result;
	export let expanded = false;

	function toggleExpand() {
		expanded = !expanded;
	}

	function viewEntry() {
		// Assuming entries have an ID we can navigate to
		// You may need to adjust this based on your routing
		goto(`/admin/knowledge?search=${encodeURIComponent(result.title)}`);
	}

	function getCategoryColor(category) {
		const colors = {
			'Class Information': 'bg-purple-100 text-purple-800',
			'Membership & Pricing': 'bg-blue-100 text-blue-800',
			'Studio Policies': 'bg-green-100 text-green-800',
			'Facilities & Location': 'bg-yellow-100 text-yellow-800',
			'Health & Safety': 'bg-red-100 text-red-800',
			'Instructors & Staff': 'bg-pink-100 text-pink-800',
			FAQ: 'bg-indigo-100 text-indigo-800'
		};
		return colors[category] || 'bg-gray-100 text-gray-800';
	}
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
	<!-- Header -->
	<div class="p-4 space-y-3">
		<div class="flex items-start justify-between gap-3">
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2 mb-1">
					<span
						class="flex-shrink-0 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold"
					>
						{result.rank}
					</span>
					<h3 class="text-base font-semibold text-gray-900 truncate">
						{result.title}
					</h3>
				</div>
				<div class="flex items-center gap-2 mt-1">
					<span class={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(result.category)}`}>
						{result.category}
					</span>
				</div>
			</div>
		</div>

		<!-- Score Bar -->
		<ScoreBar score={result.relevance_score} />

		<!-- Content Preview -->
		<div class="text-sm text-gray-600">
			{#if expanded}
				<div class="whitespace-pre-wrap">{result.content}</div>
			{:else}
				<div class="line-clamp-2">
					{result.content.length > 200
						? result.content.substring(0, 200) + '...'
						: result.content}
				</div>
			{/if}
		</div>

		<!-- Actions -->
		<div class="flex items-center gap-2 pt-2 border-t border-gray-100">
			<button
				on:click={toggleExpand}
				class="text-sm text-primary hover:text-purple-700 font-medium"
			>
				{expanded ? 'Show Less' : 'Show Full Content'}
			</button>
			<span class="text-gray-300">|</span>
			<button on:click={viewEntry} class="text-sm text-gray-600 hover:text-gray-800">
				View in Knowledge Base
			</button>
		</div>
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
