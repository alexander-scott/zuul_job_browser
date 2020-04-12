import * as vscode from "vscode";
import { JobHierarchyProvider } from "./job_hierarchy_provider";
import { TextDecoder } from "util";
import { JobHierarchyParser } from "./job_hierarchy_parser";
import { JobDefinitionProvider } from "./job_definition_provider";

const job_hierarchy_provider = new JobHierarchyParser();

export function activate(context: vscode.ExtensionContext) {
	parse_job_hierarchy();

	context.subscriptions.push(
		vscode.languages.registerCallHierarchyProvider("yaml", new JobHierarchyProvider(job_hierarchy_provider))
	);
	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider("yaml", new JobDefinitionProvider(job_hierarchy_provider))
	);

	//showSampleText(context);
}

async function showSampleText(context: vscode.ExtensionContext): Promise<void> {
	let sampleTextEncoded = await vscode.workspace.fs.readFile(vscode.Uri.file(context.asAbsolutePath("sample.yaml")));
	let sampleText = new TextDecoder("utf-8").decode(sampleTextEncoded);
	let doc = await vscode.workspace.openTextDocument({ language: "yaml", content: sampleText });
	vscode.window.showTextDocument(doc);
}

function parse_job_hierarchy() {
	const workspace = vscode.workspace.workspaceFolders![0];
	if (workspace) {
		vscode.workspace.findFiles(new vscode.RelativePattern(workspace, "**/zuul.d/*.yaml")).then((results) => {
			results.forEach(async (doc_uri) => {
				let document = await vscode.workspace.openTextDocument(doc_uri);
				job_hierarchy_provider._parseJobHierarchy(document);
				vscode.workspace.onDidSaveTextDocument((doc) => update_job_hierarchy_after_file_changed(doc_uri));
			});
		});
	}
	console.log("Finished building job hierarchy");
}

function update_job_hierarchy_after_file_changed(doc_uri: vscode.Uri) {
	console.log("FILE CHANGED!!! - " + doc_uri);
	// TODO: Only parse the changed file
	parse_job_hierarchy();
}
function update_job_hierarchy_after_file_deleted(document: vscode.TextDocument) {
	console.log("FILE DELETED!!! - " + document.uri);
}
function update_job_hierarchy_after_file_renamed(document: vscode.TextDocument) {
	console.log("FILE RENAMED!!! - " + document.uri);
}

// this method is called when your extension is deactivated
export function deactivate() {}
