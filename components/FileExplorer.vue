<template>
	<div class="file-explorer" @move-item="handleMoveItem">
		<div class="explorer-header">
			<h3>檔案管理</h3>
			<div class="explorer-header-actions">
				<button
					class="icon-btn"
					:title="getNewFileTooltip()"
					@click="$emit('addNewFile')"
				>
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
					:title="getNewFolderTooltip()"
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
		<div class="file-list" :class="{ 'root-dragover': isRootDragOver }">
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
				@move-item="handleMoveItem"
				@dragover.stop
				@drop.stop
			/>

			<!-- 拖到根目錄的空白區域 -->
			<div
				class="root-drop-zone"
				@dragover.prevent="onRootDragOver"
				@dragleave="onRootDragLeave"
				@drop.prevent="onRootDrop"
			></div>
		</div>
	</div>
</template>

<script setup>
	import FileTreeNode from "./FileTreeNode.vue";
	import { onMounted, ref } from "vue";

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

	const emit = defineEmits([
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
		"moveItem",
	]);

	const isRootDragOver = ref(false);

	function handleMoveItem({ fromId, toId }) {
		// emit 事件給父組件處理，而不是直接修改 props
		emit("moveItem", { fromId, toId });
	}

	function onRootDragOver(e) {
		// 只有在拖到空白區域時才顯示根目錄拖放效果
		if (
			e.target.classList.contains("root-drop-zone") ||
			e.target.classList.contains("file-list")
		) {
			isRootDragOver.value = true;
		}
	}

	function onRootDragLeave(e) {
		// 檢查是否真的離開了容器
		if (!e.currentTarget.contains(e.relatedTarget)) {
			isRootDragOver.value = false;
		}
	}

	function onRootDrop(e) {
		isRootDragOver.value = false;
		// 只有在拖到空白區域時才移動到根目錄
		if (
			e.target.classList.contains("root-drop-zone") ||
			(e.target.classList.contains("file-list") && fileTree.length === 0)
		) {
			const fromId = e.dataTransfer.getData("text/plain");
			if (fromId) {
				// 拖到根目錄，toId 設為 null
				emit("moveItem", { fromId, toId: null });
			}
		}
	}

	// 計算新增按鈕的提示文字
	function getNewFileTooltip() {
		if (!props.currentFileId) {
			return "新增檔案（在根目錄）";
		}

		const currentItem = findCurrentItem();
		if (!currentItem) {
			return "新增檔案（在根目錄）";
		}

		if (currentItem.type === "folder") {
			return `新增檔案（在 ${currentItem.name} 資料夾內）`;
		} else {
			const parent = findParentOfCurrentItem();
			if (parent) {
				return `新增檔案（在 ${parent.name} 資料夾內）`;
			} else {
				return "新增檔案（在根目錄）";
			}
		}
	}

	function getNewFolderTooltip() {
		if (!props.currentFileId) {
			return "新增資料夾（在根目錄）";
		}

		const currentItem = findCurrentItem();
		if (!currentItem) {
			return "新增資料夾（在根目錄）";
		}

		if (currentItem.type === "folder") {
			return `新增資料夾（在 ${currentItem.name} 資料夾內）`;
		} else {
			const parent = findParentOfCurrentItem();
			if (parent) {
				return `新增資料夾（在 ${parent.name} 資料夾內）`;
			} else {
				return "新增資料夾（在根目錄）";
			}
		}
	}

	function findCurrentItem() {
		function findById(id, tree) {
			for (const item of tree) {
				if (item.id === id) return item;
				if (item.type === "folder" && item.children) {
					const found = findById(id, item.children);
					if (found) return found;
				}
			}
			return null;
		}
		return findById(props.currentFileId, props.fileTree);
	}

	function findParentOfCurrentItem() {
		function findParent(targetId, tree, parent = null) {
			for (const item of tree) {
				if (item.id === targetId) return parent;
				if (item.type === "folder" && item.children) {
					const found = findParent(targetId, item.children, item);
					if (found !== null) return found;
				}
			}
			return null;
		}
		return findParent(props.currentFileId, props.fileTree);
	}

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
		transition: background 0.2s;
	}

	.file-list.root-dragover {
		background: rgba(0, 122, 204, 0.1);
	}

	.root-drop-zone {
		flex: 1;
		min-height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px dashed transparent;
		transition: all 0.2s;
		margin: 8px;
		border-radius: 4px;
		color: #666;
		font-size: 12px;
	}

	.file-list.root-dragover .root-drop-zone {
		border-color: #007acc;
		background: rgba(0, 122, 204, 0.1);
		color: #007acc;
	}

	.root-drop-zone::before {
		content: "拖放檔案到這裡移動到根目錄";
		opacity: 0;
		transition: opacity 0.2s;
	}

	.file-list.root-dragover .root-drop-zone::before {
		opacity: 1;
	}
</style>
