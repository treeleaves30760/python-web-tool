<template>
	<div class="file-explorer">
		<div class="explorer-header">
			<h3>檔案管理</h3>
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
		<div class="explorer-actions">
			<button class="add-file-btn" @click="$emit('addNewFile')">
				📄 新增檔案
			</button>
			<button class="add-folder-btn" @click="$emit('addNewFolder')">
				📁 新增資料夾
			</button>
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
		width: 250px;
		background: #252526;
		border-right: 1px solid #3e3e42;
		display: flex;
		flex-direction: column;
	}

	.explorer-header {
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

	.file-list {
		flex: 1;
		overflow-y: auto;
	}

	.explorer-actions {
		padding: 8px;
		border-top: 1px solid #3e3e42;
		background: #2d2d30;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.add-file-btn,
	.add-folder-btn {
		background: #0e639c;
		border: none;
		color: #fff;
		padding: 6px 8px;
		border-radius: 3px;
		cursor: pointer;
		font-size: 12px;
		transition: background 0.2s;
	}

	.add-file-btn:hover,
	.add-folder-btn:hover {
		background: #1177bb;
	}

	.add-folder-btn {
		background: #6f42c1;
	}

	.add-folder-btn:hover {
		background: #8b5cf6;
	}
</style>
