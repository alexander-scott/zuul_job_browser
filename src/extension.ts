import * as vscode from "vscode";
import { JobHierarchyProvider } from "./providers/job_hierarchy_provider";
import { JobDefinitionparser } from "./job_definition_parser";
import { JobDefinitionProvider } from "./providers/job_definition_provider";
import { JobHoverProvider } from "./providers/job_hover_provider";
import { JobReferencesProvider } from "./providers/job_references_provider";
import { JobDefinitionManager } from "./job_definition_manager";
import { JobSymbolWorkspaceDefinitionsProvider } from "./providers/job_symbol_workspace_definitions_provider";
import { JobSymbolDocumentDefinitionsProvider } from "./providers/job_symbol_document_definitions_provider";

const job_manager = new JobDefinitionManager();
const workspace_pattern = "**/zuul.d/*.yaml";

export function activate(context: vscode.ExtensionContext) {
	build_job_hierarchy();

	context.subscriptions.push(
		vscode.languages.registerCallHierarchyProvider("yaml", new JobHierarchyProvider(job_manager))
	);
	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider("yaml", new JobDefinitionProvider(job_manager))
	);
	context.subscriptions.push(vscode.languages.registerHoverProvider("yaml", new JobHoverProvider(job_manager)));
	context.subscriptions.push(
		vscode.languages.registerReferenceProvider("yaml", new JobReferencesProvider(job_manager))
	);
	context.subscriptions.push(
		vscode.languages.registerDocumentSymbolProvider("yaml", new JobSymbolDocumentDefinitionsProvider(job_manager))
	);
	context.subscriptions.push(
		vscode.languages.registerWorkspaceSymbolProvider(new JobSymbolWorkspaceDefinitionsProvider(job_manager))
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("zuulplugin.rebuild-hierarchy", () => {
			build_job_hierarchy();
		})
	);
	// vscode.workspace.onDidSaveTextDocument((doc) => update_job_hierarchy_after_file_changed(doc));
	// vscode.workspace.onDidDeleteFiles((doc) => update_job_hierarchy_after_files_deleted(doc.files));
	// vscode.workspace.onDidRenameFiles((doc) => update_job_hierarchy_after_file_renamed(doc.files));

	const workspace = vscode.workspace.workspaceFolders![0];
	let filewatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspace, workspace_pattern));
	filewatcher.onDidChange((doc) => update_job_hierarchy_after_file_changed(doc));
	filewatcher.onDidCreate((doc) => update_job_hierarchy_after_file_created(doc));
	filewatcher.onDidDelete((doc) => update_job_hierarchy_after_files_deleted(doc));
}

function build_job_hierarchy() {
	job_manager.remove_all_jobs();
	const workspace = vscode.workspace.workspaceFolders![0];
	if (workspace) {
		vscode.workspace.findFiles(new vscode.RelativePattern(workspace, workspace_pattern)).then((results) => {
			results.forEach(async (doc_uri) => {
				let document = await vscode.workspace.openTextDocument(doc_uri);
				JobDefinitionparser.parse_job_definitions_in_document(document, job_manager);
			});
		});
	}
	console.log("Finished building job hierarchy");
}

async function update_job_hierarchy_after_file_changed(doc: vscode.Uri) {
	console.log("Starting updating jobs in " + doc.path);
	job_manager.remove_all_jobs_in_document(doc);
	let document = await vscode.workspace.openTextDocument(doc);
	JobDefinitionparser.parse_job_definitions_in_document(document, job_manager);
	console.log("Finished updating jobs in " + doc.path);
}
async function update_job_hierarchy_after_file_created(doc: vscode.Uri) {
	console.log("Starting parsing jobs in " + doc.path);
	let document = await vscode.workspace.openTextDocument(doc);
	JobDefinitionparser.parse_job_definitions_in_document(document, job_manager);
	console.log("Starting parsing jobs in " + doc.path);
}
function update_job_hierarchy_after_files_deleted(doc_uri: vscode.Uri) {
	console.log("Removing jobs in: " + doc_uri.path);
	job_manager.remove_all_jobs_in_document(doc_uri);
}
function update_job_hierarchy_after_file_renamed(doc_uris: ReadonlyArray<{ oldUri: vscode.Uri; newUri: vscode.Uri }>) {
	doc_uris.forEach(async (doc_uri) => {
		console.log("Removing jobs existing in file: " + doc_uri.oldUri.path);
		job_manager.remove_all_jobs_in_document(doc_uri.oldUri);
		console.log("Parsing jobs existing in file: " + doc_uri.newUri.path);
		let document = await vscode.workspace.openTextDocument(doc_uri.newUri);
		JobDefinitionparser.parse_job_definitions_in_document(document, job_manager);
	});
	console.log("Finished rebuilding job hierarchy");
}

// this method is called when your extension is deactivated
export function deactivate() {}
