<template>
	<div class="ide-container">
		<LoadingOverlay :is-loading="isLoading" :loading-message="loadingMessage" />

		<IdeHeader
			:is-running="isRunning"
			:is-loading="isLoading"
			@run-code="runCode"
		/>

		<div class="ide-body">
			<div
				class="file-explorer-container"
				:style="{ width: fileExplorerWidth + 'px' }"
			>
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
					@move-item="moveItem"
				/>
			</div>

			<!-- 左側分隔器 -->
			<div
				class="resizer left-resizer"
				@mousedown="startResize($event, 'left')"
			></div>

			<div class="code-editor-container">
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
			</div>

			<!-- 右側分隔器 -->
			<div
				v-show="!isOutputCollapsed"
				class="resizer right-resizer"
				@mousedown="startResize($event, 'right')"
			></div>

			<div
				class="output-panel-container"
				:style="{
					width: isOutputCollapsed ? '40px' : outputPanelWidth + 'px',
					minWidth: isOutputCollapsed ? '40px' : '200px',
				}"
			>
				<OutputPanel
					:output="output"
					:is-output-collapsed="isOutputCollapsed"
					@toggle-output="toggleOutput"
				/>
			</div>
		</div>
	</div>
</template>

<script setup>
	import { ref, onMounted, nextTick } from "vue";
	import { useLocalStorage } from "@vueuse/core";
	import Swal from "sweetalert2";

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

	// 新增：面板寬度控制
	const fileExplorerWidth = useLocalStorage(
		"python-ide-file-explorer-width",
		250
	);
	const outputPanelWidth = useLocalStorage(
		"python-ide-output-panel-width",
		300
	);
	const isResizing = ref(false);
	const resizeType = ref("");

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

	const addNewFile = async () => {
		const { value: fileName, isConfirmed } = await Swal.fire({
			title: "新增檔案",
			text: "請輸入檔案名稱:",
			input: "text",
			inputValue: "new_file.py",
			showCancelButton: true,
			confirmButtonText: "建立",
			cancelButtonText: "取消",
			confirmButtonColor: "#4FC3F7",
			inputValidator: (value) => {
				if (!value || !value.trim()) {
					return "檔案名稱不能為空";
				}
				if (!/^[^<>:"/\\|?*]+$/.test(value)) {
					return "檔案名稱包含無效字符";
				}
			},
		});

		if (!isConfirmed || !fileName) return;

		const newFile = {
			id: generateUniqueId(),
			name: fileName.trim(),
			type: "file",
			path: "",
			content: `# ${fileName.trim()}\nprint("新檔案已建立")\n`,
		};

		// 根據當前選中的項目決定創建位置
		const targetLocation = getTargetLocationForNewItem();

		if (targetLocation.isRoot) {
			// 在根目錄創建
			newFile.path = fileName.trim();
			fileTree.value.push(newFile);
		} else {
			// 在指定資料夾內創建
			newFile.path = `${targetLocation.parent.path}/${fileName.trim()}`;
			if (!targetLocation.parent.children) {
				targetLocation.parent.children = [];
			}
			targetLocation.parent.children.push(newFile);
			targetLocation.parent.expanded = true; // 自動展開父資料夾
		}

		selectFile(newFile.id);

		// 顯示成功提示
		Swal.fire({
			title: "檔案建立成功！",
			text: `檔案 "${fileName.trim()}" 已成功建立`,
			icon: "success",
			timer: 2000,
			showConfirmButton: false,
			toast: true,
			position: "top-end",
		});
	};

	const addNewFolder = async () => {
		const { value: folderName, isConfirmed } = await Swal.fire({
			title: "新增資料夾",
			text: "請輸入資料夾名稱:",
			input: "text",
			inputValue: "new_folder",
			showCancelButton: true,
			confirmButtonText: "建立",
			cancelButtonText: "取消",
			confirmButtonColor: "#FFD54F",
			inputValidator: (value) => {
				if (!value || !value.trim()) {
					return "資料夾名稱不能為空";
				}
				if (!/^[^<>:"/\\|?*]+$/.test(value)) {
					return "資料夾名稱包含無效字符";
				}
			},
		});

		if (!isConfirmed || !folderName) return;

		const newFolder = {
			id: generateUniqueId(),
			name: folderName.trim(),
			type: "folder",
			path: "",
			expanded: true,
			children: [],
		};

		// 根據當前選中的項目決定創建位置
		const targetLocation = getTargetLocationForNewItem();

		if (targetLocation.isRoot) {
			// 在根目錄創建
			newFolder.path = folderName.trim();
			fileTree.value.push(newFolder);
		} else {
			// 在指定資料夾內創建
			newFolder.path = `${targetLocation.parent.path}/${folderName.trim()}`;
			if (!targetLocation.parent.children) {
				targetLocation.parent.children = [];
			}
			targetLocation.parent.children.push(newFolder);
			targetLocation.parent.expanded = true; // 自動展開父資料夾
		}

		// 顯示成功提示
		Swal.fire({
			title: "資料夾建立成功！",
			text: `資料夾 "${folderName.trim()}" 已成功建立`,
			icon: "success",
			timer: 2000,
			showConfirmButton: false,
			toast: true,
			position: "top-end",
		});
	};

	// 獲取新建項目的目標位置
	const getTargetLocationForNewItem = () => {
		if (!currentFileId.value) {
			// 沒有選中任何項目，在根目錄創建
			return { isRoot: true, parent: null };
		}

		const currentItem = findFileById(currentFileId.value);
		if (!currentItem) {
			return { isRoot: true, parent: null };
		}

		if (currentItem.type === "folder") {
			// 選中的是資料夾，在該資料夾內創建
			return { isRoot: false, parent: currentItem };
		} else {
			// 選中的是檔案，在該檔案的同層創建（找到父資料夾）
			const parentFolder = findParentFolder(currentFileId.value);
			if (parentFolder) {
				return { isRoot: false, parent: parentFolder };
			} else {
				// 檔案在根目錄，在根目錄創建
				return { isRoot: true, parent: null };
			}
		}
	};

	const deleteItem = async (id) => {
		const item = findFileById(id);
		if (!item) return;

		const itemType = item.type === "folder" ? "資料夾" : "檔案";
		const result = await Swal.fire({
			title: `刪除${itemType}`,
			text: `確定要刪除 "${item.name}" 這個${itemType}嗎？`,
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "刪除",
			cancelButtonText: "取消",
			confirmButtonColor: "#dc3545",
			cancelButtonColor: "#6c757d",
			reverseButtons: true,
		});

		if (!result.isConfirmed) return;

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

		// 顯示成功提示
		Swal.fire({
			title: "刪除成功！",
			text: `${itemType} "${item.name}" 已成功刪除`,
			icon: "success",
			timer: 2000,
			showConfirmButton: false,
			toast: true,
			position: "top-end",
		});
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

	const moveItem = ({ fromId, toId }) => {
		if (fromId === toId) return;

		// 尋找節點及其父節點的輔助函數
		function findNodeAndParent(id, tree, parent = null) {
			for (const [i, node] of tree.entries()) {
				if (node.id === id) return { node, parent, index: i };
				if (node.type === "folder" && node.children) {
					const found = findNodeAndParent(id, node.children, node);
					if (found) return found;
				}
			}
			return null;
		}

		// 檢查是否為子孫節點的輔助函數
		function isDescendant(targetId, node) {
			if (node.id === targetId) return true;
			if (node.type === "folder" && node.children) {
				return node.children.some((child) => isDescendant(targetId, child));
			}
			return false;
		}

		// 遞迴更新路徑的輔助函數
		function updatePaths(node, newParentPath) {
			const newPath = newParentPath
				? `${newParentPath}/${node.name}`
				: node.name;
			node.path = newPath;

			if (node.type === "folder" && node.children) {
				node.children.forEach((child) => updatePaths(child, newPath));
			}
		}

		const tree = fileTree.value;
		const fromInfo = findNodeAndParent(fromId, tree);
		if (!fromInfo) return;

		// 移除源節點
		const fromArr = fromInfo.parent ? fromInfo.parent.children : tree;
		const [moved] = fromArr.splice(fromInfo.index, 1);

		// 如果 toId 為 null，移動到根目錄
		if (toId === null) {
			tree.push(moved);
			// 遞迴更新路徑
			updatePaths(moved, "");
			return;
		}

		const toInfo = findNodeAndParent(toId, tree);
		if (!toInfo) {
			// 恢復原位置
			fromArr.splice(fromInfo.index, 0, moved);
			return;
		}

		// 禁止拖到自己或子孫節點下
		if (isDescendant(toId, moved)) {
			// 恢復原位置
			fromArr.splice(fromInfo.index, 0, moved);
			return;
		}

		// 移動到目標位置
		if (toInfo.node.type === "folder") {
			// 移動到資料夾內
			if (!toInfo.node.children) toInfo.node.children = [];
			toInfo.node.children.push(moved);
			toInfo.node.expanded = true;
			// 遞迴更新路徑
			updatePaths(moved, toInfo.node.path);
		} else {
			// 插入到同層節點之後
			const toArr = toInfo.parent ? toInfo.parent.children : tree;
			const toIdx = toInfo.index;
			toArr.splice(toIdx + 1, 0, moved);
			// 遞迴更新路徑
			const newParentPath = toInfo.parent ? toInfo.parent.path : "";
			updatePaths(moved, newParentPath);
		}
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
	const runCode = async (debugLevel = "print") => {
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

			// 重定向 Python 的 stdout 並設置debug層級
			const debugOutput = debugLevel !== "print";

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
${debugOutput ? 'print("Python 環境已重置")' : ""}
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

					if (debugLevel === "detailed" || debugLevel === "full") {
						pyodide.runPython(`print("載入檔案: ${filePath}")`);
					}
				}
			}

			// 根據debug層級顯示不同資訊
			if (
				debugLevel === "basic" ||
				debugLevel === "detailed" ||
				debugLevel === "full"
			) {
				pyodide.runPython(`
import os
print("檔案系統內容:")
for root, dirs, files in os.walk("/home/pyodide"):
    level = root.replace("/home/pyodide", "").count(os.sep)
    indent = "  " * level
    print(f"{indent} {os.path.basename(root)}/")
    sub_indent = "  " * (level + 1)
    for file in files:
        print(f"{sub_indent} {file}")
				`);
			}

			if (debugLevel === "detailed" || debugLevel === "full") {
				pyodide.runPython(`
print("\\n 系統路徑:", sys.path)
print(" 模組已準備完成\\n")
				`);
			}

			if (debugLevel === "full") {
				pyodide.runPython(`
import platform
print(" Python 版本:", platform.python_version())
print(" 平台資訊:", platform.platform())
print(" 處理器:", platform.processor())
print("\\n 開始執行程式碼...\\n")
				`);
			}

			// 執行主檔案
			const currentFile = findFileById(currentFileId.value);
			if (currentFile) {
				if (
					debugLevel === "basic" ||
					debugLevel === "detailed" ||
					debugLevel === "full"
				) {
					pyodide.runPython(`print("\\n 執行檔案: ${currentFile.name}")`);
					pyodide.runPython(`print("="*50)`);
				}

				pyodide.runPython(currentFile.content);

				if (
					debugLevel === "basic" ||
					debugLevel === "detailed" ||
					debugLevel === "full"
				) {
					pyodide.runPython(`print("="*50)`);
					pyodide.runPython(`print("程式執行完成")`);
				}
			}

			// 獲取輸出
			const stdout = pyodide.runPython("sys.stdout.getvalue()");

			// 根據debug層級處理輸出
			if (debugLevel === "print") {
				// 僅顯示程式的print輸出，過濾掉debug訊息
				const lines = stdout.split("\n");
				const printLines = lines.filter(
					(line) =>
						!line.includes("🔄") &&
						!line.includes("📁") &&
						!line.includes("📂") &&
						!line.includes("🛠️") &&
						!line.includes("✅") &&
						!line.includes("🔧") &&
						!line.includes("🚀") &&
						!line.includes("📝") &&
						!line.includes("====")
				);
				output.value = printLines.join("\n").trim() || "程式執行完成，無輸出";
			} else {
				output.value = stdout || "程式執行完成，無輸出";
			}

			// 確保輸出面板展開
			if (isOutputCollapsed.value) {
				isOutputCollapsed.value = false;
			}
		} catch (error) {
			// 根據debug層級顯示不同詳細程度的錯誤訊息
			let errorMessage = "";

			if (debugLevel === "print") {
				errorMessage = `❌ 執行錯誤: ${error.message}`;
			} else if (debugLevel === "basic") {
				errorMessage = `❌ 執行錯誤: ${error.message}\n\n🔍 建議檢查程式碼語法和邏輯`;
			} else if (debugLevel === "detailed") {
				errorMessage = `❌ 執行錯誤詳情:\n${error.message}\n\n📋 錯誤類型: ${error.name || "Unknown"}\n🔍 建議檢查程式碼語法、變數名稱和模組匯入`;
			} else if (debugLevel === "full") {
				errorMessage = `❌ 完整錯誤報告:
╔═══ 錯誤訊息 ═══╗
${error.message}

╔═══ 錯誤詳情 ═══╗
• 錯誤類型: ${error.name || "Unknown"}
• 檔案: ${currentFileId.value}
• 時間: ${new Date().toLocaleString()}

╔═══ 除錯建議 ═══╗
• 檢查程式碼語法
• 確認變數名稱拼寫
• 檢查模組匯入路徑
• 查看Python錯誤堆疊
`;
			}

			output.value = errorMessage;
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

	// 新增：拖拉調整寬度功能
	const startResize = (event, type) => {
		isResizing.value = true;
		resizeType.value = type;

		// 阻止預設行為和事件冒泡
		event.preventDefault();
		event.stopPropagation();

		// 添加全域事件監聽器
		document.addEventListener("mousemove", handleResize);
		document.addEventListener("mouseup", stopResize);

		// 添加 body 的樣式來改善拖拉體驗
		document.body.style.cursor = "col-resize";
		document.body.style.userSelect = "none";
	};

	const handleResize = (event) => {
		if (!isResizing.value) return;

		const containerRect = document
			.querySelector(".ide-body")
			.getBoundingClientRect();

		if (resizeType.value === "left") {
			// 調整左側文件列表寬度
			const newWidth = event.clientX - containerRect.left;
			const minWidth = 150; // 最小寬度
			const maxWidth = containerRect.width * 0.4; // 最大寬度為容器的 40%

			fileExplorerWidth.value = Math.max(
				minWidth,
				Math.min(maxWidth, newWidth)
			);
		} else if (resizeType.value === "right") {
			// 如果輸出面板已摺疊，則不允許拖拉
			if (isOutputCollapsed.value) return;

			// 調整右側輸出面板寬度
			const newWidth = containerRect.right - event.clientX;
			const minWidth = 200; // 最小寬度
			const maxWidth = containerRect.width * 0.5; // 最大寬度為容器的 50%

			outputPanelWidth.value = Math.max(minWidth, Math.min(maxWidth, newWidth));
		}
	};

	const stopResize = () => {
		isResizing.value = false;
		resizeType.value = "";

		// 移除全域事件監聽器
		document.removeEventListener("mousemove", handleResize);
		document.removeEventListener("mouseup", stopResize);

		// 恢復 body 的樣式
		document.body.style.cursor = "";
		document.body.style.userSelect = "";
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

	.file-explorer-container {
		display: flex;
		flex-shrink: 0;
	}

	.code-editor-container {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.output-panel-container {
		display: flex;
		flex-shrink: 0;
	}

	.resizer {
		width: 4px;
		background: #3e3e42;
		cursor: col-resize;
		user-select: none;
		flex-shrink: 0;
		position: relative;
		transition: background 0.2s ease;
		z-index: 10;
	}

	.resizer:hover {
		background: #007acc;
		box-shadow: 0 0 3px rgba(0, 122, 204, 0.5);
	}

	.resizer:active,
	.resizer.resizing {
		background: #007acc;
		box-shadow: 0 0 5px rgba(0, 122, 204, 0.8);
	}

	.resizer::before {
		content: "";
		position: absolute;
		top: 0;
		left: -2px;
		right: -2px;
		bottom: 0;
		background: transparent;
	}

	.left-resizer {
		border-right: 1px solid #3e3e42;
	}

	.right-resizer {
		border-left: 1px solid #3e3e42;
	}

	/* 響應式設計 */
	@media (max-width: 768px) {
		.ide-body {
			flex-direction: column;
		}

		.resizer {
			display: none; /* 在移動端隱藏拖拉條 */
		}

		.file-explorer-container,
		.output-panel-container {
			width: 100% !important;
		}

		.file-explorer-container {
			height: 200px;
			overflow-y: auto;
		}

		.output-panel-container {
			height: 150px;
		}

		.code-editor-container {
			min-height: 300px;
		}
	}
</style>
