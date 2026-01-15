<script>
	import Card from '$lib/components/ui/Card.svelte';
	import JsonEditor from '$lib/components/ui/JsonEditor.svelte';
	import { enhance } from '$app/forms';

	/** @type {import('./$types').PageData} */
	export let data;

	/** @type {import('./$types').ActionData} */
	export let form;

	let loading = false;

	// Format JSON for display
	let apiKeys = form?.data?.api_keys || JSON.stringify(data.tenant.api_keys, null, 2);
	let settings = form?.data?.settings || JSON.stringify(data.tenant.settings, null, 2);

	function formatDate(dateString) {
		return new Date(dateString).toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Edit: {data.tenant.name} - MILA Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-text-dark">Edit Tenant</h1>
			<p class="text-gray-600 mt-1">{data.tenant.name}</p>
		</div>
		<a href="/admin/tenants" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
			Back to List
		</a>
	</div>

	{#if form?.error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
			{form.error}
		</div>
	{/if}

	{#if form?.success}
		<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
			✓ Tenant updated successfully
		</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				await update();
				loading = false;
			};
		}}
	>
		<div class="space-y-6">
			<!-- Main Info Card -->
			<Card title="Basic Information">
				<div class="space-y-6">
					<!-- Name -->
					<div>
						<label class="block text-sm font-medium text-text-dark mb-2">
							Tenant Name <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							name="name"
							required
							value={form?.data?.name || data.tenant.name}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
						/>
					</div>

					<!-- WhatsApp Number -->
					<div>
						<label class="block text-sm font-medium text-text-dark mb-2"> WhatsApp Number </label>
						<input
							type="text"
							name="whatsapp_number"
							value={form?.data?.whatsapp_number || data.tenant.whatsapp_number || ''}
							placeholder="e.g., 6281234567890"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
						/>
						<p class="text-xs text-gray-500 mt-1">
							Format: Digits only (10-15 characters). Example: 6281234567890
						</p>
					</div>

					<!-- Active Status -->
					<div class="flex items-center gap-2">
						<input
							type="checkbox"
							id="active"
							name="active"
							value="true"
							checked={form?.data?.active !== undefined ? form.data.active : data.tenant.active}
							class="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
						/>
						<label for="active" class="text-sm font-medium text-text-dark">
							Active (tenant can receive and send messages)
						</label>
					</div>
				</div>
			</Card>

			<!-- API Keys Card -->
<!--			<Card title="API Keys">
				<JsonEditor bind:value={apiKeys} label="API Keys" rows={8} />
				<input type="hidden" name="api_keys" value={apiKeys} />
				<p class="text-xs text-gray-500 mt-2">
					Leave empty to use global API keys from environment variables.
				</p>
			</Card> -->

			<!-- Settings Card -->
			<Card title="Settings">
				<JsonEditor bind:value={settings} label="Settings" rows={12} />
				<input type="hidden" name="settings" value={settings} />
				<p class="text-xs text-gray-500 mt-2">
					Configure business hours, greeting message, and auto-escalation rules.
				</p>
			</Card>

			<!-- Metadata Card -->
			<Card title="Metadata">
				<dl class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<dt class="text-gray-500 mb-1">Tenant ID</dt>
						<dd class="font-mono text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded">
							{data.tenant.id}
						</dd>
					</div>
					<div>
						<dt class="text-gray-500 mb-1">Status</dt>
						<dd>
							<span
								class="px-2 py-1 rounded-full text-xs font-medium {data.tenant.active
									? 'bg-green-100 text-green-800'
									: 'bg-gray-100 text-gray-800'}"
							>
								{data.tenant.active ? 'Active' : 'Inactive'}
							</span>
						</dd>
					</div>
					<div>
						<dt class="text-gray-500 mb-1">Created</dt>
						<dd class="text-gray-700">{formatDate(data.tenant.created_at)}</dd>
					</div>
					<div>
						<dt class="text-gray-500 mb-1">Last Updated</dt>
						<dd class="text-gray-700">{formatDate(data.tenant.updated_at)}</dd>
					</div>
				</dl>
			</Card>

			<!-- Actions -->
			<div class="flex gap-3">
				<button
					type="submit"
					disabled={loading}
					class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? 'Saving...' : 'Save Changes'}
				</button>
				<a
					href="/admin/tenants"
					class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
				>
					Cancel
				</a>
			</div>
		</div>
	</form>
</div>
