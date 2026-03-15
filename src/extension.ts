import * as vscode from "vscode";
import { JobHierarchyProvider } from "./providers/job_hierarchy_provider";
import { JobDefinitionProvider } from "./providers/job_definition_provider";
import { JobHoverProvider } from "./providers/job_hover_provider";
import { JobReferencesProvider } from "./providers/job_references_provider";
import { JobSymbolWorkspaceDefinitionsProvider } from "./providers/job_symbol_workspace_definitions_provider";
import { JobSymbolDocumentDefinitionsProvider } from "./providers/job_symbol_document_definitions_provider";
import { FileManager } from "./file_parsing/file_manager";
import { JobRenameProvider } from "./providers/job_symbol_rename_provider";
import { workspace_pattern } from "./constants";

const fileManager = new FileManager(workspace_pattern);

export function activate(context: vscode.ExtensionContext) {
	fileManager.initializeCache(context);
	fileManager.parse_all_files();
	fileManager.set_file_watchers();

	context.subscriptions.push(fileManager.get_status_bar_icon());

	context.subscriptions.push(
		vscode.languages.registerCallHierarchyProvider(
			{ scheme: "file", language: "yaml" },
			new JobHierarchyProvider(fileManager.get_job_manager())
		)
	);
	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider(
			{ scheme: "file", language: "yaml" },
			new JobDefinitionProvider(fileManager.get_job_manager())
		)
	);
	context.subscriptions.push(
		vscode.languages.registerHoverProvider(
			{ scheme: "file", language: "yaml" },
			new JobHoverProvider(fileManager.get_job_manager())
		)
	);
	context.subscriptions.push(
		vscode.languages.registerReferenceProvider(
			{ scheme: "file", language: "yaml" },
			new JobReferencesProvider(fileManager.get_job_manager(), fileManager.get_project_template_manager())
		)
	);
	context.subscriptions.push(
		vscode.languages.registerDocumentSymbolProvider(
			{ scheme: "file", language: "yaml" },
			new JobSymbolDocumentDefinitionsProvider(fileManager.get_job_manager())
		)
	);
	context.subscriptions.push(
		vscode.languages.registerRenameProvider(
			{ scheme: "file", language: "yaml" },
			new JobRenameProvider(fileManager.get_job_manager(), fileManager.get_project_template_manager())
		)
	);
	context.subscriptions.push(
		vscode.languages.registerWorkspaceSymbolProvider(
			new JobSymbolWorkspaceDefinitionsProvider(fileManager.get_job_manager())
		)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("zuulplugin.rebuild-hierarchy", async () => {
			vscode.window.setStatusBarMessage("Rebuilding the Zuul Job Hierarchy.");
			await fileManager.parse_all_files();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("zuulplugin.clear-cache", () => {
			vscode.window.setStatusBarMessage("Clearing the Zuul Job Hierarchy Cache.");
			fileManager.clear_cache();
		})
	);
}

// this method is called when your extension is deactivated
export function deactivate() {
	fileManager.destroy();
}
