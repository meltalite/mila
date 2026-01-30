<script>
	import { goto } from '$app/navigation';
	import Card from '$lib/components/ui/Card.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import ChunkPreview from '$lib/components/knowledge/ChunkPreview.svelte';
	import TagInput from '$lib/components/ui/TagInput.svelte';
	import { chunkText, mergeChunks } from '$lib/utils/chunking.js';

	/** @type {import('./$types').PageData} */
	export let data;

	// Wizard steps
	let currentStep = 1;

	// Step 1: Configuration
	let selectedTenant = '';
	let selectedCategory = '';
	let inputText = '';
	let chunkSize = 500;
	let chunkOverlap = 100;

	// Step 2: Preview & Edit
	let chunks = [];
	let isGenerating = false;
	let editingChunk = null;
	let selectedChunks = new Set();

	// Step 3: Save
	let isSaving = false;
	let saveResult = null;

	// Validation
	$: canProceedStep1 = selectedTenant && selectedCategory && inputText.trim().length > 0;
	$: canProceedStep2 = chunks.length > 0;

	async function generateChunks() {
		if (!canProceedStep1) return;

		isGenerating = true;
		try {
			chunks = await chunkText(inputText, { chunkSize, chunkOverlap });
			currentStep = 2;
		} catch (error) {
			alert(`Error generating chunks: ${error.message}`);
		} finally {
			isGenerating = false;
		}
	}

	function editChunk(chunk) {
		editingChunk = { ...chunk };
	}

	function saveChunkEdit() {
		const index = chunks.findIndex((c) => c.id === editingChunk.id);
		if (index !== -1) {
			chunks[index] = { ...editingChunk };
			chunks = chunks; // Trigger reactivity
		}
		editingChunk = null;
	}

	function cancelChunkEdit() {
		editingChunk = null;
	}

	function deleteChunk(id) {
		if (chunks.length <= 1) {
			alert('Cannot delete the last chunk');
			return;
		}
		if (confirm('Are you sure you want to delete this chunk?')) {
			chunks = chunks.filter((c) => c.id !== id);
		}
	}

	function splitChunk(chunk) {
		const midpoint = Math.floor(chunk.content.length / 2);
		// Find nearest sentence break
		let splitPos = chunk.content.lastIndexOf('. ', midpoint);
		if (splitPos === -1 || splitPos < midpoint * 0.3) {
			splitPos = midpoint;
		} else {
			splitPos += 2; // Include the period and space
		}

		const content1 = chunk.content.substring(0, splitPos).trim();
		const content2 = chunk.content.substring(splitPos).trim();

		const index = chunks.findIndex((c) => c.id === chunk.id);
		const newChunks = [
			{
				id: crypto.randomUUID(),
				title: `Part ${index + 1}A: ${content1.split(' ').slice(0, 8).join(' ')}...`,
				content: content1,
				keywords: chunk.keywords,
				metadata: { ...chunk.metadata, splitFrom: chunk.id }
			},
			{
				id: crypto.randomUUID(),
				title: `Part ${index + 1}B: ${content2.split(' ').slice(0, 8).join(' ')}...`,
				content: content2,
				keywords: chunk.keywords,
				metadata: { ...chunk.metadata, splitFrom: chunk.id }
			}
		];

		chunks = [...chunks.slice(0, index), ...newChunks, ...chunks.slice(index + 1)];
	}

	function toggleChunkSelection(chunkId) {
		if (selectedChunks.has(chunkId)) {
			selectedChunks.delete(chunkId);
		} else {
			selectedChunks.add(chunkId);
		}
		selectedChunks = selectedChunks; // Trigger reactivity
	}

	function mergeSelectedChunks() {
		if (selectedChunks.size < 2) {
			alert('Please select at least 2 chunks to merge');
			return;
		}

		const chunksToMerge = chunks.filter((c) => selectedChunks.has(c.id));
		const merged = mergeChunks(chunksToMerge);

		// Remove merged chunks and add the new one
		chunks = chunks.filter((c) => !selectedChunks.has(c.id));
		chunks.push(merged);
		chunks = chunks; // Trigger reactivity

		selectedChunks.clear();
		selectedChunks = selectedChunks;
	}

	async function saveAllChunks() {
		if (!canProceedStep2) return;

		isSaving = true;
		saveResult = null;

		try {
			const response = await fetch('/api/knowledge/batch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tenant_id: selectedTenant,
					category: selectedCategory,
					chunks: chunks.map((c) => ({
						title: c.title,
						content: c.content,
						keywords: c.keywords,
						metadata: c.metadata
					}))
				})
			});

			const result = await response.json();

			if (result.success) {
				saveResult = {
					success: true,
					count: result.count,
					entries: result.entries
				};
				currentStep = 3;
			} else {
				alert(`Error: ${result.error}`);
			}
		} catch (error) {
			alert(`Error saving chunks: ${error.message}`);
		} finally {
			isSaving = false;
		}
	}

	function resetWizard() {
		currentStep = 1;
		selectedTenant = '';
		selectedCategory = '';
		inputText = '';
		chunks = [];
		editingChunk = null;
		saveResult = null;
		selectedChunks = new Set();
	}

	function goToKnowledgeBase() {
		goto('/admin/knowledge');
	}
</script>

<svelte:head>
	<title>Auto Chunker - MILA Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-text-dark">Auto Chunker</h1>
			<p class="text-gray-600 mt-1">Automatically split text into knowledge chunks</p>
		</div>
		<a
			href="/admin/knowledge"
			class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
		>
			Back to Knowledge Base
		</a>
	</div>

	<!-- Progress Steps -->
	<div class="flex items-center justify-center gap-4">
		<div class="flex items-center gap-2">
			<div
				class={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
					currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
				}`}
			>
				1
			</div>
			<span class={currentStep >= 1 ? 'text-primary font-medium' : 'text-gray-600'}>
				Configure
			</span>
		</div>

		<div class="w-16 h-1 bg-gray-200">
			<div
				class="h-full bg-primary transition-all"
				style={`width: ${currentStep >= 2 ? '100%' : '0%'}`}
			></div>
		</div>

		<div class="flex items-center gap-2">
			<div
				class={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
					currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
				}`}
			>
				2
			</div>
			<span class={currentStep >= 2 ? 'text-primary font-medium' : 'text-gray-600'}>
				Preview & Edit
			</span>
		</div>

		<div class="w-16 h-1 bg-gray-200">
			<div
				class="h-full bg-primary transition-all"
				style={`width: ${currentStep >= 3 ? '100%' : '0%'}`}
			></div>
		</div>

		<div class="flex items-center gap-2">
			<div
				class={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
					currentStep >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
				}`}
			>
				3
			</div>
			<span class={currentStep >= 3 ? 'text-primary font-medium' : 'text-gray-600'}>
				Complete
			</span>
		</div>
	</div>

	<!-- Step 1: Configuration -->
	{#if currentStep === 1}
		<Card title="Step 1: Configure & Paste Text">
			<div class="space-y-4">
				<!-- Tenant Selection -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						Tenant <span class="text-red-500">*</span>
					</label>
					<select
						bind:value={selectedTenant}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="">Select a tenant</option>
						{#each data.tenants as tenant}
							<option value={tenant.id}>{tenant.name}</option>
						{/each}
					</select>
				</div>

				<!-- Category Selection -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						Category <span class="text-red-500">*</span>
					</label>
					<select
						bind:value={selectedCategory}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="">Select a category</option>
						{#each data.categories as category}
							<option value={category}>{category}</option>
						{/each}
					</select>
				</div>

				<!-- Chunking Configuration -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							Chunk Size (characters)
						</label>
						<input
							type="number"
							bind:value={chunkSize}
							min="100"
							max="2000"
							step="50"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
						/>
						<p class="text-xs text-gray-500 mt-1">Recommended: 300-800</p>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							Chunk Overlap (characters)
						</label>
						<input
							type="number"
							bind:value={chunkOverlap}
							min="0"
							max="500"
							step="25"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
						/>
						<p class="text-xs text-gray-500 mt-1">Recommended: 50-150</p>
					</div>
				</div>

				<!-- Text Input -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						Text to Chunk <span class="text-red-500">*</span>
					</label>
					<textarea
						bind:value={inputText}
						rows="12"
						placeholder="Paste your text here... (supports markdown)"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
					></textarea>
					<p class="text-xs text-gray-500 mt-1">
						{inputText.length} characters • Will generate ~{Math.ceil(
							inputText.length / chunkSize
						)} chunks
					</p>
				</div>

				<!-- Actions -->
				<div class="flex justify-end">
					<button
						on:click={generateChunks}
						disabled={!canProceedStep1 || isGenerating}
						class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
					>
						{#if isGenerating}
							<Spinner size="sm" />
							Generating...
						{:else}
							Generate Chunks
						{/if}
					</button>
				</div>
			</div>
		</Card>
	{/if}

	<!-- Step 2: Preview & Edit -->
	{#if currentStep === 2}
		<Card title="Step 2: Preview & Edit Chunks">
			<div class="space-y-4">
				<!-- Toolbar -->
				<div class="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
					<div class="text-sm text-gray-600">
						<span class="font-semibold">{chunks.length}</span> chunks generated
						{#if selectedChunks.size > 0}
							• <span class="font-semibold">{selectedChunks.size}</span> selected
						{/if}
					</div>
					<div class="flex gap-2">
						{#if selectedChunks.size >= 2}
							<button
								on:click={mergeSelectedChunks}
								class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
							>
								Merge Selected
							</button>
						{/if}
						<button
							on:click={() => (currentStep = 1)}
							class="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
						>
							Back
						</button>
						<button
							on:click={saveAllChunks}
							disabled={!canProceedStep2 || isSaving}
							class="px-6 py-1 text-sm bg-primary text-white rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
						>
							{#if isSaving}
								<Spinner size="sm" />
								Saving...
							{:else}
								Save All Chunks
							{/if}
						</button>
					</div>
				</div>

				<!-- Chunks List -->
				<div class="space-y-3">
					{#each chunks as chunk, i}
						<div class="relative">
							<label class="absolute top-4 left-4 flex items-center">
								<input
									type="checkbox"
									checked={selectedChunks.has(chunk.id)}
									on:change={() => toggleChunkSelection(chunk.id)}
									class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
								/>
							</label>
							<div class="pl-10">
								<ChunkPreview
									{chunk}
									index={i}
									onEdit={editChunk}
									onDelete={deleteChunk}
									onSplit={splitChunk}
								/>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</Card>
	{/if}

	<!-- Step 3: Complete -->
	{#if currentStep === 3 && saveResult}
		<Card title="Step 3: Complete!">
			<div class="text-center space-y-4 py-8">
				<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
					<svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				</div>

				<h2 class="text-2xl font-bold text-text-dark">Successfully Created!</h2>

				<p class="text-gray-600">
					{saveResult.count} knowledge chunks have been created and embedded.
				</p>

				<div class="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
					<h3 class="font-semibold text-gray-700 mb-2">Created Entries:</h3>
					<div class="space-y-1 text-sm text-gray-600 max-h-48 overflow-y-auto">
						{#each saveResult.entries as entry}
							<div class="flex items-center gap-2">
								<svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
								<span class="truncate">{entry.title}</span>
							</div>
						{/each}
					</div>
				</div>

				<div class="flex gap-3 justify-center pt-4">
					<button
						on:click={resetWizard}
						class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
					>
						Create More Chunks
					</button>
					<button
						on:click={goToKnowledgeBase}
						class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-purple-700"
					>
						View Knowledge Base
					</button>
				</div>
			</div>
		</Card>
	{/if}
</div>

<!-- Edit Modal -->
{#if editingChunk}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
		on:click={cancelChunkEdit}
	>
		<div
			class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
			on:click|stopPropagation
		>
			<div class="p-6 space-y-4">
				<h2 class="text-xl font-bold text-text-dark">Edit Chunk</h2>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
					<input
						type="text"
						bind:value={editingChunk.title}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Content</label>
					<textarea
						bind:value={editingChunk.content}
						rows="10"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
					></textarea>
					<p class="text-xs text-gray-500 mt-1">{editingChunk.content.length} characters</p>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
					<input
						type="text"
						bind:value={editingChunk.keywords}
						placeholder="yoga, meditation, breathing (comma-separated)"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>

				<div class="flex justify-end gap-2 pt-4">
					<button
						on:click={cancelChunkEdit}
						class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
					>
						Cancel
					</button>
					<button
						on:click={saveChunkEdit}
						class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-purple-700"
					>
						Save Changes
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
