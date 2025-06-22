<template>
	<div v-if="isLoading" class="loading-overlay">
		<div class="loading-content">
			<div class="loading-spinner" />
			<h2>Python Web IDE</h2>
			<p>{{ loadingMessage }}</p>
		</div>
	</div>
</template>

<script setup>
	defineProps({
		isLoading: {
			type: Boolean,
			required: true,
		},
		loadingMessage: {
			type: String,
			required: true,
		},
	});
</script>

<style scoped>
	.loading-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: #1e1e1e;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
	}

	.loading-content {
		text-align: center;
		color: #d4d4d4;
	}

	.loading-content h2 {
		margin: 20px 0 10px 0;
		font-size: 24px;
		font-weight: 600;
	}

	.loading-content p {
		margin: 0;
		font-size: 14px;
		color: #999;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #333;
		border-top: 3px solid #0e639c;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
