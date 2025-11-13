#!/usr/bin/env node

/**
 * CCPM Dashboard Generator
 * Main entry point for generating HTML dashboards
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import DataLoader from "./data-loader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const TEMPLATES_DIR = path.join(__dirname, "../templates");
const OUTPUT_DIR = path.join(__dirname, "../output");
const _ASSETS_DIR = path.join(__dirname, "../assets");

class DashboardGenerator {
	constructor() {
		this.dataLoader = new DataLoader();
		this.data = null;
	}

	/**
	 * Generate all dashboards
	 */
	async generate() {
		// Load data
		this.data = await this.dataLoader.loadAll();
		const summary = this.dataLoader.getSummary();

		// Prepare data object for templates
		const dashboardData = {
			...this.data,
			summary,
			generated: new Date().toISOString(),
		};

		// Ensure output directory exists
		fs.mkdirSync(OUTPUT_DIR, { recursive: true });

		// Generate dashboards
		await this.generateExecutiveDashboard(dashboardData);
		await this.generateManagerDashboard(dashboardData);
		await this.generateDeveloperDashboard(dashboardData);

		// Generate index page
		await this.generateIndexPage();

		// Copy assets if they exist
		await this.copyAssets();
	}

	/**
	 * Generate Executive Dashboard
	 */
	async generateExecutiveDashboard(data) {
		const templatePath = path.join(TEMPLATES_DIR, "executive.html");
		let template = fs.readFileSync(templatePath, "utf-8");

		// Replace data placeholder with actual data
		template = template.replace(
			"{{{DATA_PLACEHOLDER}}}",
			JSON.stringify(data, null, 2),
		);

		// Write output file
		const outputPath = path.join(OUTPUT_DIR, "executive.html");
		fs.writeFileSync(outputPath, template);
	}

	/**
	 * Generate Manager Dashboard
	 */
	async generateManagerDashboard(data) {
		const templatePath = path.join(TEMPLATES_DIR, "manager.html");

		// Check if template exists, if not use a basic version
		if (!fs.existsSync(templatePath)) {
			await this.createBasicManagerTemplate();
		}

		let template = fs.readFileSync(templatePath, "utf-8");

		// Replace data placeholder with actual data
		template = template.replace(
			"{{{DATA_PLACEHOLDER}}}",
			JSON.stringify(data, null, 2),
		);

		// Write output file
		const outputPath = path.join(OUTPUT_DIR, "manager.html");
		fs.writeFileSync(outputPath, template);
	}

	/**
	 * Generate Developer Dashboard
	 */
	async generateDeveloperDashboard(data) {
		const templatePath = path.join(TEMPLATES_DIR, "developer.html");

		// Check if template exists, if not use a basic version
		if (!fs.existsSync(templatePath)) {
			await this.createBasicDeveloperTemplate();
		}

		let template = fs.readFileSync(templatePath, "utf-8");

		// Replace data placeholder with actual data
		template = template.replace(
			"{{{DATA_PLACEHOLDER}}}",
			JSON.stringify(data, null, 2),
		);

		// Write output file
		const outputPath = path.join(OUTPUT_DIR, "developer.html");
		fs.writeFileSync(outputPath, template);
	}

	/**
	 * Generate Index Page
	 */
	async generateIndexPage() {
		const indexContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CCPM Dashboards</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen flex items-center justify-center">
        <div class="max-w-4xl w-full px-4">
            <div class="text-center mb-12">
                <h1 class="text-4xl font-bold text-gray-900 mb-4">CCPM Dashboards</h1>
                <p class="text-lg text-gray-600">
                    Choose a dashboard view to explore project progress and metrics
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Executive Dashboard Card -->
                <a href="executive.html" class="group">
                    <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                            </svg>
                        </div>
                        <h2 class="text-xl font-semibold text-gray-900 mb-2">Executive Dashboard</h2>
                        <p class="text-gray-600 text-sm">
                            High-level overview with progress metrics, velocity charts, and risk indicators
                        </p>
                    </div>
                </a>

                <!-- Manager Dashboard Card -->
                <a href="manager.html" class="group">
                    <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                            </svg>
                        </div>
                        <h2 class="text-xl font-semibold text-gray-900 mb-2">Manager Dashboard</h2>
                        <p class="text-gray-600 text-sm">
                            Detailed task tracking, dependencies, resource allocation, and timelines
                        </p>
                    </div>
                </a>

                <!-- Developer Dashboard Card -->
                <a href="developer.html" class="group">
                    <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                            </svg>
                        </div>
                        <h2 class="text-xl font-semibold text-gray-900 mb-2">Developer Dashboard</h2>
                        <p class="text-gray-600 text-sm">
                            Technical metrics, file changes, test coverage, and agent performance
                        </p>
                    </div>
                </a>
            </div>

            <div class="mt-12 text-center text-sm text-gray-500">
                <p>Generated: ${new Date().toLocaleString()}</p>
                <p class="mt-2">CCPM Dashboard v1.0.0</p>
            </div>
        </div>
    </div>
</body>
</html>`;

		const outputPath = path.join(OUTPUT_DIR, "index.html");
		fs.writeFileSync(outputPath, indexContent);
	}

	/**
	 * Create basic Manager template if not exists
	 */
	async createBasicManagerTemplate() {
		const template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CCPM Manager Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-4">
                <h1 class="text-2xl font-bold text-gray-900">CCPM Manager Dashboard</h1>
                <button onclick="window.print()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Export PDF
                </button>
            </div>
            <nav class="flex space-x-8 mt-2">
                <a href="executive.html" class="text-gray-500 hover:text-gray-700 font-medium py-2 px-1">
                    Executive
                </a>
                <a href="manager.html" class="border-b-2 border-blue-600 text-blue-600 font-medium py-2 px-1">
                    Manager
                </a>
                <a href="developer.html" class="text-gray-500 hover:text-gray-700 font-medium py-2 px-1">
                    Developer
                </a>
            </nav>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Task Details</h2>
            <div id="taskDetails">Loading...</div>
        </div>
    </main>

    <script>
        const dashboardData = {{{DATA_PLACEHOLDER}}};

        document.addEventListener('DOMContentLoaded', function() {
            const taskDetails = document.getElementById('taskDetails');
            const tasks = dashboardData.tasks || [];

            taskDetails.innerHTML = '<ul class="space-y-2">' +
                tasks.map(task =>
                    '<li class="p-2 border rounded">' +
                    '<span class="font-medium">' + (task.name || task.taskId) + '</span> - ' +
                    '<span class="text-sm text-gray-600">' + task.status + '</span>' +
                    '</li>'
                ).join('') + '</ul>';
        });
    </script>
</body>
</html>`;

		const outputPath = path.join(TEMPLATES_DIR, "manager.html");
		fs.writeFileSync(outputPath, template);
	}

	/**
	 * Create basic Developer template if not exists
	 */
	async createBasicDeveloperTemplate() {
		const template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CCPM Developer Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-4">
                <h1 class="text-2xl font-bold text-gray-900">CCPM Developer Dashboard</h1>
                <button onclick="window.print()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Export PDF
                </button>
            </div>
            <nav class="flex space-x-8 mt-2">
                <a href="executive.html" class="text-gray-500 hover:text-gray-700 font-medium py-2 px-1">
                    Executive
                </a>
                <a href="manager.html" class="text-gray-500 hover:text-gray-700 font-medium py-2 px-1">
                    Manager
                </a>
                <a href="developer.html" class="border-b-2 border-blue-600 text-blue-600 font-medium py-2 px-1">
                    Developer
                </a>
            </nav>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Agent Performance</h2>
            <div id="agentStats">Loading...</div>
        </div>
    </main>

    <script>
        const dashboardData = {{{DATA_PLACEHOLDER}}};

        document.addEventListener('DOMContentLoaded', function() {
            const agentStats = document.getElementById('agentStats');
            const agents = dashboardData.metrics.agentDistribution || {};

            agentStats.innerHTML = '<ul class="space-y-2">' +
                Object.entries(agents).map(([agent, count]) =>
                    '<li class="p-2 border rounded">' +
                    '<span class="font-medium">' + agent + '</span>: ' +
                    '<span class="text-sm text-gray-600">' + count + ' tasks</span>' +
                    '</li>'
                ).join('') + '</ul>';
        });
    </script>
</body>
</html>`;

		const outputPath = path.join(TEMPLATES_DIR, "developer.html");
		fs.writeFileSync(outputPath, template);
	}

	/**
	 * Copy assets to output directory
	 */
	async copyAssets() {
		// Create a simple CSS file if needed
		const cssDir = path.join(OUTPUT_DIR, "css");
		fs.mkdirSync(cssDir, { recursive: true });

		const customCSS = `/* CCMP Dashboard Custom Styles */
@media print {
	.no-print {
		display: none !important;
	}
	body {
		font-size: 12pt;
	}
	.page-break {
		page-break-after: always;
	}
}
`;

		fs.writeFileSync(path.join(cssDir, "custom.css"), customCSS);
	}
}

// Run generator
if (import.meta.url === `file://${process.argv[1]}`) {
	const generator = new DashboardGenerator();
	generator.generate().catch((error) => {
		process.stderr.write(`Error: ${error.message}\n`);
		process.exit(1);
	});
}
