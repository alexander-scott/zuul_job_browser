import * as vscode from "vscode";
import { JobHierarchyProvider } from "./job_hierarchy_provider";
import { TextDecoder } from "util";
import { JobDefinitionparser } from "./job_definition_parser";
import { JobDefinitionProvider } from "./job_definition_provider";
import { JobHoverProvider } from "./job_hover_provider";
import { JobReferencesProvider } from "./job_references_provider";
import { JobManager } from "./job_manager";
import { JobSymbolWorkspaceDefinitionsProvider } from "./job_symbol_workspace_definitions_provider";
import { JobSymbolDocumentDefinitionsProvider } from "./job_symbol_document_definitions_provider";

const job_manager = new JobManager();

export function activate(context: vscode.ExtensionContext) {
	parse_job_definitions();

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
	// Disabled as this doesn't seem to work for now
	// context.subscriptions.push(
	// 	vscode.languages.registerWorkspaceSymbolProvider(new JobSymbolWorkspaceDefinitionsProvider(job_manager))
	// );

	//showSampleText(context);
}

async function showSampleText(context: vscode.ExtensionContext): Promise<void> {
	let sampleTextEncoded = await vscode.workspace.fs.readFile(vscode.Uri.file(context.asAbsolutePath("sample.yaml")));
	let sampleText = new TextDecoder("utf-8").decode(sampleTextEncoded);
	let doc = await vscode.workspace.openTextDocument({ language: "yaml", content: sampleText });
	vscode.window.showTextDocument(doc);
}

function parse_job_definitions() {
	const workspace = vscode.workspace.workspaceFolders![0];
	if (workspace) {
		vscode.workspace.findFiles(new vscode.RelativePattern(workspace, "**/zuul.d/*.yaml")).then((results) => {
			results.forEach(async (doc_uri) => {
				let document = await vscode.workspace.openTextDocument(doc_uri);
				JobDefinitionparser.parse_job_definitions_in_document(document, job_manager);
				vscode.workspace.onDidSaveTextDocument((doc) => update_job_hierarchy_after_file_changed(doc_uri));
			});
		});
	}
	console.log("Finished building job hierarchy");
}

function update_job_hierarchy_after_file_changed(doc_uri: vscode.Uri) {
	console.log("FILE CHANGED!!! - " + doc_uri);
	// TODO: Only parse the changed file
	parse_job_definitions();
}
function update_job_hierarchy_after_file_deleted(document: vscode.TextDocument) {
	console.log("FILE DELETED!!! - " + document.uri);
}
function update_job_hierarchy_after_file_renamed(document: vscode.TextDocument) {
	console.log("FILE RENAMED!!! - " + document.uri);
}

// this method is called when your extension is deactivated
export function deactivate() {}
