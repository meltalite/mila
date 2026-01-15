<script>
	import Card from '$lib/components/ui/Card.svelte';
	import JsonEditor from '$lib/components/ui/JsonEditor.svelte';
	import { enhance } from '$app/forms';

	/** @type {import('./$types').ActionData} */
	export let form;

	let loading = false;

	// Default templates
	let apiKeys =
		form?.data?.api_keys ||
		JSON.stringify(
			{
				anthropic: '',
				openai: ''
			},
			null,
			2
		);

	let settings =
		form?.data?.settings ||
		JSON.stringify(
			{
				business_hours: {
					monday: '09:00-21:00',
					tuesday: '09:00-21:00',
					wednesday: '09:00-21:00',
					thursday: '09:00-21:00',
					friday: '09:00-21:00',
					saturday: '08:00-18:00',
					sunday: '08:00-18:00'
				},
				greeting_message: 'Halo! Terima kasih telah menghubungi kami. Ada yang bisa saya bantu?',
				auto_escalation_rules: {
					medical_keywords: ['sakit', 'pain', 'injury', 'cedera', 'hamil', 'pregnant'],
					complex_keywords: ['booking', 'payment', 'refund', 'complaint']
				}
			},
			null,
			2
		);
</script>

<svelte:head>
	<title>New Tenant - MILA Admin</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold text-text-dark">New Tenant</h1>
		<p class="text-gray-600 mt-1">Add a new yoga studio to the system</p>
	</div>

	{#if form?.error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
			{form.error}
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
		<Card>
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
						value={form?.data?.name || ''}
						placeholder="e.g., Peaceful Yoga Studio"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
					/>
					<p class="text-xs text-gray-500 mt-1">The name of the yoga studio</p>
				</div>

				<!-- WhatsApp Number -->
				<div>
					<label class="block text-sm font-medium text-text-dark mb-2">
						WhatsApp Number (optional)
					</label>
					<input
						type="text"
						name="whatsapp_number"
						value={form?.data?.whatsapp_number || ''}
						placeholder="e.g., 6281234567890"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
					/>
					<p class="text-xs text-gray-500 mt-1">
						Format: Digits only (10-15 characters), no + or spaces. Example: 6281234567890
					</p>
				</div>

				<!-- API Keys -->
				<JsonEditor bind:value={apiKeys} label="API Keys (optional)" rows={8} />
				<input type="hidden" name="api_keys" value={apiKeys} />
				<p class="text-xs text-gray-500 -mt-4">
					Leave empty to use global API keys. Tenant-specific keys override global settings.
				</p>

				<!-- Settings -->
				<JsonEditor bind:value={settings} label="Settings (optional)" rows={12} />
				<input type="hidden" name="settings" value={settings} />

				<!-- Active Status -->
				<div class="flex items-center gap-2">
					<input
						type="checkbox"
						id="active"
						name="active"
						value="true"
						checked={form?.data?.active !== false}
						class="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
					/>
					<label for="active" class="text-sm font-medium text-text-dark">
						Active (tenant can receive and send messages)
					</label>
				</div>

				<!-- Actions -->
				<div class="flex gap-3 pt-4 border-t border-gray-200">
					<button
						type="submit"
						disabled={loading}
						class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? 'Creating...' : 'Create Tenant'}
					</button>
					<a
						href="/admin/tenants"
						class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
					>
						Cancel
					</a>
				</div>
			</div>
		</Card>
	</form>
</div>
