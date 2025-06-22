// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2025-05-15",
	devtools: { enabled: true },
	ssr: false,

	modules: [
		"@nuxt/content",
		"@nuxt/ui",
		"@nuxt/image",
		"@nuxt/fonts",
		"@nuxt/eslint",
	],

	// 支持靜態部署
	nitro: {
		prerender: {
			routes: ["/"],
		},
	},

	// 優化構建
	vite: {
		optimizeDeps: {
			include: ["monaco-editor", "pyodide"],
		},
		build: {
			rollupOptions: {
				output: {
					manualChunks: {
						"monaco-editor": ["monaco-editor"],
						pyodide: ["pyodide"],
					},
				},
			},
		},
	},

	// CSS 配置
	css: ["~/assets/css/main.css"],

	// App 配置
	app: {
		head: {
			title: "Python Web IDE",
			meta: [
				{ charset: "utf-8" },
				{ name: "viewport", content: "width=device-width, initial-scale=1" },
				{ name: "description", content: "一個基於瀏覽器的 Python 開發環境" },
			],
			link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
		},
	},
});
