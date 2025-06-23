<template>
	<div class="output-panel" :class="{ collapsed: isOutputCollapsed }">
		<div class="output-header" @click="$emit('toggleOutput')">
			<h3>{{ isOutputCollapsed ? "" : "執行結果" }}</h3>
			<span class="collapse-icon">{{ isOutputCollapsed ? "◀" : "▶" }}</span>
		</div>
		<div v-show="!isOutputCollapsed" class="output-content">
			<pre v-if="output" class="output-text">{{ output }}</pre>
			<div v-else class="output-placeholder">點擊「執行程式碼」來查看結果</div>
		</div>
	</div>
</template>

<script setup>
	defineProps({
		output: {
			type: String,
			required: true,
		},
		isOutputCollapsed: {
			type: Boolean,
			required: true,
		},
	});

	defineEmits(["toggleOutput"]);
</script>

<style scoped>
	.output-panel {
		width: 100%;
		background: #1e1e1e;
		border-left: 1px solid #3e3e42;
		display: flex;
		flex-direction: column;
		transition: all 0.3s ease;
	}

	.output-panel.collapsed {
		min-width: 40px;
	}

	.output-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		background: #2d2d30;
		border-bottom: 1px solid #3e3e42;
		cursor: pointer;
		user-select: none;
	}

	.output-header h3 {
		margin: 0;
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		white-space: nowrap;
		color: #d4d4d4;
	}

	.collapse-icon {
		font-size: 12px;
		color: #d4d4d4;
	}

	.output-content {
		flex: 1;
		overflow: auto;
		padding: 12px;
	}

	.output-text {
		margin: 0;
		white-space: pre-wrap;
		font-family: "Consolas", "Monaco", "Courier New", monospace;
		font-size: 13px;
		line-height: 1.4;
		color: #d4d4d4;
	}

	.output-placeholder {
		color: #999;
		font-style: italic;
		font-size: 13px;
	}

	@media (max-width: 768px) {
		.output-panel {
			width: 100%;
			height: 200px;
		}

		.output-panel.collapsed {
			height: 40px;
			width: 100%;
		}
	}
</style>
