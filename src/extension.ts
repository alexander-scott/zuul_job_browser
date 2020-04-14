import * as vscode from "vscode";
import { JobHierarchyProvider } from "./providers/job_hierarchy_provider";
import { JobDefinitionparser } from "./job_parsing/job_definition_parser";
import { JobDefinitionProvider } from "./providers/job_definition_provider";
import { JobHoverProvider } from "./providers/job_hover_provider";
import { JobReferencesProvider } from "./providers/job_references_provider";
import { JobDefinitionManager } from "./job_parsing/job_definition_manager";
import { JobSymbolWorkspaceDefinitionsProvider } from "./providers/job_symbol_workspace_definitions_provider";
import { JobSymbolDocumentDefinitionsProvider } from "./providers/job_symbol_document_definitions_provider";
import { ProjectTemplateParser } from "./project_template_parsing/project_template_parser";
import { ProjectTemplateJobManager } from "./project_template_parsing/project_template_job_manager";
import { DocType } from "./doc_type";

const job_manager = new JobDefinitionManager();
const project_template_job_manager = new ProjectTemplateJobManager();
const workspace_pattern = "**/zuul.d/*.yaml";

export function activate(context: vscode.ExtensionContext) {
	build_job_hierarchy();

	context.subscriptions.push(
		vscode.languages.registerCallHierarchyProvider("yaml", new JobHierarchyProvider(job_manager))
	);
	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider(
			"yaml",
			new JobDefinitionProvider(job_manager, project_template_job_manager)
		)
	);
	context.subscriptions.push(
		vscode.languages.registerHoverProvider("yaml", new JobHoverProvider(job_manager, project_template_job_manager))
	);
	context.subscriptions.push(
		vscode.languages.registerReferenceProvider(
			"yaml",
			new JobReferencesProvider(job_manager, project_template_job_manager)
		)
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

	const workspace = vscode.workspace.workspaceFolders![0];
	let filewatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspace, workspace_pattern));
	filewatcher.onDidChange((doc) => update_job_hierarchy_after_file_changed(doc));
	filewatcher.onDidCreate((doc) => update_job_hierarchy_after_file_created(doc));
	filewatcher.onDidDelete((doc) => update_job_hierarchy_after_files_deleted(doc));
}

function build_job_hierarchy() {
	job_manager.remove_all_jobs();
	if (vscode.workspace.workspaceFolders) {
		vscode.workspace.workspaceFolders.forEach((workspace) => {
			vscode.workspace.findFiles(new vscode.RelativePattern(workspace, workspace_pattern)).then((results) => {
				results.forEach(async (doc_uri) => {
					let document = await vscode.workspace.openTextDocument(doc_uri);
					if (DocType.is_a_project_template(document)) {
						ProjectTemplateParser.parse_project_template_in_document(document, project_template_job_manager);
					} else {
						JobDefinitionparser.parse_job_definitions_in_document(document, job_manager);
					}
				});
			});
		});
	}
	console.log("Finished building job hierarchy");
}

async function update_job_hierarchy_after_file_changed(doc: vscode.Uri) {
	let document = await vscode.workspace.openTextDocument(doc);
	if (project_template_job_manager.is_known_file(doc)) {
		console.log("Starting updating project template in " + doc.path);
		project_template_job_manager.remove_all_jobs_in_document(doc);
		ProjectTemplateParser.parse_project_template_in_document(document, project_template_job_manager);
		console.log("Finished updating project template in " + doc.path);
	} else if (job_manager.is_known_file(doc)) {
		console.log("Starting updating jobs in " + doc.path);
		job_manager.remove_all_jobs_in_document(doc);
		JobDefinitionparser.parse_job_definitions_in_document(document, job_manager);
		console.log("Finished updating jobs in " + doc.path);
	} else {
		update_job_hierarchy_after_file_created(doc);
	}
}
async function update_job_hierarchy_after_file_created(doc: vscode.Uri) {
	let document = await vscode.workspace.openTextDocument(doc);
	if (DocType.is_a_project_template(document)) {
		console.log("Starting parsing project template in " + doc.path);
		ProjectTemplateParser.parse_project_template_in_document(document, project_template_job_manager);
		console.log("Finished parsing project template in " + doc.path);
	} else {
		console.log("Starting parsing jobs in " + doc.path);
		JobDefinitionparser.parse_job_definitions_in_document(document, job_manager);
		console.log("Finished parsing jobs in " + doc.path);
	}
}
function update_job_hierarchy_after_files_deleted(doc_uri: vscode.Uri) {
	console.log("Removing jobs in: " + doc_uri.path);
	job_manager.remove_all_jobs_in_document(doc_uri);
	project_template_job_manager.remove_all_jobs_in_document(doc_uri);
}

// this method is called when your extension is deactivated
export function deactivate() {}
