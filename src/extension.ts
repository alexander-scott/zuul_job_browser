import * as vscode from "vscode";
import { JobHierarchyProvider } from "./providers/job_hierarchy_provider";
import { JobDefinitionProvider } from "./providers/job_definition_provider";
import { JobHoverProvider } from "./providers/job_hover_provider";
import { JobReferencesProvider } from "./providers/job_references_provider";
import { JobSymbolWorkspaceDefinitionsProvider } from "./providers/job_symbol_workspace_definitions_provider";
import { JobSymbolDocumentDefinitionsProvider } from "./providers/job_symbol_document_definitions_provider";
import { FileManager } from "./file_parsing/file_manager";
import { JobRenameProvider } from "./providers/job_symbol_rename_provider";
import { workspace_pattern } from "./contants";
import { JobParser } from "./job_parsing/job_parser";
import { JobHierarchyTreeProvider } from "./tree_views/job_hierarchy_tree_provider";
import { JobPlaybooksTreeProvider } from "./tree_views/job_playbooks_tree_provider";
import { JobVariablesTreeProvider } from "./tree_views/job_variables_tree_provider";

const file_manager = new FileManager(workspace_pattern);

export function activate(context: vscode.ExtensionContext) {
	file_manager.initalise_cache(context);
	file_manager.parse_all_files();
	file_manager.set_file_watchers();

	context.subscriptions.push(file_manager.get_status_bar_icon());

	context.subscriptions.push(
		vscode.languages.registerCallHierarchyProvider(
			{ scheme: "file", language: "yaml" },
			new JobHierarchyProvider(file_manager.get_job_manager())
		)
	);
	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider(
			{ scheme: "file", language: "yaml" },
			new JobDefinitionProvider(file_manager.get_job_manager())
		)
	);
	context.subscriptions.push(
		vscode.languages.registerHoverProvider(
			{ scheme: "file", language: "yaml" },
			new JobHoverProvider(file_manager.get_job_manager())
		)
	);
	context.subscriptions.push(
		vscode.languages.registerReferenceProvider(
			{ scheme: "file", language: "yaml" },
			new JobReferencesProvider(file_manager.get_job_manager(), file_manager.get_project_template_manager())
		)
	);
	context.subscriptions.push(
		vscode.languages.registerDocumentSymbolProvider(
			{ scheme: "file", language: "yaml" },
			new JobSymbolDocumentDefinitionsProvider(file_manager.get_job_manager())
		)
	);
	context.subscriptions.push(
		vscode.languages.registerRenameProvider(
			{ scheme: "file", language: "yaml" },
			new JobRenameProvider(file_manager.get_job_manager(), file_manager.get_project_template_manager())
		)
	);
	context.subscriptions.push(
		vscode.languages.registerWorkspaceSymbolProvider(
			new JobSymbolWorkspaceDefinitionsProvider(file_manager.get_job_manager())
		)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("zuulplugin.rebuild-hierarchy", async () => {
			vscode.window.setStatusBarMessage("Rebuilding the Zuul Job Hierarchy.");
			await file_manager.parse_all_files();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("zuulplugin.clear-cache", () => {
			vscode.window.setStatusBarMessage("Clearing the Zuul Job Hierarchy Cache.");
			file_manager.clear_cache();
		})
	);

	// ── Tree view windows ───────────────────────────────────────────────────────

	const job_manager = file_manager.get_job_manager();

	const hierarchyTreeProvider = new JobHierarchyTreeProvider(job_manager);
	const playbooksTreeProvider = new JobPlaybooksTreeProvider(job_manager);
	const variablesTreeProvider = new JobVariablesTreeProvider(job_manager);

	const hierarchyTreeView = vscode.window.createTreeView("zuulJobHierarchy", {
		treeDataProvider: hierarchyTreeProvider,
		showCollapseAll: true,
	});

	const playbooksTreeView = vscode.window.createTreeView("zuulPlaybooks", {
		treeDataProvider: playbooksTreeProvider,
		showCollapseAll: false,
	});

	const variablesTreeView = vscode.window.createTreeView("zuulVariables", {
		treeDataProvider: variablesTreeProvider,
		showCollapseAll: false,
	});

	context.subscriptions.push(hierarchyTreeView, playbooksTreeView, variablesTreeView);

	// Refresh tree views whenever jobs are rebuilt.
	context.subscriptions.push(
		vscode.commands.registerCommand("zuulplugin.refresh-tree-views", () => {
			hierarchyTreeProvider.refresh();
			playbooksTreeProvider.refresh();
			variablesTreeProvider.refresh();
		})
	);

	// ── revealRange command ─────────────────────────────────────────────────────

	context.subscriptions.push(
		vscode.commands.registerCommand(
			"symbolOutline.revealRange",
			async (uri: vscode.Uri, range: vscode.Range) => {
				const editor = await vscode.window.showTextDocument(uri);
				editor.revealRange(range, vscode.TextEditorRevealType.Default);
				editor.selection = new vscode.Selection(range.start, range.start);
				vscode.commands.executeCommand("workbench.action.focusActiveEditorGroup");
			}
		)
	);

	// ── Dynamic tree selection tracking ────────────────────────────────────────

	context.subscriptions.push(
		vscode.window.onDidChangeTextEditorSelection((event) => {
			const document = event.textEditor.document;
			if (document.languageId !== "yaml") {return;}

			const position = event.selections[0]?.active;
			if (!position) {return;}

			const job_name = JobParser.parse_job_from_random_line_number(document, position.line);
			if (job_name) {
				const job = job_manager.get_job_with_name(job_name);
				if (job) {
					playbooksTreeProvider.setSelectedJob(job);
					variablesTreeProvider.setSelectedJob(job);

					// Reveal the corresponding item in the job hierarchy tree view.
					const treeItem = hierarchyTreeProvider.getJobTreeItem(job_name);
					if (treeItem && hierarchyTreeView.visible) {
						hierarchyTreeView.reveal(treeItem, { select: true, focus: false, expand: true });
					}
					return;
				}
			}

			// No job at cursor – clear context-sensitive views.
			playbooksTreeProvider.setSelectedJob(undefined);
			variablesTreeProvider.setSelectedJob(undefined);
		})
	);
}

// this method is called when your extension is deactivated
export function deactivate() {
	file_manager.destroy();
}
