<script>
	export let score;
	export let showLabel = true;
	export let size = 'md'; // 'sm', 'md', 'lg'

	$: percentage = Math.round(score * 100);
	$: color = getScoreColor(score);
	$: quality = getScoreQuality(score);

	function getScoreColor(score) {
		if (score >= 0.8) return 'bg-green-500';
		if (score >= 0.6) return 'bg-blue-500';
		if (score >= 0.4) return 'bg-yellow-500';
		if (score >= 0.2) return 'bg-orange-500';
		return 'bg-red-500';
	}

	function getScoreQuality(score) {
		if (score >= 0.8) return 'Excellent';
		if (score >= 0.6) return 'Good';
		if (score >= 0.4) return 'Fair';
		if (score >= 0.2) return 'Poor';
		return 'Very Poor';
	}

	function getHeight() {
		switch (size) {
			case 'sm':
				return 'h-1.5';
			case 'lg':
				return 'h-4';
			default:
				return 'h-2';
		}
	}
</script>

<div class="space-y-1">
	{#if showLabel}
		<div class="flex items-center justify-between text-xs">
			<span class="text-gray-600">Relevance: {quality}</span>
			<span class="font-semibold text-gray-700">{percentage}%</span>
		</div>
	{/if}
	<div class="w-full bg-gray-200 rounded-full overflow-hidden {getHeight()}">
		<div
			class="{color} {getHeight()} rounded-full transition-all duration-300"
			style="width: {percentage}%"
		></div>
	</div>
</div>
