<script>
	import { page } from '$app/stores';

	const navItems = [
		{ href: '/admin', label: 'Dashboard', icon: '📊' },
		{ href: '/admin/tenants', label: 'Tenants', icon: '🏢' },
		{ href: '/admin/knowledge', label: 'Knowledge Base', icon: '📚' },
		{ href: '/admin/conversations', label: 'Conversations', icon: '💬' }
	];

	function isActive(href) {
		if (href === '/admin') {
			return $page.url.pathname === '/admin';
		}
		return $page.url.pathname.startsWith(href);
	}
</script>

<aside class="w-64 bg-white border-r border-gray-200 min-h-screen">
	<div class="p-6">
		<h1 class="text-2xl font-bold text-primary">MILA</h1>
		<p class="text-sm text-gray-500">Admin Panel</p>
	</div>

	<nav class="px-4 space-y-1">
		{#each navItems as item}
			<a
				href={item.href}
				class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {isActive(item.href)
					? 'bg-primary text-white'
					: 'text-gray-700 hover:bg-gray-100'}"
			>
				<span class="text-xl">{item.icon}</span>
				<span class="font-medium">{item.label}</span>
			</a>
		{/each}
	</nav>
</aside>
