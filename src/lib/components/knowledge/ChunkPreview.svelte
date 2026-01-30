<script>
	import { validateChunk } from '$lib/utils/chunking.js';

	export let chunk;
	export let index;
	export let onEdit = null;
	export let onDelete = null;
	export let onSplit = null;

	$: validation = validateChunk(chunk);
	$: quality = validation.quality;

	function getQualityColor(quality) {
		switch (quality) {
			case 'excellent':
				return 'bg-green-100 text-green-800 border-green-300';
			case 'good':
				return 'bg-blue-100 text-blue-800 border-blue-300';
			case 'fair':
				return 'bg-yellow-100 text-yellow-800 border-yellow-300';
			case 'poor':
				return 'bg-red-100 text-red-800 border-red-300';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-300';
		}
	}

	function getQualityLabel(quality) {
		return quality.charAt(0).toUpperCase() + quality.slice(1);
	}
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
	<!-- Header -->
	<div class="flex items-start justify-between">
		<div class="flex items-center gap-3">
			<span class="text-lg font-semibold text-gray-700">#{index + 1}</span>
			<span class={`px-2 py-1 rounded text-xs font-medium border ${getQualityColor(quality)}`}>
				{getQualityLabel(quality)}
			</span>
			<span class="text-sm text-gray-500">{chunk.content.length} chars</span>
		</div>

		<div class="flex gap-2">
			{#if onEdit}
				<button
					on:click={() => onEdit(chunk)}
					class="px-3 py-1 text-sm text-primary hover:bg-purple-50 rounded"
				>
					Edit
				</button>
			{/if}
			{#if onSplit}
				<button
					on:click={() => onSplit(chunk)}
					class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
				>
					Split
				</button>
			{/if}
			{#if onDelete}
				<button
					on:click={() => onDelete(chunk.id)}
					class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
				>
					Delete
				</button>
			{/if}
		</div>
	</div>

	<!-- Title -->
	<div>
		<label class="block text-xs font-medium text-gray-500 mb-1">Title</label>
		<p class="text-sm font-medium text-gray-900">{chunk.title}</p>
	</div>

	<!-- Content Preview -->
	<div>
		<label class="block text-xs font-medium text-gray-500 mb-1">Content</label>
		<div class="bg-gray-50 rounded p-3 text-sm text-gray-700 max-h-32 overflow-y-auto">
			{chunk.content}
		</div>
	</div>

	<!-- Keywords -->
	{#if chunk.keywords}
		<div>
			<label class="block text-xs font-medium text-gray-500 mb-1">Keywords</label>
			<div class="flex flex-wrap gap-1">
				{#each chunk.keywords.split(',').map((k) => k.trim()).filter(Boolean) as keyword}
					<span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">{keyword}</span>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Warnings -->
	{#if validation.warnings.length > 0}
		<div class="border-t border-gray-200 pt-3">
			<div class="space-y-1">
				{#each validation.warnings as warning}
					<div class="flex items-start gap-2 text-xs text-yellow-700">
						<svg
							class="w-4 h-4 mt-0.5 flex-shrink-0"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fill-rule="evenodd"
								d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
						<span>{warning}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
