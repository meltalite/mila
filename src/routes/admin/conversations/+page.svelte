<script>
	import Card from '$lib/components/ui/Card.svelte';
	import { goto } from '$app/navigation';

	/** @type {import('./$types').PageData} */
	export let data;

	let selectedTenant = data.filters.tenantId || '';
	let selectedLimit = data.filters.limit || 50;

	function applyFilters() {
		const params = new URLSearchParams();
		if (selectedTenant) params.set('tenant_id', selectedTenant);
		if (selectedLimit) params.set('limit', selectedLimit.toString());
		goto(`/admin/conversations?${params.toString()}`);
	}

	function clearFilters() {
		selectedTenant = '';
		selectedLimit = 50;
		goto('/admin/conversations');
	}

	function formatDate(dateString) {
		return new Date(dateString).toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatPhoneNumber(phone) {
		// Remove @c.us suffix if present
		const cleaned = phone.split('@')[0];
		return cleaned;
	}

	function getPreviewMessage(messages) {
		if (!messages || messages.length === 0) return 'No messages';
		const lastMessage = messages[messages.length - 1];
		const preview = lastMessage.content.substring(0, 80);
		return preview.length < lastMessage.content.length ? preview + '...' : preview;
	}

	let expandedConversations = new Set();

	function toggleConversation(id) {
		if (expandedConversations.has(id)) {
			expandedConversations.delete(id);
		} else {
			expandedConversations.add(id);
		}
		expandedConversations = expandedConversations;
	}
</script>

<svelte:head>
	<title>Conversations - MILA Admin</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold text-text-dark">Conversations</h1>
		<p class="text-gray-600 mt-1">View WhatsApp conversation history</p>
	</div>

	<!-- Statistics -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<Card>
			<div class="text-center">
				<p class="text-4xl font-bold text-primary">{data.stats.total_conversations}</p>
				<p class="text-sm text-gray-600 mt-2">Total Conversations</p>
			</div>
		</Card>
		<Card>
			<div class="text-center">
				<p class="text-4xl font-bold text-secondary">{data.stats.total_messages || 0}</p>
				<p class="text-sm text-gray-600 mt-2">Total Messages</p>
			</div>
		</Card>
		<Card>
			<div class="text-center">
				<p class="text-4xl font-bold text-accent">{data.stats.conversations_today}</p>
				<p class="text-sm text-gray-600 mt-2">Conversations Today</p>
			</div>
		</Card>
	</div>

	<!-- Filters -->
	<Card title="Filters">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
				<select
					bind:value={selectedTenant}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
				>
					<option value="">All Tenants</option>
					{#each data.tenants as tenant}
						<option value={tenant.id}>{tenant.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Limit</label>
				<select
					bind:value={selectedLimit}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
				>
					<option value="25">25 conversations</option>
					<option value="50">50 conversations</option>
					<option value="100">100 conversations</option>
					<option value="200">200 conversations</option>
				</select>
			</div>

			<div class="flex items-end gap-2">
				<button
					on:click={applyFilters}
					class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-purple-700"
				>
					Apply
				</button>
				<button
					on:click={clearFilters}
					class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
				>
					Clear
				</button>
			</div>
		</div>
	</Card>

	<!-- Conversations List -->
	<Card title="Conversations ({data.conversations.length})">
		{#if data.conversations.length === 0}
			<p class="text-gray-500 text-center py-8">No conversations found</p>
		{:else}
			<div class="space-y-2">
				{#each data.conversations as conversation}
					<div
						class="border border-gray-200 rounded-lg hover:border-gray-300 transition-colors overflow-hidden"
					>
						<!-- Conversation Header (always visible) -->
						<button
							on:click={() => toggleConversation(conversation.id)}
							class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
						>
							<div class="flex-1 text-left">
								<div class="flex items-center gap-3">
									<span class="text-2xl">💬</span>
									<div>
										<p class="font-medium text-text-dark">
											{formatPhoneNumber(conversation.user_phone)}
										</p>
										<p class="text-sm text-gray-600">
											{conversation.tenant_name || 'Unknown Tenant'}
										</p>
									</div>
								</div>
								<p class="text-sm text-gray-500 mt-2">
									{getPreviewMessage(conversation.messages)}
								</p>
							</div>
							<div class="text-right">
								<p class="text-sm text-gray-600">{formatDate(conversation.last_message_at)}</p>
								<p class="text-sm text-gray-500 mt-1">{conversation.message_count} messages</p>
								<span class="text-sm text-primary mt-2 block">
									{expandedConversations.has(conversation.id) ? '▼ Hide' : '▶ Show'}
								</span>
							</div>
						</button>

						<!-- Expanded Conversation (messages) -->
						{#if expandedConversations.has(conversation.id)}
							<div class="border-t border-gray-200 bg-gray-50 px-4 py-3 max-h-96 overflow-y-auto">
								<div class="space-y-3">
									{#each conversation.messages as message, idx}
										<div
											class="flex {message.role === 'user'
												? 'justify-start'
												: 'justify-end'}"
										>
											<div
												class="max-w-[80%] rounded-lg px-4 py-2 {message.role === 'user'
													? 'bg-white border border-gray-300 text-gray-900'
													: 'bg-primary text-white'}"
											>
												<div class="flex items-center gap-2 mb-1">
													<span class="text-xs opacity-75">
														{message.role === 'user' ? '👤 User' : '🤖 Assistant'}
													</span>
													{#if message.timestamp}
														<span class="text-xs opacity-75">
															{new Date(message.timestamp).toLocaleTimeString('en-US', {
																hour: '2-digit',
																minute: '2-digit'
															})}
														</span>
													{/if}
												</div>
												<p class="text-sm whitespace-pre-wrap">{message.content}</p>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</Card>
</div>
