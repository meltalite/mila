<script>
	export let title = '';
	export let padding = true;
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200">
	{#if title}
		<div class="px-6 py-4 border-b border-gray-200">
			<h2 class="text-lg font-semibold text-text-dark">{title}</h2>
		</div>
	{/if}
	<div class={padding ? 'p-6' : ''}>
		<slot />
	</div>
</div>
