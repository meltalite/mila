<script>
	/**
	 * Simple Toast Notification Component
	 * Usage: <Toast {message} {type} {duration} />
	 * Types: 'success', 'error', 'info', 'warning'
	 */

	let { message = '', type = 'info', duration = 3000, onClose = () => {} } = $props();

	let visible = $state(true);

	// Auto-hide after duration
	$effect(() => {
		if (visible && duration > 0) {
			const timer = setTimeout(() => {
				visible = false;
				onClose();
			}, duration);

			return () => clearTimeout(timer);
		}
	});

	function getStyles(type) {
		switch (type) {
			case 'success':
				return 'bg-green-500 text-white';
			case 'error':
				return 'bg-red-500 text-white';
			case 'warning':
				return 'bg-yellow-500 text-gray-900';
			case 'info':
			default:
				return 'bg-blue-500 text-white';
		}
	}

	function getIcon(type) {
		switch (type) {
			case 'success':
				return '✓';
			case 'error':
				return '✕';
			case 'warning':
				return '⚠';
			case 'info':
			default:
				return 'ℹ';
		}
	}
</script>

{#if visible && message}
	<div
		class="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg {getStyles(
			type
		)} animate-slide-in"
		role="alert"
	>
		<span class="text-lg">{getIcon(type)}</span>
		<span class="text-sm font-medium">{message}</span>
		<button
			onclick={() => {
				visible = false;
				onClose();
			}}
			class="ml-2 hover:opacity-80"
			aria-label="Close"
		>
			✕
		</button>
	</div>
{/if}

<style>
	@keyframes slide-in {
		from {
			transform: translateY(100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.animate-slide-in {
		animation: slide-in 0.3s ease-out;
	}
</style>
