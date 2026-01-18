<script>
	import { page } from '$app/stores';
	import Card from '$lib/components/ui/Card.svelte';

	$: error = $page.error;
	$: status = $page.status;
</script>

<svelte:head>
	<title>Error - MILA Admin</title>
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
	<Card>
		<div class="text-center space-y-4 py-8 px-4">
			<!-- Error Icon -->
			<div class="text-6xl">⚠️</div>

			<!-- Status Code -->
			<h1 class="text-4xl font-bold text-text-dark">{status}</h1>

			<!-- Error Message -->
			<div class="space-y-2">
				<p class="text-xl text-gray-700">
					{#if status === 404}
						Page Not Found
					{:else if status === 403}
						Access Denied
					{:else if status === 500}
						Internal Server Error
					{:else}
						Something Went Wrong
					{/if}
				</p>

				{#if error?.message}
					<p class="text-sm text-gray-600 max-w-md mx-auto">
						{error.message}
					</p>
				{/if}
			</div>

			<!-- Actions -->
			<div class="flex gap-3 justify-center pt-4">
				<button
					onclick={() => window.history.back()}
					class="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
				>
					← Go Back
				</button>
				<a
					href="/admin"
					class="px-4 py-2 text-sm bg-primary hover:bg-purple-700 text-white rounded-lg transition-colors"
				>
					Go to Dashboard
				</a>
			</div>

			<!-- Debug Info (Development Only) -->
			{#if error?.stack && import.meta.env.DEV}
				<details class="mt-8 text-left">
					<summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
						Show Error Details (Dev Only)
					</summary>
					<pre
						class="mt-2 p-4 bg-gray-900 text-gray-100 rounded text-xs overflow-auto max-h-96">{error.stack}</pre>
				</details>
			{/if}
		</div>
	</Card>
</div>
