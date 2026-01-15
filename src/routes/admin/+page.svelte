<script>
	import Card from '$lib/components/ui/Card.svelte';
	import WhatsAppStatus from '$lib/components/WhatsAppStatus.svelte';

	/** @type {import('./$types').PageData} */
	export let data;
</script>

<svelte:head>
	<title>Dashboard - MILA Admin</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold text-text-dark">Dashboard</h1>
		<p class="text-gray-600 mt-1">Welcome to MILA Admin Panel</p>
	</div>

	<!-- WhatsApp Status -->
	<WhatsAppStatus />

	<!-- Quick Stats -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<Card>
			<div class="text-center">
				<p class="text-4xl font-bold text-primary">{data.stats.knowledge_entries}</p>
				<p class="text-sm text-gray-600 mt-2">Knowledge Entries</p>
			</div>
		</Card>

		<Card>
			<div class="text-center">
				<p class="text-4xl font-bold text-secondary">{data.stats.active_tenants}</p>
				<p class="text-sm text-gray-600 mt-2">Active Tenants</p>
			</div>
		</Card>

		<Card>
			<div class="text-center">
				<p class="text-4xl font-bold text-accent">{data.stats.messages_today}</p>
				<p class="text-sm text-gray-600 mt-2">Messages Today</p>
			</div>
		</Card>
	</div>

	<!-- Recent Activity -->
	<Card title="Recent Activity">
		{#if data.recentActivity.length === 0}
			<p class="text-gray-500 text-sm">No recent activity</p>
		{:else}
			<div class="space-y-3">
				{#each data.recentActivity as activity}
					<div class="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
						<span class="text-2xl">💬</span>
						<div class="flex-1">
							<div class="flex items-center justify-between">
								<p class="font-medium text-sm text-text-dark">{activity.user_phone}</p>
								<p class="text-xs text-gray-500">
									{new Date(activity.last_message_at).toLocaleString('en-US', {
										month: 'short',
										day: 'numeric',
										hour: '2-digit',
										minute: '2-digit'
									})}
								</p>
							</div>
							<p class="text-xs text-gray-600">{activity.tenant_name}</p>
							<p class="text-sm text-gray-700 mt-1">{activity.preview}</p>
						</div>
					</div>
				{/each}
			</div>
			<div class="mt-4 pt-3 border-t border-gray-200">
				<a
					href="/admin/conversations"
					class="text-sm text-primary hover:text-purple-700 font-medium"
				>
					View all conversations →
				</a>
			</div>
		{/if}
	</Card>

	<!-- Additional Stats -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<Card title="Overview">
			<dl class="space-y-2 text-sm">
				<div class="flex justify-between">
					<dt class="text-gray-600">Total Conversations</dt>
					<dd class="font-medium text-text-dark">{data.stats.total_conversations}</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-gray-600">Escalations Today</dt>
					<dd class="font-medium text-text-dark">{data.stats.escalations_today}</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-gray-600">Knowledge Entries</dt>
					<dd class="font-medium text-text-dark">{data.stats.knowledge_entries}</dd>
				</div>
			</dl>
		</Card>

		<Card title="Quick Links">
			<div class="space-y-2">
				<a
					href="/admin/knowledge/new"
					class="block px-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg"
				>
					+ Add Knowledge Entry
				</a>
				<a
					href="/admin/tenants/new"
					class="block px-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg"
				>
					+ Add Tenant
				</a>
				<a
					href="/admin/conversations"
					class="block px-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg"
				>
					View All Conversations
				</a>
			</div>
		</Card>
	</div>
</div>
