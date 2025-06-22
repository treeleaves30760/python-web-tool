<template>
	<div class="ide-header">
		<h1 class="ide-title">Python Web IDE</h1>
		<div class="ide-actions">
			<button
				class="run-button"
				:disabled="isRunning || isLoading"
				@click="$emit('runCode')"
			>
				{{ isRunning ? "執行中..." : "執行程式碼" }}
			</button>
		</div>
	</div>
</template>

<script setup>
	defineProps({
		isRunning: {
			type: Boolean,
			required: true,
		},
		isLoading: {
			type: Boolean,
			required: true,
		},
	});

	defineEmits(["runCode"]);
</script>

<style scoped>
	.ide-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 16px;
		background: #2d2d30;
		border-bottom: 1px solid #3e3e42;
	}

	.ide-title {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
		color: #d4d4d4;
	}

	.run-button {
		background: #0e639c;
		color: white;
		border: none;
		padding: 6px 12px;
		border-radius: 3px;
		cursor: pointer;
		font-size: 12px;
		transition: background 0.2s;
	}

	.run-button:hover:not(:disabled) {
		background: #1177bb;
	}

	.run-button:disabled {
		background: #666;
		cursor: not-allowed;
	}
</style>
