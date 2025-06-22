export default defineNuxtPlugin(() => {
	// Monaco Editor 需要在客戶端初始化
	if (import.meta.client) {
		// 設置 Monaco Editor 的 worker 路徑
		window.MonacoEnvironment = {
			getWorkerUrl: function (moduleId, label) {
				if (label === "json") {
					return "/monaco-editor/json.worker.js";
				}
				if (label === "css" || label === "scss" || label === "less") {
					return "/monaco-editor/css.worker.js";
				}
				if (label === "html" || label === "handlebars" || label === "razor") {
					return "/monaco-editor/html.worker.js";
				}
				if (label === "typescript" || label === "javascript") {
					return "/monaco-editor/ts.worker.js";
				}
				return "/monaco-editor/editor.worker.js";
			},
		};
	}
});
