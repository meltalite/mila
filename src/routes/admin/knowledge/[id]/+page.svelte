<script>
	import Card from '$lib/components/ui/Card.svelte';

	/** @type {import('./$types').PageData} */
	export let data;

	function formatDate(dateString) {
		return new Date(dateString).toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusColor(status) {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800';
			case 'draft':
				return 'bg-yellow-100 text-yellow-800';
			case 'archived':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<svelte:head>
	<title>{data.entry.title} - MILA Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-text-dark">{data.entry.title}</h1>
			<p class="text-gray-600 mt-1 capitalize">{data.entry.category.replace('_', ' ')}</p>
		</div>
		<div class="flex gap-2">
			<a
				href="/admin/knowledge/{data.entry.id}/edit"
				class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
			>
				Edit
			</a>
			<a href="/admin/knowledge" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
				Back to List
			</a>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<!-- Main Content -->
		<div class="md:col-span-2 space-y-6">
			<Card title="Content">
				<div class="prose prose-sm max-w-none">
					{@html data.entry.content
						.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
						.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
						.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
						.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
						.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
						.replace(/\n\n/g, '</p><p class="mb-4">')
						.replace(/\n/g, '<br />')
						.split('</p><p class="mb-4">')
						.map((p) => `<p class="mb-4">${p}</p>`)
						.join('')}
				</div>
			</Card>
		</div>

		<!-- Sidebar -->
		<div class="space-y-6">
			<!-- Status -->
			<Card title="Status">
				<span class="px-3 py-1 rounded-full text-sm font-medium {getStatusColor(data.entry.status)}">
					{data.entry.status}
				</span>
			</Card>

			<!-- Keywords -->
			<Card title="Keywords">
				{#if data.entry.keywords}
					<div class="flex flex-wrap gap-2">
						{#each data.entry.keywords.split(',') as keyword}
							<span class="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
								{keyword.trim()}
							</span>
						{/each}
					</div>
				{:else}
					<p class="text-gray-500 text-sm">No keywords</p>
				{/if}
			</Card>

			<!-- Custom Metadata -->
			<Card title="Metadata">
				{#if data.entry.metadata}
					{@const metadataObj = JSON.parse(data.entry.metadata)}
					{#if Object.keys(metadataObj).length > 0}
						<dl class="space-y-3 text-sm">
							{#each Object.entries(metadataObj) as [key, value]}
								<div>
									<dt class="text-gray-500">{key}</dt>
									<dd class="text-gray-700 text-xs font-mono">{value}</dd>
								</div>
							{/each}
						</dl>
					{:else}
						<p class="text-gray-500 text-sm">No custom metadata</p>
					{/if}
				{:else}
					<p class="text-gray-500 text-sm">No custom metadata</p>
				{/if}
			</Card>

			<!-- System Details -->
			<Card title="System Details">
				<dl class="space-y-3 text-sm">
					<div>
						<dt class="text-gray-500">ID</dt>
						<dd class="font-mono text-xs text-gray-700">{data.entry.id}</dd>
					</div>
					<div>
						<dt class="text-gray-500">Tenant ID</dt>
						<dd class="font-mono text-xs text-gray-700">{data.entry.tenant_id}</dd>
					</div>
					<div>
						<dt class="text-gray-500">Vector ID</dt>
						<dd class="font-mono text-xs text-gray-700">
							{data.entry.vector_id || 'Not indexed'}
						</dd>
					</div>
					<div>
						<dt class="text-gray-500">Created</dt>
						<dd class="text-gray-700">{formatDate(data.entry.created_at)}</dd>
					</div>
					<div>
						<dt class="text-gray-500">Updated</dt>
						<dd class="text-gray-700">{formatDate(data.entry.updated_at)}</dd>
					</div>
				</dl>
			</Card>
		</div>
	</div>
</div>
