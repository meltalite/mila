<script>
	export let value = '';
	export let label = 'Content';
	export let placeholder = 'Enter markdown content...';
	export let rows = 10;

	let showPreview = false;

	// Simple markdown rendering (basic support)
	function renderMarkdown(text) {
		if (!text) return '';

		return text
			// Headers
			.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
			.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
			.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
			// Bold
			.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
			// Italic
			.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
			// Line breaks
			.replace(/\n\n/g, '</p><p class="mb-4">')
			.replace(/\n/g, '<br />');
	}

	$: renderedContent = renderMarkdown(value);
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between">
		<label class="block text-sm font-medium text-text-dark">{label}</label>
		<button
			type="button"
			on:click={() => (showPreview = !showPreview)}
			class="text-sm text-primary hover:text-purple-700"
		>
			{showPreview ? 'Edit' : 'Preview'}
		</button>
	</div>

	{#if showPreview}
		<div class="prose prose-sm max-w-none p-4 border border-gray-300 rounded-lg min-h-[200px] bg-gray-50">
			{@html '<p class="mb-4">' + renderedContent + '</p>'}
		</div>
	{:else}
		<textarea
			bind:value
			{placeholder}
			{rows}
			class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical"
		></textarea>
		<p class="text-xs text-gray-500">Supports basic markdown: **bold**, *italic*, # headers</p>
	{/if}
</div>
