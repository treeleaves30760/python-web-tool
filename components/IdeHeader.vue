<template>
	<div class="ide-header">
		<h1 class="ide-title">Python Web IDE</h1>
		<div class="ide-actions">
			<div class="run-controls">
				<button
					class="run-button"
					:disabled="isRunning || isLoading"
					@click="$emit('runCode', debugLevel)"
				>
					{{ isRunning ? "執行中..." : "執行程式碼" }}
				</button>

				<div class="debug-level-selector">
					<button
						class="debug-toggle"
						:disabled="isRunning || isLoading"
						:class="{ active: showDebugDropdown }"
						@click="toggleDebugDropdown"
					>
						▼
					</button>

					<div v-show="showDebugDropdown" class="debug-dropdown">
						<div
							v-for="option in debugOptions"
							:key="option.value"
							class="debug-option"
							:class="{ active: debugLevel === option.value }"
							@click="selectDebugLevel(option.value)"
						>
							<span class="debug-label">{{ option.label }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	import { ref, onMounted, onUnmounted } from "vue";

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

	const showDebugDropdown = ref(false);
	const debugLevel = ref("print"); // 預設只顯示print輸出

	const debugOptions = [
		{
			value: "print",
			label: "僅Print輸出",
			description: "只顯示程式碼的print輸出",
		},
		{
			value: "basic",
			label: "基本資訊",
			description: "顯示print輸出和基本執行資訊",
		},
		{
			value: "detailed",
			label: "詳細資訊",
			description: "顯示模組載入和執行過程",
		},
		{
			value: "full",
			label: "完整Debug",
			description: "顯示所有debug訊息和系統資訊",
		},
	];

	const toggleDebugDropdown = () => {
		showDebugDropdown.value = !showDebugDropdown.value;
	};

	const selectDebugLevel = (level) => {
		debugLevel.value = level;
		showDebugDropdown.value = false;
	};

	// 點擊外部關閉下拉選單
	const handleClickOutside = (event) => {
		const selector = document.querySelector(".debug-level-selector");
		if (selector && !selector.contains(event.target)) {
			showDebugDropdown.value = false;
		}
	};

	onMounted(() => {
		document.addEventListener("click", handleClickOutside);
	});

	onUnmounted(() => {
		document.removeEventListener("click", handleClickOutside);
	});
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

	.run-controls {
		display: flex;
		align-items: center;
		gap: 0;
	}

	.run-button,
	.debug-toggle {
		background: #0e639c;
		color: white;
		border: none;
		padding: 6px 14px;
		font-size: 13px;
		line-height: 1.5;
		height: 34px;
		box-sizing: border-box;
		transition: background 0.2s;
		cursor: pointer;
		display: flex;
		align-items: center;
	}

	.run-button {
		border-top-left-radius: 3px;
		border-bottom-left-radius: 3px;
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
		border-right: 1px solid rgba(255, 255, 255, 0.15);
	}

	.debug-toggle {
		border-top-right-radius: 3px;
		border-bottom-right-radius: 3px;
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
		border-left: none;
		min-width: 34px;
		justify-content: center;
		padding-left: 10px;
		padding-right: 10px;
	}

	.run-button:hover:not(:disabled),
	.debug-toggle:hover:not(:disabled),
	.debug-toggle.active {
		background: #1177bb;
	}

	.run-button:disabled,
	.debug-toggle:disabled {
		background: #666;
		cursor: not-allowed;
	}

	.debug-level-selector {
		position: relative;
		display: inline-block;
	}

	.debug-dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		background: #2d2d30;
		border: 1px solid #3e3e42;
		border-radius: 3px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		z-index: 1000;
		min-width: 250px;
		margin-top: 2px;
	}

	.debug-option {
		display: flex;
		align-items: center;
		padding: 8px 12px;
		cursor: pointer;
		transition: background 0.2s;
		border-bottom: 1px solid #3e3e42;
		gap: 8px;
	}

	.debug-option:last-child {
		border-bottom: none;
	}

	.debug-option:hover {
		background: #37373d;
	}

	.debug-option.active {
		background: #0e639c;
	}

	.debug-icon {
		font-size: 14px;
		width: 20px;
		text-align: center;
		flex-shrink: 0;
	}

	.debug-label {
		font-weight: 500;
		color: #d4d4d4;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.debug-desc {
		font-size: 11px;
		color: #999;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.debug-option.active .debug-label,
	.debug-option.active .debug-desc {
		color: white;
	}
</style>
