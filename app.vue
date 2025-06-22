<template>
	<div class="ide-container">
		<LoadingOverlay :is-loading="isLoading" :loading-message="loadingMessage" />

		<IdeHeader
			:is-running="isRunning"
			:is-loading="isLoading"
			@run-code="runCode"
		/>

		<div class="ide-body">
			<FileExplorer
				:files="files"
				:current-file-index="currentFileIndex"
				:editing-file-index="editingFileIndex"
				:editing-file-name="editingFileName"
				@select-file="selectFile"
				@add-new-file="addNewFile"
				@delete-file="deleteFile"
				@rename-file="renameFile"
				@start-rename="startRename"
				@finish-rename="finishRename"
				@cancel-rename="cancelRename"
				@update-editing-file-name="updateEditingFileName"
			/>

			<CodeEditor
				:files="files"
				:current-file-index="currentFileIndex"
				:editing-file-index="editingFileIndex"
				:editing-file-name="editingFileName"
				@select-file="selectFile"
				@delete-file="deleteFile"
				@rename-file="renameFile"
				@start-rename="startRename"
				@finish-rename="finishRename"
				@cancel-rename="cancelRename"
				@update-editing-file-name="updateEditingFileName"
			/>

			<OutputPanel
				:output="output"
				:is-output-collapsed="isOutputCollapsed"
				@toggle-output="toggleOutput"
			/>
		</div>
	</div>
</template>

<script setup>
	import { ref, onMounted, nextTick } from "vue";
	import { useLocalStorage } from "@vueuse/core";

	// 響應式數據 - 使用 localStorage 持久化
	const files = useLocalStorage("python-ide-files", [
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

	const currentFileIndex = useLocalStorage("python-ide-current-file", 0);
	const output = ref("");
	const isRunning = ref(false);
	const isOutputCollapsed = ref(false);
	const isLoading = ref(true);
	const loadingMessage = ref("正在初始化編輯器...");
	const editingFileIndex = ref(-1);
	const editingFileName = ref("");

	let editor = null;
	let pyodide = null;

	// 檔案操作
	const selectFile = (index) => {
		if (editor && currentFileIndex.value !== -1) {
			// 自動保存當前檔案內容到 localStorage
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

	const renameFile = (index) => {
		const newName = prompt("請輸入新的檔案名稱:", files.value[index].name);
		if (newName) {
			files.value[index].name = newName;
		}
	};

	const startRename = (index) => {
		editingFileIndex.value = index;
		editingFileName.value = files.value[index].name;
		nextTick(() => {
			const input = document.querySelector(".file-name-input, .tab-name-input");
			if (input) {
				input.focus();
				input.select();
			}
		});
	};

	const finishRename = (index) => {
		if (
			editingFileName.value.trim() &&
			editingFileName.value !== files.value[index].name
		) {
			files.value[index].name = editingFileName.value.trim();
		}
		editingFileIndex.value = -1;
		editingFileName.value = "";
	};

	const cancelRename = () => {
		editingFileIndex.value = -1;
		editingFileName.value = "";
	};

	const updateEditingFileName = (value) => {
		editingFileName.value = value;
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
					// 自動保存到 localStorage
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

	.ide-body {
		flex: 1;
		display: flex;
		min-height: 0;
	}

	/* 響應式設計 */
	@media (max-width: 768px) {
		.ide-body {
			flex-direction: column;
		}
	}
</style>
