<template>
	<div class="file-explorer">
		<div class="explorer-header">
			<h3>檔案管理</h3>
		</div>
		<div class="file-list">
			<div
				v-for="(file, index) in files"
				:key="index"
				class="file-item"
				:class="{ active: currentFileIndex === index }"
				@click="$emit('selectFile', index)"
			>
				<span class="file-icon">📄</span>
				<input
					v-if="editingFileIndex === index"
					:value="editingFileName"
					@input="$emit('updateEditingFileName', $event.target.value)"
					class="file-name-input"
					@blur="$emit('finishRename', index)"
					@keydown.enter="$emit('finishRename', index)"
					@keydown.esc="$emit('cancelRename')"
					@click.stop
				/>
				<span v-else class="file-name" @dblclick="$emit('renameFile', index)">{{
					file.name
				}}</span>
				<div class="file-actions">
					<button
						class="edit-btn"
						@click.stop="$emit('startRename', index)"
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
						@click.stop="$emit('deleteFile', index)"
						title="刪除檔案"
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
		<div class="explorer-actions">
			<button class="add-file-btn" @click="$emit('addNewFile')">
				+ 新增檔案
			</button>
		</div>
	</div>
</template>

<script setup>
	defineProps({
		files: {
			type: Array,
			required: true,
		},
		currentFileIndex: {
			type: Number,
			required: true,
		},
		editingFileIndex: {
			type: Number,
			required: true,
		},
		editingFileName: {
			type: String,
			required: true,
		},
	});

	defineEmits([
		"selectFile",
		"addNewFile",
		"deleteFile",
		"renameFile",
		"startRename",
		"finishRename",
		"cancelRename",
		"updateEditingFileName",
	]);
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

	.file-item {
		display: flex;
		align-items: center;
		padding: 4px 12px;
		cursor: pointer;
		transition: background 0.2s;
		font-size: 13px;
		position: relative;
		color: #d4d4d4;
	}

	.file-item:hover {
		background: #2a2d2e;
	}

	.file-item.active {
		background: #37373d;
	}

	.file-icon {
		margin-right: 6px;
		font-size: 12px;
	}

	.file-name {
		flex: 1;
	}

	.file-name:hover {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		cursor: pointer;
	}

	.file-name-input {
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

	.file-name-input:focus {
		border-color: #1177bb;
		box-shadow: 0 0 0 1px #1177bb;
	}

	.edit-btn {
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

	.delete-btn:hover {
		color: #fff;
		background: #e81123;
	}

	.file-actions {
		display: flex;
		align-items: center;
		gap: 4px;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.file-item:hover .file-actions {
		opacity: 1;
	}

	.explorer-actions {
		padding: 8px;
		border-top: 1px solid #3e3e42;
	}

	.add-file-btn {
		width: 100%;
		background: #0e639c;
		color: white;
		border: none;
		padding: 6px;
		border-radius: 3px;
		cursor: pointer;
		font-size: 12px;
	}

	.add-file-btn:hover {
		background: #1177bb;
	}

	@media (max-width: 768px) {
		.file-explorer {
			width: 100%;
			height: 150px;
		}
	}
</style>
