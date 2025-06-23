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
				:file-tree="fileTree"
				:current-file-id="currentFileId"
				:editing-item-id="editingItemId"
				:editing-item-name="editingItemName"
				@select-file="selectFile"
				@select-folder="selectFolder"
				@add-new-file="addNewFile"
				@add-new-folder="addNewFolder"
				@delete-item="deleteItem"
				@start-rename="startRename"
				@finish-rename="finishRename"
				@cancel-rename="cancelRename"
				@update-editing-item-name="updateEditingItemName"
				@toggle-folder="toggleFolder"
			/>

			<CodeEditor
				:open-files="openFiles"
				:current-file-id="currentFileId"
				:editing-item-id="editingItemId"
				:editing-item-name="editingItemName"
				@select-file="selectFile"
				@close-file="closeFile"
				@start-rename="startRename"
				@finish-rename="finishRename"
				@cancel-rename="cancelRename"
				@update-editing-item-name="updateEditingItemName"
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

	// 清理舊版本的 localStorage 數據
	if (typeof window !== "undefined") {
		// 檢查是否有舊格式的資料，如果有就清除
		const oldFiles = localStorage.getItem("python-ide-files");
		if (oldFiles) {
			localStorage.removeItem("python-ide-files");
			localStorage.removeItem("python-ide-current-file");
			localStorage.removeItem("python-ide-open-files");
			localStorage.removeItem("python-ide-file-tree");
		}
	}

	// 響應式數據 - 使用 localStorage 持久化
	const fileTree = useLocalStorage("python-ide-file-tree", [
		{
			id: "main-py",
			name: "main.py",
			type: "file",
			path: "main.py",
			content: `# 歡迎使用 Python Web IDE
import utils.math_utils as math_utils
import helpers.string_helper as string_helper

print("Hello, World!")

# 使用其他檔案的函數
numbers = [1, 2, 3, 4, 5]
sum_numbers = math_utils.calculate_sum(numbers)
avg_numbers = math_utils.calculate_average(numbers)

print(f"數字總和: {sum_numbers}")
print(f"數字平均: {avg_numbers}")

# 使用字串輔助函數
text = "python web ide"
formatted_text = string_helper.title_case(text)
print(f"格式化文字: {formatted_text}")

# 迴圈範例
for i in range(3):
    print(f"迴圈 {i + 1}")
`,
		},
		{
			id: "utils-folder",
			name: "utils",
			type: "folder",
			path: "utils",
			expanded: true,
			children: [
				{
					id: "math-utils-py",
					name: "math_utils.py",
					type: "file",
					path: "utils/math_utils.py",
					content: `# 數學工具函數
def calculate_sum(numbers):
    """計算數字列表的總和"""
    return sum(numbers)

def calculate_average(numbers):
    """計算數字列表的平均值"""
    if not numbers:
        return 0
    return sum(numbers) / len(numbers)

def calculate_max(numbers):
    """計算數字列表的最大值"""
    if not numbers:
        return None
    return max(numbers)

def calculate_min(numbers):
    """計算數字列表的最小值"""
    if not numbers:
        return None
    return min(numbers)
`,
				},
			],
		},
		{
			id: "helpers-folder",
			name: "helpers",
			type: "folder",
			path: "helpers",
			expanded: true,
			children: [
				{
					id: "string-helper-py",
					name: "string_helper.py",
					type: "file",
					path: "helpers/string_helper.py",
					content: `# 字串輔助函數
def title_case(text):
    """將文字轉換為標題格式"""
    return text.title()

def reverse_string(text):
    """反轉字串"""
    return text[::-1]

def count_words(text):
    """計算字串中的單字數量"""
    return len(text.split())

def remove_spaces(text):
    """移除字串中的所有空格"""
    return text.replace(" ", "")
`,
				},
			],
		},
	]);

	const openFiles = useLocalStorage("python-ide-open-files", []);
	const currentFileId = useLocalStorage("python-ide-current-file", "main-py");
	const output = ref("");
	const isRunning = ref(false);
	const isOutputCollapsed = ref(false);
	const isLoading = ref(true);
	const loadingMessage = ref("正在初始化編輯器...");
	const editingItemId = ref("");
	const editingItemName = ref("");

	let editor = null;
	let pyodide = null;

	// 檔案系統輔助函數（移動到前面，讓它們在初始化邏輯之前定義）
	function generateUniqueId() {
		return Date.now().toString(36) + Math.random().toString(36).substr(2);
	}

	function findFileById(id, tree = fileTree.value) {
		for (const item of tree) {
			if (item.id === id) {
				return item;
			}
			if (item.type === "folder" && item.children) {
				const found = findFileById(id, item.children);
				if (found) return found;
			}
		}
		return null;
	}

	// 初始化時確保 main.py 在打開的檔案列表中
	if (openFiles.value.length === 0) {
		const mainFile = findFileById("main-py");
		if (mainFile) {
			openFiles.value.push(mainFile);
		}
	}

	function findParentFolder(targetId, tree = fileTree.value, parent = null) {
		for (const item of tree) {
			if (item.id === targetId) {
				return parent;
			}
			if (item.type === "folder" && item.children) {
				const found = findParentFolder(targetId, item.children, item);
				if (found !== null) return found;
			}
		}
		return null;
	}

	function buildFilePath(item) {
		const parent = findParentFolder(item.id);
		if (parent) {
			return `${parent.path}/${item.name}`;
		}
		return item.name;
	}

	function getAllFiles(tree = fileTree.value, files = []) {
		for (const item of tree) {
			if (item.type === "file") {
				files.push(item);
			} else if (item.type === "folder" && item.children) {
				getAllFiles(item.children, files);
			}
		}
		return files;
	}

	// 檔案操作
	const selectFile = (id) => {
		const file = findFileById(id);
		if (!file || file.type !== "file") return;

		// 保存當前檔案內容
		if (editor && currentFileId.value) {
			const currentFile = findFileById(currentFileId.value);
			if (currentFile) {
				currentFile.content = editor.getValue();
			}
		}

		// 添加到開啟檔案列表（如果尚未打開）
		if (!openFiles.value.find((f) => f.id === id)) {
			openFiles.value.push(file);
		}

		currentFileId.value = id;
		if (editor) {
			editor.setValue(file.content);
		}
	};

	const selectFolder = (id) => {
		toggleFolder(id);
	};

	const toggleFolder = (id) => {
		const folder = findFileById(id);
		if (folder && folder.type === "folder") {
			folder.expanded = !folder.expanded;
		}
	};

	const closeFile = (id) => {
		const index = openFiles.value.findIndex((f) => f.id === id);
		if (index !== -1) {
			openFiles.value.splice(index, 1);
		}

		// 如果關閉的是當前檔案，切換到其他檔案
		if (currentFileId.value === id) {
			if (openFiles.value.length > 0) {
				selectFile(openFiles.value[0].id);
			} else {
				currentFileId.value = "";
				if (editor) {
					editor.setValue("");
				}
			}
		}
	};

	const addNewFile = () => {
		const fileName = prompt("請輸入檔案名稱:", "new_file.py");
		if (!fileName) return;

		const newFile = {
			id: generateUniqueId(),
			name: fileName,
			type: "file",
			path: fileName,
			content: `# ${fileName}\nprint("新檔案已建立")\n`,
		};

		fileTree.value.push(newFile);
		selectFile(newFile.id);
	};

	const addNewFolder = () => {
		const folderName = prompt("請輸入資料夾名稱:", "new_folder");
		if (!folderName) return;

		const newFolder = {
			id: generateUniqueId(),
			name: folderName,
			type: "folder",
			path: folderName,
			expanded: true,
			children: [],
		};

		fileTree.value.push(newFolder);
	};

	const deleteItem = (id) => {
		const item = findFileById(id);
		if (!item) return;

		const itemType = item.type === "folder" ? "資料夾" : "檔案";
		if (!confirm(`確定要刪除這個${itemType}嗎？`)) return;

		// 遞迴刪除函數
		function removeFromTree(tree, targetId) {
			for (let i = 0; i < tree.length; i++) {
				if (tree[i].id === targetId) {
					tree.splice(i, 1);
					return true;
				}
				if (tree[i].type === "folder" && tree[i].children) {
					if (removeFromTree(tree[i].children, targetId)) {
						return true;
					}
				}
			}
			return false;
		}

		removeFromTree(fileTree.value, id);

		// 如果刪除的是檔案，也要從開啟列表中移除
		if (item.type === "file") {
			closeFile(id);
		} else {
			// 如果刪除的是資料夾，關閉該資料夾下的所有檔案
			const filesToClose = [];
			function collectFiles(folder) {
				if (folder.children) {
					for (const child of folder.children) {
						if (child.type === "file") {
							filesToClose.push(child.id);
						} else if (child.type === "folder") {
							collectFiles(child);
						}
					}
				}
			}
			collectFiles(item);
			filesToClose.forEach((fileId) => closeFile(fileId));
		}
	};

	const startRename = (id) => {
		const item = findFileById(id);
		if (item) {
			editingItemId.value = id;
			editingItemName.value = item.name;
			nextTick(() => {
				const input = document.querySelector(
					".item-name-input, .tab-name-input"
				);
				if (input) {
					input.focus();
					input.select();
				}
			});
		}
	};

	const finishRename = (id, newName) => {
		if (!newName || !newName.trim()) {
			cancelRename();
			return;
		}

		const item = findFileById(id);
		if (item && newName.trim() !== item.name) {
			item.name = newName.trim();
			item.path = buildFilePath(item);
		}
		editingItemId.value = "";
		editingItemName.value = "";
	};

	const cancelRename = () => {
		editingItemId.value = "";
		editingItemName.value = "";
	};

	const updateEditingItemName = (value) => {
		editingItemName.value = value;
	};

	// 輸出面板
	const toggleOutput = () => {
		isOutputCollapsed.value = !isOutputCollapsed.value;
	};

	// 創建虛擬檔案系統給 Python
	function createVirtualFileSystem() {
		const files = getAllFiles();
		const virtualFS = {};

		for (const file of files) {
			virtualFS[file.path] = file.content;
		}

		return virtualFS;
	}

	// 執行 Python 程式碼
	const runCode = async () => {
		if (isRunning.value || !pyodide) return;

		isRunning.value = true;
		output.value = "";

		try {
			// 保存當前編輯器內容
			if (editor && currentFileId.value) {
				const currentFile = findFileById(currentFileId.value);
				if (currentFile) {
					currentFile.content = editor.getValue();
				}
			}

			// 創建虛擬檔案系統
			const virtualFS = createVirtualFileSystem();

			// 重定向 Python 的 stdout
			pyodide.runPython(`
import sys
from io import StringIO

# 清除之前的模組（保留系統模組）
modules_to_remove = []
for module_name in list(sys.modules.keys()):
    if (not module_name.startswith('_') and 
        module_name not in ['sys', 'io', 'StringIO', 'types', 'builtins'] and 
        not module_name.startswith('pyodide') and
        not module_name.startswith('importlib')):
        modules_to_remove.append(module_name)

for module_name in modules_to_remove:
    if module_name in sys.modules:
        del sys.modules[module_name]

sys.stdout = StringIO()
print("Python 環境已重置")
    `);

			// 使用 Pyodide 的 FS API 寫入檔案
			for (const [filePath, content] of Object.entries(virtualFS)) {
				if (filePath.endsWith(".py")) {
					// 確保目錄存在
					const dirPath = filePath.substring(0, filePath.lastIndexOf("/"));
					if (dirPath) {
						try {
							pyodide.FS.mkdirTree(`/home/pyodide/${dirPath}`);
						} catch {
							// 目錄可能已存在，忽略錯誤
						}
					}

					// 寫入檔案到虛擬檔案系統
					pyodide.FS.writeFile(`/home/pyodide/${filePath}`, content);
				}
			}

			// 驗證檔案系統並載入模組
			pyodide.runPython(`
import os
print("檔案系統內容:")
for root, dirs, files in os.walk("/home/pyodide"):
    level = root.replace("/home/pyodide", "").count(os.sep)
    indent = " " * 2 * level
    print(f"{indent}{os.path.basename(root)}/")
    sub_indent = " " * 2 * (level + 1)
    for file in files:
        print(f"{sub_indent}{file}")

print("\\n系統路徑:", sys.path)
print("模組已準備完成")
    `);

			// 執行主檔案
			const currentFile = findFileById(currentFileId.value);
			if (currentFile) {
				pyodide.runPython(currentFile.content);
			}

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

			const currentFile = findFileById(currentFileId.value);
			const initialContent = currentFile ? currentFile.content : "";

			editor = monaco.editor.create(editorElement, {
				value: initialContent,
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
				if (currentFileId.value) {
					const currentFile = findFileById(currentFileId.value);
					if (currentFile) {
						currentFile.content = editor.getValue();
					}
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

		// Debug: 檢查檔案樹資料
		console.log("File tree data:", fileTree.value);
		console.log("Current file ID:", currentFileId.value);
		console.log("Open files:", openFiles.value);

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
