<script>
	export let value = ''; // Comma-separated string
	export let label = 'Keywords';
	export let placeholder = 'Add keywords...';

	let inputValue = '';
	$: tags = value
		? value
				.split(',')
				.map((t) => t.trim())
				.filter((t) => t)
		: [];

	function addTag() {
		if (inputValue.trim()) {
			const newTags = [...tags, inputValue.trim()];
			value = newTags.join(',');
			inputValue = '';
		}
	}

	function removeTag(index) {
		const newTags = tags.filter((_, i) => i !== index);
		value = newTags.join(',');
	}

	function handleKeydown(event) {
		if (event.key === 'Enter' || event.key === ',') {
			event.preventDefault();
			addTag();
		}
	}
</script>

<div class="space-y-2">
	<label class="block text-sm font-medium text-text-dark">{label}</label>

	<!-- Tags display -->
	{#if tags.length > 0}
		<div class="flex flex-wrap gap-2 mb-2">
			{#each tags as tag, index}
				<span
					class="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
				>
					{tag}
					<button
						type="button"
						on:click={() => removeTag(index)}
						class="hover:text-purple-700"
						aria-label="Remove tag"
					>
						×
					</button>
				</span>
			{/each}
		</div>
	{/if}

	<!-- Input -->
	<div class="flex gap-2">
		<input
			type="text"
			bind:value={inputValue}
			on:keydown={handleKeydown}
			{placeholder}
			class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
		/>
		<button
			type="button"
			on:click={addTag}
			class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-purple-700"
		>
			Add
		</button>
	</div>
	<p class="text-xs text-gray-500">Press Enter or comma to add a tag</p>

	<!-- Hidden input for form submission -->
	<input type="hidden" name="keywords" {value} />
</div>
