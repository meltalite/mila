<script>
	/**
	 * Loading Spinner Component
	 * Usage: <Spinner {size} {color} />
	 */

	let { size = 'md', color = 'primary' } = $props();

	const sizes = {
		sm: 'w-4 h-4 border-2',
		md: 'w-8 h-8 border-3',
		lg: 'w-12 h-12 border-4'
	};

	const colors = {
		primary: 'border-primary',
		white: 'border-white',
		gray: 'border-gray-500'
	};
</script>

<div
	class="inline-block {sizes[size]} border-solid {colors[color]} border-t-transparent rounded-full animate-spin"
	role="status"
	aria-label="Loading"
></div>

<style>
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>
