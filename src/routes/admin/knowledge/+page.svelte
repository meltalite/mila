<script>
	import Card from '$lib/components/ui/Card.svelte';
	import { goto } from '$app/navigation';

	/** @type {import('./$types').PageData} */
	export let data;

	let selectedTenant = data.filters.tenantId || '';
	let selectedCategory = data.filters.category || '';
	let selectedStatus = data.filters.status || '';
	let searchQuery = data.filters.search || '';

	function applyFilters() {
		const params = new URLSearchParams();
		if (selectedTenant) params.set('tenant_id', selectedTenant);
		if (selectedCategory) params.set('category', selectedCategory);
		if (selectedStatus) params.set('status', selectedStatus);
		if (searchQuery) params.set('search', searchQuery);

		goto(`/admin/knowledge?${params.toString()}`);
	}

	function clearFilters() {
		selectedTenant = '';
		selectedCategory = '';
		selectedStatus = '';
		searchQuery = '';
		goto('/admin/knowledge');
	}

	async function deleteEntry(id, title) {
		if (!confirm(`Are you sure you want to delete "${title}"?`)) {
			return;
		}

		try {
			const response = await fetch(`/api/knowledge?id=${id}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (result.success) {
				alert('Entry deleted successfully');
				window.location.reload();
			} else {
				alert(`Error: ${result.error}`);
			}
		} catch (error) {
			alert(`Error deleting entry: ${error.message}`);
		}
	}

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
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
	<title>Knowledge Base - MILA Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-text-dark">Knowledge Base</h1>
			<p class="text-gray-600 mt-1">Manage knowledge entries for AI agent</p>
		</div>
		<div class="flex gap-3">
			<a
				href="/admin/knowledge/test"
				class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
			>
				Test Search
			</a>
			<a
				href="/admin/knowledge/chunk"
				class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
			>
				Auto Chunker
			</a>
			<a
				href="/admin/knowledge/new"
				class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-purple-700"
			>
				+ Add New Entry
			</a>
		</div>
	</div>

	<!-- Filters -->
	<Card title="Filters">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
				<select
					bind:value={selectedTenant}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
				>
					<option value="">All Tenants</option>
					{#each data.tenants as tenant}
						<option value={tenant.id}>{tenant.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
				<select
					bind:value={selectedCategory}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
				>
					<option value="">All Categories</option>
					{#each data.categories as category}
						<option value={category}>{category.replace('_', ' ')}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
				<select
					bind:value={selectedStatus}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
				>
					<option value="">All Status</option>
					<option value="active">Active</option>
					<option value="draft">Draft</option>
					<option value="archived">Archived</option>
				</select>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search title, keywords..."
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
				/>
			</div>
		</div>

		<div class="flex gap-2 mt-4">
			<button
				on:click={applyFilters}
				class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-purple-700"
			>
				Apply Filters
			</button>
			<button
				on:click={clearFilters}
				class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
			>
				Clear
			</button>
		</div>
	</Card>

	<!-- Entries Table -->
	<Card title="Entries ({data.entries.length})">
		{#if data.entries.length === 0}
			<p class="text-gray-500 text-center py-8">No knowledge entries found</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50 border-b border-gray-200">
						<tr>
							<th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
							<th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
							<th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Keywords</th>
							<th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
							<th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Updated</th>
							<th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200">
						{#each data.entries as entry}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-3">
									<a
										href="/admin/knowledge/{entry.id}"
										class="text-primary hover:text-purple-700 font-medium"
									>
										{entry.title}
									</a>
								</td>
								<td class="px-4 py-3 text-sm text-gray-600 capitalize">
									{entry.category.replace('_', ' ')}
								</td>
								<td class="px-4 py-3 text-sm text-gray-600">
									{#if entry.keywords}
										<div class="flex flex-wrap gap-1">
											{#each entry.keywords.split(',').slice(0, 3) as keyword}
												<span class="px-2 py-1 bg-gray-100 rounded text-xs">
													{keyword.trim()}
												</span>
											{/each}
										</div>
									{:else}
										<span class="text-gray-400">No keywords</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									<span
										class="px-2 py-1 rounded-full text-xs font-medium {getStatusColor(
											entry.status
										)}"
									>
										{entry.status}
									</span>
								</td>
								<td class="px-4 py-3 text-sm text-gray-600">
									{formatDate(entry.updated_at)}
								</td>
								<td class="px-4 py-3">
									<div class="flex gap-2">
										<a
											href="/admin/knowledge/{entry.id}/edit"
											class="text-blue-600 hover:text-blue-800 text-sm"
										>
											Edit
										</a>
										<button
											on:click={() => deleteEntry(entry.id, entry.title)}
											class="text-red-600 hover:text-red-800 text-sm"
										>
											Delete
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</Card>
</div>
