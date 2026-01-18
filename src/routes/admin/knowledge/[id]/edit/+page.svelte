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
	let content = form?.data?.content || data.entry.content;
	let keywords = form?.data?.keywords || data.entry.keywords;
	let metadata = form?.data?.metadata
		? (typeof form.data.metadata === 'string' ? JSON.parse(form.data.metadata) : form.data.metadata)
		: (data.entry.metadata ? JSON.parse(data.entry.metadata) : {});
</script>

<svelte:head>
	<title>Edit: {data.entry.title} - MILA Admin</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold text-text-dark">Edit Knowledge Entry</h1>
		<p class="text-gray-600 mt-1">{data.entry.title}</p>
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
				<!-- Title -->
				<div>
					<label class="block text-sm font-medium text-text-dark mb-2">
						Title <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						name="title"
						required
						value={form?.data?.title || data.entry.title}
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
						value={form?.data?.category || data.entry.category}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
					>
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
						value={form?.data?.status || data.entry.status}
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
						{loading ? 'Saving...' : 'Save Changes'}
					</button>
					<a
						href="/admin/knowledge/{data.entry.id}"
						class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
					>
						Cancel
					</a>
				</div>
			</div>
		</Card>
	</form>
</div>
