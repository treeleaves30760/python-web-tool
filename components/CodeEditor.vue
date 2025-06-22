<template>
	<div class="code-editor">
		<div v-if="files.length > 0" class="editor-tabs">
			<div
				v-for="(file, index) in files"
				:key="index"
				class="tab"
				:class="{ active: currentFileIndex === index }"
				@click="$emit('selectFile', index)"
			>
				<input
					v-if="editingFileIndex === index"
					:value="editingFileName"
					@input="$emit('updateEditingFileName', $event.target.value)"
					class="tab-name-input"
					@blur="$emit('finishRename', index)"
					@keydown.enter="$emit('finishRename', index)"
					@keydown.esc="$emit('cancelRename')"
					@click.stop
				/>
				<span v-else class="tab-name" @dblclick="$emit('renameFile', index)">{{
					file.name
				}}</span>
				<div class="tab-actions">
					<button
						class="tab-edit-btn"
						@click.stop="$emit('startRename', index)"
						title="重新命名"
					>
						<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
							/>
						</svg>
					</button>
					<button
						class="tab-close"
						@click.stop="$emit('deleteFile', index)"
						title="關閉檔案"
					>
						<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
		<div id="monaco-editor" class="monaco-editor-container" />
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
		"deleteFile",
		"renameFile",
		"startRename",
		"finishRename",
		"cancelRename",
		"updateEditingFileName",
	]);
</script>

<style scoped>
	.code-editor {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.editor-tabs {
		display: flex;
		background: #2d2d30;
		border-bottom: 1px solid #3e3e42;
		overflow-x: auto;
	}

	.tab {
		display: flex;
		align-items: center;
		padding: 8px 12px;
		background: #2d2d30;
		border-right: 1px solid #3e3e42;
		cursor: pointer;
		font-size: 13px;
		white-space: nowrap;
		gap: 6px;
		color: #d4d4d4;
	}

	.tab.active {
		background: #1e1e1e;
	}

	.tab:hover {
		background: #37373d;
	}

	.tab-name {
		flex: 1;
		padding: 2px 4px;
		border-radius: 3px;
		transition: background 0.2s ease;
	}

	.tab-name:hover {
		background: rgba(255, 255, 255, 0.1);
		cursor: pointer;
	}

	.tab-actions {
		display: flex;
		align-items: center;
		gap: 2px;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.tab:hover .tab-actions {
		opacity: 1;
	}

	.tab-edit-btn {
		background: none;
		border: none;
		color: #999;
		cursor: pointer;
		padding: 3px;
		border-radius: 3px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.tab-edit-btn:hover {
		color: #fff;
		background: #0e639c;
	}

	.tab-close {
		background: none;
		border: none;
		color: #999;
		cursor: pointer;
		padding: 3px;
		border-radius: 3px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.tab-close:hover {
		color: #fff;
		background: #e81123;
	}

	.tab-name-input {
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

	.tab-name-input:focus {
		border-color: #1177bb;
		box-shadow: 0 0 0 1px #1177bb;
	}

	.monaco-editor-container {
		flex: 1;
		min-height: 0;
	}
</style>
