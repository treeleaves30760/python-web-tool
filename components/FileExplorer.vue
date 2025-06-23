<template>
	<div class="file-explorer">
		<div class="explorer-header">
			<h3>檔案管理</h3>
			<div class="explorer-header-actions">
				<button class="icon-btn" title="新增檔案" @click="$emit('addNewFile')">
					<svg
						class="icon"
						width="18"
						height="18"
						viewBox="0 0 20 20"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect x="3" y="2" width="12" height="16" rx="2" fill="#4FC3F7" />
						<rect x="7" y="8.5" width="4" height="1" rx="0.5" fill="#fff" />
						<rect x="9.5" y="6" width="1" height="4" rx="0.5" fill="#fff" />
					</svg>
				</button>
				<button
					class="icon-btn"
					title="新增資料夾"
					@click="$emit('addNewFolder')"
				>
					<svg
						class="icon"
						width="18"
						height="18"
						viewBox="0 0 20 20"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect x="2" y="6" width="16" height="10" rx="2" fill="#FFD54F" />
						<rect x="9" y="10.5" width="4" height="1" rx="0.5" fill="#fff" />
						<rect x="11.5" y="8" width="1" height="4" rx="0.5" fill="#fff" />
						<rect x="2" y="4" width="6" height="4" rx="1" fill="#FFE082" />
					</svg>
				</button>
			</div>
		</div>
		<div class="file-list">
			<!-- 調試資訊 -->
			<div
				v-if="!fileTree || fileTree.length === 0"
				style="color: #999; padding: 12px; font-size: 12px"
			>
				沒有檔案資料 (fileTree: {{ fileTree }})
			</div>

			<FileTreeNode
				v-for="item in fileTree"
				:key="item.id"
				:item="item"
				:level="0"
				:current-file-id="currentFileId"
				:editing-item-id="editingItemId"
				:editing-item-name="editingItemName"
				@select-file="(id) => $emit('selectFile', id)"
				@select-folder="(id) => $emit('selectFolder', id)"
				@start-rename="(id) => $emit('startRename', id)"
				@finish-rename="(id, newName) => $emit('finishRename', id, newName)"
				@cancel-rename="$emit('cancelRename')"
				@update-editing-item-name="
					(name) => $emit('updateEditingItemName', name)
				"
				@delete-item="(id) => $emit('deleteItem', id)"
				@toggle-folder="(id) => $emit('toggleFolder', id)"
			/>
		</div>
	</div>
</template>

<script setup>
	import FileTreeNode from "./FileTreeNode.vue";
	import { onMounted } from "vue";

	const props = defineProps({
		fileTree: {
			type: Array,
			required: true,
		},
		currentFileId: {
			type: String,
			required: true,
		},
		editingItemId: {
			type: String,
			required: true,
		},
		editingItemName: {
			type: String,
			required: true,
		},
	});

	defineEmits([
		"selectFile",
		"selectFolder",
		"addNewFile",
		"addNewFolder",
		"deleteItem",
		"startRename",
		"finishRename",
		"cancelRename",
		"updateEditingItemName",
		"toggleFolder",
	]);

	// Debug: 檢查接收到的 props
	onMounted(() => {
		console.log("FileExplorer - fileTree prop:", props.fileTree);
		console.log("FileExplorer - fileTree length:", props.fileTree?.length);
	});
</script>

<style scoped>
	.file-explorer {
		width: 100%;
		background: #252526;
		border-right: 1px solid #3e3e42;
		display: flex;
		flex-direction: column;
	}

	.explorer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		background: #2d2d30;
		border-bottom: 1px solid #3e3e42;
	}

	.explorer-header h3 {
		margin: 0;
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		color: #d4d4d4;
	}

	.explorer-header-actions {
		display: flex;
		gap: 4px;
	}

	.icon-btn {
		background: transparent;
		border: none;
		padding: 2px 6px;
		border-radius: 3px;
		cursor: pointer;
		transition: background 0.2s;
		display: flex;
		align-items: center;
		font-size: 16px;
	}
	.icon-btn:hover {
		background: #37373d;
	}
	.icon {
		display: block;
		font-size: 18px;
		pointer-events: none;
	}

	.file-list {
		flex: 1;
		overflow-y: auto;
	}
</style>
