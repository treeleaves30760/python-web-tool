<template>
	<div class="ide-container">
		<!-- 載入畫面 -->
		<div v-if="isLoading" class="loading-overlay">
			<div class="loading-content">
				<div class="loading-spinner"></div>
				<h2>Python Web IDE</h2>
				<p>{{ loadingMessage }}</p>
			</div>
		</div>

		<div class="ide-header">
			<h1 class="ide-title">Python Web IDE</h1>
			<div class="ide-actions">
				<button
					@click="runCode"
					class="run-button"
					:disabled="isRunning || isLoading"
				>
					{{ isRunning ? "執行中..." : "執行程式碼" }}
				</button>
			</div>
		</div>

		<div class="ide-body">
			<!-- 檔案管理區塊 -->
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
						@click="selectFile(index)"
					>
						<span class="file-icon">📄</span>
						<span class="file-name">{{ file.name }}</span>
						<button @click.stop="deleteFile(index)" class="delete-btn">
							×
						</button>
					</div>
				</div>
				<div class="explorer-actions">
					<button @click="addNewFile" class="add-file-btn">+ 新增檔案</button>
				</div>
			</div>

			<!-- 程式碼編輯區塊 -->
			<div class="code-editor">
				<div class="editor-tabs" v-if="files.length > 0">
					<div
						v-for="(file, index) in files"
						:key="index"
						class="tab"
						:class="{ active: currentFileIndex === index }"
						@click="selectFile(index)"
					>
						{{ file.name }}
						<button @click.stop="deleteFile(index)" class="tab-close">×</button>
					</div>
				</div>
				<div id="monaco-editor" class="monaco-editor-container"></div>
			</div>

			<!-- 執行結果區塊 -->
			<div class="output-panel" :class="{ collapsed: isOutputCollapsed }">
				<div class="output-header" @click="toggleOutput">
					<h3>執行結果</h3>
					<span class="collapse-icon">{{ isOutputCollapsed ? "▲" : "▼" }}</span>
				</div>
				<div class="output-content" v-show="!isOutputCollapsed">
					<pre v-if="output" class="output-text">{{ output }}</pre>
					<div v-else class="output-placeholder">
						點擊「執行程式碼」來查看結果
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	import { ref, onMounted, nextTick } from "vue";

	// 響應式數據
	const files = ref([
		{
			name: "main.py",
			content: `# 歡迎使用 Python Web IDE
print("Hello, World!")

# 計算範例
numbers = [1, 2, 3, 4, 5]
sum_numbers = sum(numbers)
print(f"數字總和: {sum_numbers}")

# 迴圈範例
for i in range(3):
    print(f"迴圈 {i + 1}")
`,
		},
	]);

	const currentFileIndex = ref(0);
	const output = ref("");
	const isRunning = ref(false);
	const isOutputCollapsed = ref(false);
	const isLoading = ref(true);
	const loadingMessage = ref("正在初始化編輯器...");

	let editor = null;
	let pyodide = null;

	// 檔案操作
	const selectFile = (index) => {
		if (editor && currentFileIndex.value !== -1) {
			files.value[currentFileIndex.value].content = editor.getValue();
		}
		currentFileIndex.value = index;
		if (editor) {
			editor.setValue(files.value[index].content);
		}
	};

	const addNewFile = () => {
		const fileName = prompt(
			"請輸入檔案名稱:",
			`file${files.value.length + 1}.py`
		);
		if (fileName) {
			files.value.push({
				name: fileName,
				content: '# 新檔案\nprint("新檔案已建立")\n',
			});
			selectFile(files.value.length - 1);
		}
	};

	const deleteFile = (index) => {
		if (files.value.length <= 1) {
			alert("至少需要保留一個檔案");
			return;
		}

		if (confirm("確定要刪除這個檔案嗎？")) {
			files.value.splice(index, 1);
			if (currentFileIndex.value >= files.value.length) {
				currentFileIndex.value = files.value.length - 1;
			}
			if (editor) {
				editor.setValue(files.value[currentFileIndex.value].content);
			}
		}
	};

	// 輸出面板
	const toggleOutput = () => {
		isOutputCollapsed.value = !isOutputCollapsed.value;
	};

	// 執行 Python 程式碼
	const runCode = async () => {
		if (isRunning.value || !pyodide) return;

		isRunning.value = true;
		output.value = "";

		try {
			// 保存當前編輯器內容
			if (editor) {
				files.value[currentFileIndex.value].content = editor.getValue();
			}

			const code = files.value[currentFileIndex.value].content;

			// 重定向 Python 的 stdout
			pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
    `);

			// 執行用戶程式碼
			pyodide.runPython(code);

			// 獲取輸出
			const stdout = pyodide.runPython("sys.stdout.getvalue()");
			output.value = stdout || "程式執行完成，無輸出";

			// 確保輸出面板展開
			if (isOutputCollapsed.value) {
				isOutputCollapsed.value = false;
			}
		} catch (error) {
			output.value = `錯誤: ${error.message}`;
		} finally {
			isRunning.value = false;
		}
	};

	// 初始化 Monaco Editor
	const initMonacoEditor = async () => {
		try {
			// 確保只在客戶端運行
			if (import.meta.server) return;

			const editorElement = document.getElementById("monaco-editor");
			if (!editorElement) {
				console.error("Monaco editor container not found");
				return;
			}

			const monaco = await import("monaco-editor");

			// 配置 Monaco Editor
			monaco.editor.setTheme("vs-dark");

			editor = monaco.editor.create(editorElement, {
				value: files.value[currentFileIndex.value].content,
				language: "python",
				theme: "vs-dark",
				automaticLayout: true,
				minimap: { enabled: false },
				fontSize: 14,
				lineNumbers: "on",
				scrollBeyondLastLine: false,
				wordWrap: "on",
			});

			// 監聽編輯器內容變化
			editor.onDidChangeModelContent(() => {
				if (currentFileIndex.value !== -1) {
					files.value[currentFileIndex.value].content = editor.getValue();
				}
			});

			console.log("Monaco Editor 初始化完成");
		} catch (error) {
			console.error("Monaco Editor 初始化失敗:", error);
		}
	};

	// 初始化 Pyodide
	const initPyodide = async () => {
		try {
			// 確保只在客戶端運行
			if (import.meta.server) return;

			loadingMessage.value = "正在載入 Python 引擎...";
			console.log("開始載入 Pyodide...");
			const { loadPyodide } = await import("pyodide");
			pyodide = await loadPyodide({
				indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/",
			});
			console.log("Pyodide 初始化完成");
		} catch (error) {
			console.error("Pyodide 初始化失敗:", error);
			output.value = "錯誤: Python 引擎初始化失敗，請檢查網路連線";
		}
	};

	// 組件掛載
	onMounted(async () => {
		await nextTick();
		try {
			await Promise.all([initMonacoEditor(), initPyodide()]);
			loadingMessage.value = "初始化完成！";
			setTimeout(() => {
				isLoading.value = false;
			}, 500);
		} catch (error) {
			console.error("初始化失敗:", error);
			loadingMessage.value = "初始化失敗，請重新整理頁面";
		}
	});
</script>

<style scoped>
	.ide-container {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #1e1e1e;
		color: #d4d4d4;
		font-family: "Consolas", "Monaco", "Courier New", monospace;
	}

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
	}

	.run-button {
		background: #0e639c;
		color: white;
		border: none;
		padding: 6px 12px;
		border-radius: 3px;
		cursor: pointer;
		font-size: 12px;
		transition: background 0.2s;
	}

	.run-button:hover:not(:disabled) {
		background: #1177bb;
	}

	.run-button:disabled {
		background: #666;
		cursor: not-allowed;
	}

	.ide-body {
		flex: 1;
		display: flex;
		min-height: 0;
	}

	/* 檔案管理區塊 */
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

	.delete-btn {
		background: none;
		border: none;
		color: #999;
		cursor: pointer;
		padding: 2px 4px;
		font-size: 16px;
		line-height: 1;
	}

	.delete-btn:hover {
		color: #fff;
		background: #e81123;
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

	/* 程式碼編輯區塊 */
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
	}

	.tab.active {
		background: #1e1e1e;
	}

	.tab:hover {
		background: #37373d;
	}

	.tab-close {
		background: none;
		border: none;
		color: #999;
		cursor: pointer;
		margin-left: 6px;
		padding: 0 2px;
		font-size: 14px;
	}

	.tab-close:hover {
		color: #fff;
	}

	.monaco-editor-container {
		flex: 1;
		min-height: 0;
	}

	/* 執行結果區塊 */
	.output-panel {
		width: 300px;
		background: #1e1e1e;
		border-left: 1px solid #3e3e42;
		display: flex;
		flex-direction: column;
		transition: width 0.3s ease;
	}

	.output-panel.collapsed {
		width: 40px;
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
	}

	.collapse-icon {
		font-size: 12px;
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
	}

	.output-placeholder {
		color: #999;
		font-style: italic;
		font-size: 13px;
	}

	/* 載入畫面 */
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

	/* 響應式設計 */
	@media (max-width: 768px) {
		.ide-body {
			flex-direction: column;
		}

		.file-explorer {
			width: 100%;
			height: 150px;
		}

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
