import * as vscode from "vscode";
import { JobHierarchyProvider } from "./providers/job_hierarchy_provider";
import { JobDefinitionProvider } from "./providers/job_definition_provider";
import { JobHoverProvider } from "./providers/job_hover_provider";
import { JobReferencesProvider } from "./providers/job_references_provider";
import { JobSymbolWorkspaceDefinitionsProvider } from "./providers/job_symbol_workspace_definitions_provider";
import { JobSymbolDocumentDefinitionsProvider } from "./providers/job_symbol_document_definitions_provider";
import { FileManager } from "./file_manager";

const workspace_pattern = "**/zuul.d/*.yaml";
const file_manager = new FileManager(workspace_pattern);

export function activate(context: vscode.ExtensionContext) {
	file_manager.build_job_hierarchy();

	context.subscriptions.push(
		vscode.languages.registerCallHierarchyProvider(
			{ scheme: "file", language: "yaml" },
			new JobHierarchyProvider(file_manager.get_job_manager())
		)
	);
	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider(
			{ scheme: "file", language: "yaml" },
			new JobDefinitionProvider(file_manager.get_job_manager(), file_manager.get_project_template_mannager())
		)
	);
	context.subscriptions.push(
		vscode.languages.registerHoverProvider(
			{ scheme: "file", language: "yaml" },
			new JobHoverProvider(file_manager.get_job_manager(), file_manager.get_project_template_mannager())
		)
	);
	context.subscriptions.push(
		vscode.languages.registerReferenceProvider(
			{ scheme: "file", language: "yaml" },
			new JobReferencesProvider(file_manager.get_job_manager(), file_manager.get_project_template_mannager())
		)
	);
	context.subscriptions.push(
		vscode.languages.registerDocumentSymbolProvider(
			{ scheme: "file", language: "yaml" },
			new JobSymbolDocumentDefinitionsProvider(file_manager.get_job_manager())
		)
	);
	context.subscriptions.push(
		vscode.languages.registerWorkspaceSymbolProvider(
			new JobSymbolWorkspaceDefinitionsProvider(file_manager.get_job_manager())
		)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("zuulplugin.rebuild-hierarchy", () => {
			file_manager.build_job_hierarchy();
		})
	);

	file_manager.set_file_watchers();
}

// this method is called when your extension is deactivated
export function deactivate() {
	file_manager.destroy();
}
