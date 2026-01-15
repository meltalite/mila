<script>
	export let value = '{}';
	export let label = 'JSON Data';
	export let placeholder = 'Enter JSON...';
	export let rows = 6;

	let error = '';

	function validateJson() {
		try {
			if (value.trim()) {
				JSON.parse(value);
			}
			error = '';
			return true;
		} catch (e) {
			error = e.message;
			return false;
		}
	}

	function formatJson() {
		try {
			const parsed = JSON.parse(value);
			value = JSON.stringify(parsed, null, 2);
			error = '';
		} catch (e) {
			error = 'Invalid JSON - cannot format';
		}
	}

	$: if (value) {
		validateJson();
	}
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between">
		<label class="block text-sm font-medium text-text-dark">{label}</label>
		<button
			type="button"
			on:click={formatJson}
			class="text-sm text-primary hover:text-purple-700"
		>
			Format JSON
		</button>
	</div>

	<textarea
		bind:value
		{placeholder}
		{rows}
		class="w-full px-3 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical {error
			? 'border-red-500 bg-red-50'
			: 'border-gray-300'}"
	></textarea>

	{#if error}
		<p class="text-xs text-red-600">⚠️ {error}</p>
	{:else}
		<p class="text-xs text-gray-500">✓ Valid JSON</p>
	{/if}
</div>
