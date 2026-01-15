<script>
	import { onMount, onDestroy } from 'svelte';
	import Card from './ui/Card.svelte';

	let status = 'initializing';
	let qrCode = null;
	let lastUpdate = null;
	let interval = null;

	async function fetchStatus() {
		try {
			const response = await fetch('/api/whatsapp/status');
			const data = await response.json();
			status = data.status;
			lastUpdate = new Date().toLocaleTimeString();

			// Fetch QR code if status is qr_ready
			if (status === 'qr_ready') {
				const qrResponse = await fetch('/api/whatsapp/qr');
				const qrData = await qrResponse.json();
				qrCode = qrData.qr;
			} else {
				qrCode = null;
			}
		} catch (error) {
			console.error('Error fetching WhatsApp status:', error);
		}
	}

	onMount(() => {
		fetchStatus();
		// Auto-refresh every 5 seconds
		interval = setInterval(fetchStatus, 5000);
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});

	function getStatusConfig(currentStatus) {
		switch (currentStatus) {
			case 'connected':
				return {
					color: 'bg-green-500',
					text: 'Connected',
					description: 'WhatsApp is connected and ready to receive messages'
				};
			case 'qr_ready':
				return {
					color: 'bg-yellow-500',
					text: 'Waiting for QR Scan',
					description: 'Scan the QR code below with your WhatsApp mobile app'
				};
			case 'authenticated':
				return {
					color: 'bg-blue-500',
					text: 'Authenticating...',
					description: 'Authentication in progress'
				};
			case 'initializing':
				return {
					color: 'bg-gray-500',
					text: 'Initializing...',
					description: 'WhatsApp client is starting up'
				};
			case 'disconnected':
				return {
					color: 'bg-red-500',
					text: 'Disconnected',
					description: 'WhatsApp client is not connected'
				};
			default:
				return {
					color: 'bg-gray-500',
					text: 'Unknown',
					description: 'Status unknown'
				};
		}
	}

	$: statusConfig = getStatusConfig(status);
</script>

<Card title="WhatsApp Status">
	<div class="space-y-4">
		<!-- Status Indicator -->
		<div class="flex items-center gap-3">
			<div class="w-3 h-3 rounded-full {statusConfig.color} animate-pulse"></div>
			<div class="flex-1">
				<p class="font-medium text-text-dark">{statusConfig.text}</p>
				<p class="text-sm text-gray-600">{statusConfig.description}</p>
			</div>
		</div>

		<!-- QR Code Display -->
		{#if qrCode}
			<div class="border-t border-gray-200 pt-4">
				<p class="text-sm font-medium text-text-dark mb-3">Scan QR Code</p>
				<div class="bg-white p-4 rounded-lg border border-gray-200 inline-block">
					<img src={qrCode} alt="WhatsApp QR Code" class="w-64 h-64" />
				</div>
				<div class="mt-3 text-sm text-gray-600">
					<p class="font-medium mb-1">How to scan:</p>
					<ol class="list-decimal list-inside space-y-1">
						<li>Open WhatsApp on your phone</li>
						<li>Tap Menu or Settings → Linked Devices</li>
						<li>Tap "Link a Device"</li>
						<li>Point your phone at this screen to scan the code</li>
					</ol>
				</div>
			</div>
		{/if}

		<!-- Last Update -->
		{#if lastUpdate}
			<p class="text-xs text-gray-500 pt-2 border-t border-gray-200">
				Last updated: {lastUpdate}
			</p>
		{/if}
	</div>
</Card>
