<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		// Redirect to admin panel
		goto('/admin');
	});
</script>

<div class="flex items-center justify-center min-h-screen bg-background">
	<div class="text-center">
		<h1 class="text-4xl font-bold text-primary mb-4">MILA</h1>
		<p class="text-text-dark">Yoga Studio WhatsApp AI Assistant</p>
		<p class="text-sm text-gray-500 mt-4">Redirecting to admin panel...</p>
	</div>
</div>
