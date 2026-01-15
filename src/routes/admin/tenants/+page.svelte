<script>
	import Card from '$lib/components/ui/Card.svelte';
	import { goto } from '$app/navigation';

	/** @type {import('./$types').PageData} */
	export let data;

	async function toggleActive(id, currentStatus) {
		try {
			const response = await fetch('/api/tenants', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, action: 'toggle_active' })
			});

			const result = await response.json();

			if (result.success) {
				window.location.reload();
			} else {
				alert(`Error: ${result.error}`);
			}
		} catch (error) {
			alert(`Error toggling status: ${error.message}`);
		}
	}

	async function deleteTenant(id, name) {
		if (
			!confirm(
				`Are you sure you want to delete "${name}"?\n\nThis will also delete all associated knowledge entries and conversations.`
			)
		) {
			return;
		}

		try {
			const response = await fetch(`/api/tenants?id=${id}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (result.success) {
				alert('Tenant deleted successfully');
				window.location.reload();
			} else {
				alert(`Error: ${result.error}`);
			}
		} catch (error) {
			alert(`Error deleting tenant: ${error.message}`);
		}
	}

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Tenants - MILA Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-text-dark">Tenants</h1>
			<p class="text-gray-600 mt-1">Manage yoga studio tenants</p>
		</div>
		<a
			href="/admin/tenants/new"
			class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-purple-700"
		>
			+ Add New Tenant
		</a>
	</div>

	<Card title="Tenants ({data.tenants.length})">
		{#if data.tenants.length === 0}
			<p class="text-gray-500 text-center py-8">No tenants found</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50 border-b border-gray-200">
						<tr>
							<th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
							<th class="px-4 py-3 text-left text-sm font-semibold text-gray-700"
								>WhatsApp Number</th
							>
							<th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
							<th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
							<th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200">
						{#each data.tenants as tenant}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-3">
									<a
										href="/admin/tenants/{tenant.id}"
										class="text-primary hover:text-purple-700 font-medium"
									>
										{tenant.name}
									</a>
								</td>
								<td class="px-4 py-3 text-sm text-gray-600">
									{#if tenant.whatsapp_number}
										<span class="font-mono">{tenant.whatsapp_number}</span>
									{:else}
										<span class="text-gray-400 italic">Not set</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									<button
										on:click={() => toggleActive(tenant.id, tenant.active)}
										class="px-2 py-1 rounded-full text-xs font-medium {tenant.active
											? 'bg-green-100 text-green-800 hover:bg-green-200'
											: 'bg-gray-100 text-gray-800 hover:bg-gray-200'}"
									>
										{tenant.active ? 'Active' : 'Inactive'}
									</button>
								</td>
								<td class="px-4 py-3 text-sm text-gray-600">
									{formatDate(tenant.created_at)}
								</td>
								<td class="px-4 py-3">
									<div class="flex gap-2">
										<a
											href="/admin/tenants/{tenant.id}"
											class="text-blue-600 hover:text-blue-800 text-sm"
										>
											Edit
										</a>
										<button
											on:click={() => deleteTenant(tenant.id, tenant.name)}
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
