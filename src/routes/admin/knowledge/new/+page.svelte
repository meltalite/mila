<script>
	import Card from '$lib/components/ui/Card.svelte';
	import MarkdownEditor from '$lib/components/ui/MarkdownEditor.svelte';
	import TagInput from '$lib/components/ui/TagInput.svelte';
	import KeyValueInput from '$lib/components/ui/KeyValueInput.svelte';
	import { enhance } from '$app/forms';

	/** @type {import('./$types').PageData} */
	export let data;

	/** @type {import('./$types').ActionData} */
	export let form;

	let loading = false;
	let content = form?.data?.content || '';
	let keywords = form?.data?.keywords || '';
	let metadata = form?.data?.metadata ? JSON.parse(form.data.metadata) : {};
</script>

<svelte:head>
	<title>New Knowledge Entry - MILA Admin</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold text-text-dark">New Knowledge Entry</h1>
		<p class="text-gray-600 mt-1">Create a new entry for the AI knowledge base</p>
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
				<!-- Tenant -->
				<div>
					<label class="block text-sm font-medium text-text-dark mb-2">
						Tenant <span class="text-red-500">*</span>
					</label>
					<select
						name="tenant_id"
						required
						value={form?.data?.tenant_id || ''}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
					>
						<option value="">Select tenant...</option>
						{#each data.tenants as tenant}
							<option value={tenant.id}>{tenant.name}</option>
						{/each}
					</select>
				</div>

				<!-- Title -->
				<div>
					<label class="block text-sm font-medium text-text-dark mb-2">
						Title <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						name="title"
						required
						value={form?.data?.title || ''}
						placeholder="e.g., Beginner Yoga Classes"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
					/>
				</div>

				<!-- Category -->
				<div>
					<label class="block text-sm font-medium text-text-dark mb-2">
						Category <span class="text-red-500">*</span>
					</label>
					<select
						name="category"
						required
						value={form?.data?.category || ''}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
					>
						<option value="">Select category...</option>
						{#each data.categories as category}
							<option value={category}>{category.replace('_', ' ')}</option>
						{/each}
					</select>
				</div>

				<!-- Content -->
				<MarkdownEditor bind:value={content} label="Content *" rows={15} />
				<input type="hidden" name="content" value={content} />

				<!-- Keywords -->
				<TagInput bind:value={keywords} />
				<input type="hidden" name="keywords" value={keywords} />

				<!-- Metadata -->
				<div>
					<label class="block text-sm font-medium text-text-dark mb-2">Metadata</label>
					<KeyValueInput bind:value={metadata} placeholder="Add custom metadata for filtering or categorization" />
					<input type="hidden" name="metadata" value={JSON.stringify(metadata)} />
				</div>

				<!-- Status -->
				<div>
					<label class="block text-sm font-medium text-text-dark mb-2">Status</label>
					<select
						name="status"
						value={form?.data?.status || 'active'}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
					>
						<option value="active">Active</option>
						<option value="draft">Draft</option>
						<option value="archived">Archived</option>
					</select>
				</div>

				<!-- Actions -->
				<div class="flex gap-3 pt-4 border-t border-gray-200">
					<button
						type="submit"
						disabled={loading}
						class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? 'Creating...' : 'Create Entry'}
					</button>
					<a
						href="/admin/knowledge"
						class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
					>
						Cancel
					</a>
				</div>
			</div>
		</Card>
	</form>
</div>
