import * as vscode from "vscode";
import { JobHierarchyProvider } from "./providers/job_hierarchy_provider";
import { JobDefinitionProvider } from "./providers/job_definition_provider";
import { JobHoverProvider } from "./providers/job_hover_provider";
import { JobReferencesProvider } from "./providers/job_references_provider";
import { JobSymbolWorkspaceDefinitionsProvider } from "./providers/job_symbol_workspace_definitions_provider";
import { JobSymbolDocumentDefinitionsProvider } from "./providers/job_symbol_document_definitions_provider";
import { FileManager } from "./file_parsing/file_manager";
import { JobRenameProvider } from "./providers/job_symbol_rename_provider";

const workspace_pattern = "**/zuul.d/*.yaml";
const file_manager = new FileManager(workspace_pattern);

export function activate(context: vscode.ExtensionContext) {
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
			vscode.window.setStatusBarMessage("Finished rebuilding the Zuul Job Hierarchy.");
		})
	);
}

// this method is called when your extension is deactivated
export function deactivate() {
	file_manager.destroy();
}
