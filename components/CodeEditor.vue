<template>
	<div class="code-editor">
		<div v-if="openFiles.length > 0" class="editor-tabs">
			<div
				v-for="file in openFiles"
				:key="file.id"
				class="tab"
				:class="{ active: currentFileId === file.id }"
				@click="$emit('selectFile', file.id)"
			>
				<input
					v-if="editingItemId === file.id"
					:value="editingItemName"
					class="tab-name-input"
					@input="$emit('updateEditingItemName', $event.target.value)"
					@blur="$emit('finishRename', file.id, editingItemName)"
					@keydown.enter="$emit('finishRename', file.id, editingItemName)"
					@keydown.esc="$emit('cancelRename')"
					@click.stop
				/>
				<span v-else class="tab-name" @dblclick="$emit('startRename', file.id)">
					{{ file.name }}
					<span v-if="file.path !== file.name" class="file-path">{{
						file.path
					}}</span>
				</span>
				<div class="tab-actions">
					<button
						class="tab-edit-btn"
						title="重新命名"
						@click.stop="$emit('startRename', file.id)"
					>
						<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
							/>
						</svg>
					</button>
					<button
						class="tab-close"
						title="關閉檔案"
						@click.stop="$emit('closeFile', file.id)"
					>
						<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
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
		openFiles: {
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
		"closeFile",
		"startRename",
		"finishRename",
		"cancelRename",
		"updateEditingItemName",
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
		max-width: 200px;
		min-width: 120px;
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
		display: flex;
		align-items: center;
		gap: 4px;
		overflow: hidden;
	}

	.file-icon {
		font-size: 12px;
		flex-shrink: 0;
	}

	.file-path {
		font-size: 11px;
		color: #999;
		margin-left: 4px;
		opacity: 0.7;
		overflow: hidden;
		text-overflow: ellipsis;
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
		flex-shrink: 0;
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
