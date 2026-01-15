<script>
	import Sidebar from '$lib/components/ui/Sidebar.svelte';
	import '../../app.css';

	/** @type {import('./$types').LayoutData} */
	export let data;
</script>

<div class="flex min-h-screen bg-background">
	<Sidebar />

	<main class="flex-1 p-8">
		<slot />
	</main>
</div>
