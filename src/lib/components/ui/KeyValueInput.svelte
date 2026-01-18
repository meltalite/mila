<script>
	/**
	 * Key-Value Pair Input Component
	 * Usage: <KeyValueInput bind:value={metadata} />
	 * Value format: { key1: "value1", key2: "value2" }
	 */

	let { value = $bindable({}), placeholder = 'Add metadata' } = $props();

	let entries = $state(
		Object.entries(value || {}).map(([key, val]) => ({ key, value: val, id: Math.random() }))
	);
	let newKey = $state('');
	let newValue = $state('');

	// Update the bound value whenever entries change
	$effect(() => {
		const obj = {};
		entries.forEach((entry) => {
			if (entry.key && entry.key.trim()) {
				obj[entry.key.trim()] = entry.value || '';
			}
		});
		value = obj;
	});

	function addEntry() {
		if (newKey.trim()) {
			entries = [...entries, { key: newKey.trim(), value: newValue, id: parseInt(Math.random() * 1e10) }];
			newKey = '';
			newValue = '';
		}
	}

	function removeEntry(id) {
		entries = entries.filter((e) => e.id !== id);
	}

	function handleKeyPress(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addEntry();
		}
	}
</script>

<div class="space-y-3">
	<!-- Existing entries -->
	{#if entries.length > 0}
		<div class="space-y-2">
			{#each entries as entry (entry.id)}
				<div class="flex gap-2 items-start">
					<input
						type="text"
						bind:value={entry.key}
						placeholder="Key"
						class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
					/>
					<input
						type="text"
						bind:value={entry.value}
						placeholder="Value"
						class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
					/>
					<button
						type="button"
						onclick={() => removeEntry(entry.id)}
						class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
						aria-label="Remove entry"
					>
						✕
					</button>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Add new entry form -->
	<div class="flex gap-2 items-start border-t pt-3">
		<input
			type="text"
			bind:value={newKey}
			onkeypress={handleKeyPress}
			placeholder="Key"
			class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
		/>
		<input
			type="text"
			bind:value={newValue}
			onkeypress={handleKeyPress}
			placeholder="Value"
			class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
		/>
		<button
			type="button"
			onclick={addEntry}
			disabled={!newKey.trim()}
			class="px-4 py-2 bg-primary hover:bg-purple-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
		>
			Add
		</button>
	</div>

	<!-- Helper text -->
	<p class="text-xs text-gray-500">
		{placeholder}. Press Enter or click Add to add each key-value pair.
	</p>
</div>
