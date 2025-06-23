<template>
	<div class="tree-node">
		<div
			class="tree-item"
			:class="{
				active: item.type === 'file' && currentFileId === item.id,
				folder: item.type === 'folder',
				dragover: isDragOver,
			}"
			:style="{ paddingLeft: level * 16 + 12 + 'px' }"
			@click="handleClick"
			draggable="true"
			@dragstart="onDragStart"
			@dragover.prevent="onDragOver"
			@dragleave="onDragLeave"
			@drop.prevent="onDrop"
		>
			<button
				v-if="item.type === 'folder'"
				class="folder-toggle"
				@click.stop="$emit('toggleFolder', item.id)"
			>
				<span class="folder-icon">{{ item.expanded ? "📂" : "📁" }}</span>
			</button>
			<span v-else class="file-icon">{{ getFileIcon(item.name) }}</span>

			<input
				v-if="editingItemId === item.id"
				:value="editingItemName"
				@input="$emit('updateEditingItemName', $event.target.value)"
				class="item-name-input"
				@blur="$emit('finishRename', item.id, editingItemName)"
				@keydown.enter="$emit('finishRename', item.id, editingItemName)"
				@keydown.esc="$emit('cancelRename')"
				@click.stop
				ref="nameInput"
			/>
			<span
				v-else
				class="item-name"
				@dblclick="$emit('startRename', item.id)"
				>{{ item.name }}</span
			>

			<div class="item-actions">
				<button
					class="edit-btn"
					@click.stop="$emit('startRename', item.id)"
					title="重新命名"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
						/>
					</svg>
				</button>
				<button
					class="delete-btn"
					@click.stop="$emit('deleteItem', item.id)"
					:title="item.type === 'folder' ? '刪除資料夾' : '刪除檔案'"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
						/>
					</svg>
				</button>
			</div>
		</div>

		<div
			v-if="item.type === 'folder' && item.expanded && item.children"
			class="folder-children"
		>
			<FileTreeNode
				v-for="child in item.children"
				:key="child.id"
				:item="child"
				:level="level + 1"
				:current-file-id="currentFileId"
				:editing-item-id="editingItemId"
				:editing-item-name="editingItemName"
				@select-file="$emit('selectFile', $event)"
				@select-folder="$emit('selectFolder', $event)"
				@start-rename="$emit('startRename', $event)"
				@finish-rename="$emit('finishRename', $event, editingItemName)"
				@cancel-rename="$emit('cancelRename')"
				@update-editing-item-name="$emit('updateEditingItemName', $event)"
				@delete-item="$emit('deleteItem', $event)"
				@toggle-folder="$emit('toggleFolder', $event)"
				@move-item="$emit('moveItem', $event)"
			/>
		</div>
	</div>
</template>

<script setup>
	import { ref } from "vue";
	const props = defineProps({
		item: {
			type: Object,
			required: true,
		},
		level: {
			type: Number,
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
		"startRename",
		"finishRename",
		"cancelRename",
		"updateEditingItemName",
		"deleteItem",
		"toggleFolder",
		"moveItem",
	]);

	const isDragOver = ref(false);

	function onDragStart(e) {
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/plain", props.item.id);
	}

	function onDragOver(_e) {
		isDragOver.value = true;
	}

	function onDragLeave(_e) {
		isDragOver.value = false;
	}

	function onDrop(e) {
		isDragOver.value = false;
		const fromId = e.dataTransfer.getData("text/plain");
		if (fromId && fromId !== props.item.id) {
			emit("moveItem", { fromId, toId: props.item.id });
		}
	}

	const handleClick = () => {
		if (props.item.type === "file") {
			emit("selectFile", props.item.id);
		} else {
			emit("selectFolder", props.item.id);
		}
	};

	const getFileIcon = (filename) => {
		const ext = filename.split(".").pop()?.toLowerCase();
		switch (ext) {
			case "py":
				return "🐍";
			case "js":
				return "📜";
			case "html":
				return "🌐";
			case "css":
				return "🎨";
			case "json":
				return "📋";
			case "md":
				return "📝";
			case "txt":
				return "📄";
			default:
				return "📄";
		}
	};
</script>

<style scoped>
	.tree-node {
		user-select: none;
	}

	.tree-item {
		display: flex;
		align-items: center;
		cursor: pointer;
		transition: background 0.2s;
		font-size: 13px;
		position: relative;
		color: #d4d4d4;
		min-height: 24px;
	}

	.tree-item:hover {
		background: #2a2d2e;
	}

	.tree-item.active {
		background: #37373d;
	}

	.tree-item.folder {
		font-weight: 500;
	}

	.tree-item.dragover {
		background: #007acc !important;
		color: #fff;
	}

	.folder-toggle {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		padding: 2px;
		margin-right: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.folder-icon {
		font-size: 12px;
	}

	.file-icon {
		margin-right: 6px;
		font-size: 12px;
		margin-left: 18px;
	}

	.item-name {
		flex: 1;
		padding: 2px 4px;
		border-radius: 3px;
		transition: background 0.2s ease;
	}

	.item-name:hover {
		background: rgba(255, 255, 255, 0.1);
		cursor: pointer;
	}

	.item-name-input {
		flex: 1;
		background: #1e1e1e;
		border: 1px solid #0e639c;
		color: #d4d4d4;
		padding: 2px 4px;
		border-radius: 3px;
		font-size: 13px;
		font-family: inherit;
		outline: none;
	}

	.item-name-input:focus {
		border-color: #1177bb;
		box-shadow: 0 0 0 1px #1177bb;
	}

	.item-actions {
		display: flex;
		align-items: center;
		gap: 2px;
		opacity: 0;
		transition: opacity 0.2s ease;
		margin-right: 8px;
	}

	.tree-item:hover .item-actions {
		opacity: 1;
	}

	.edit-btn,
	.delete-btn {
		background: none;
		border: none;
		color: #999;
		cursor: pointer;
		padding: 4px;
		border-radius: 3px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.edit-btn:hover {
		color: #fff;
		background: #0e639c;
	}

	.delete-btn:hover {
		color: #fff;
		background: #e81123;
	}

	.folder-children {
		background: rgba(0, 0, 0, 0.1);
	}
</style>
