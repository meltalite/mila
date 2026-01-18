<script>
	/**
	 * Confirmation Dialog Component
	 * Usage: <ConfirmDialog {title} {message} {confirmText} {onConfirm} {onCancel} />
	 */

	let {
		open = $bindable(false),
		title = 'Confirm Action',
		message = 'Are you sure you want to proceed?',
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		danger = false,
		onConfirm = () => {},
		onCancel = () => {}
	} = $props();

	function handleConfirm() {
		onConfirm();
		open = false;
	}

	function handleCancel() {
		onCancel();
		open = false;
	}

	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
			handleCancel();
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="dialog-title"
	>
		<div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-scale-in">
			<!-- Header -->
			<div class="p-6 border-b border-gray-200">
				<h2 id="dialog-title" class="text-xl font-semibold text-text-dark">
					{title}
				</h2>
			</div>

			<!-- Body -->
			<div class="p-6">
				<p class="text-gray-700">{message}</p>
			</div>

			<!-- Footer -->
			<div class="p-6 border-t border-gray-200 flex gap-3 justify-end">
				<button
					onclick={handleCancel}
					class="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
				>
					{cancelText}
				</button>
				<button
					onclick={handleConfirm}
					class="px-4 py-2 text-sm {danger
						? 'bg-red-600 hover:bg-red-700'
						: 'bg-primary hover:bg-purple-700'} text-white rounded-lg transition-colors"
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes scale-in {
		from {
			transform: scale(0.9);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	.animate-scale-in {
		animation: scale-in 0.2s ease-out;
	}
</style>
