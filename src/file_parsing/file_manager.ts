import * as vscode from "vscode";
import { JobManager } from "../job_parsing/job_manager";
import { ProjectTemplateManager } from "../project_template_parsing/project_template_manager";
import { Logger } from "./logger";
import { DocumentParser, ParseResult } from "./document_parser";
import { FileStatHelpers } from "./file_stat";
import { serialize, deserialize } from "class-transformer";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Cache = require("vscode-cache");

/**
 * In change of parsing the relevant files and watching for if they change.
 */
export class FileManager {
private fileWatchers: vscode.FileSystemWatcher[] = [];
private jobManager = new JobManager();
private projectTemplateManager = new ProjectTemplateManager();
private statusBarItem: vscode.StatusBarItem;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
private cache: any;

constructor(private readonly workspace_pattern: string) {
this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
this.statusBarItem.tooltip = "Rebuild Zuul Job Hierarchy";
this.statusBarItem.command = "zuulplugin.rebuild-hierarchy";
}

initializeCache(extension_context: vscode.ExtensionContext) {
this.cache = new Cache(extension_context);
}

destroy() {
this.fileWatchers.forEach((fileWatcher) => {
fileWatcher.dispose();
});
this.statusBarItem.dispose();
}

clear_cache() {
this.cache.flush();
}

parse_all_files() {
this.jobManager.remove_all_jobs();
this.projectTemplateManager.remove_all_templates();
vscode.workspace.workspaceFolders?.forEach((workspace) => {
vscode.workspace.findFiles(new vscode.RelativePattern(workspace, this.workspace_pattern)).then((documentUris) => {
documentUris.forEach(async (documentUri) => {
this.parse_doc_and_update_managers(documentUri);
});
});
});
}

parse_doc_and_update_managers(documentUri: vscode.Uri) {
if (this.cache.has(documentUri.path)) {
this.parse_doc_from_cache(documentUri).then((parseResult) => {
this.add_parse_result_to_managers(parseResult);
});
} else {
this.parse_document_from_uri(documentUri).then((parseResult) => {
this.add_parse_result_to_managers(parseResult);
});
}
}

async parse_document_from_uri(documentUri: vscode.Uri): Promise<ParseResult> {
Logger.getInstance().log("Start parsing " + documentUri.path);
const document = await vscode.workspace.openTextDocument(documentUri);
const stat = await new FileStatHelpers().stat(documentUri);
const documentParser = new DocumentParser(document);
documentParser.parse_document();
const parseResult = documentParser.get_parse_result();
parseResult.set_modification_time(stat.mtime);
this.cache.put(documentUri.path, serialize(parseResult));
return parseResult;
}

async parse_doc_from_cache(documentUri: vscode.Uri): Promise<ParseResult> {
Logger.getInstance().log("Loading from cache " + documentUri.path);
const parseResult = deserialize(ParseResult, this.cache.get(documentUri.path));
const stat = await new FileStatHelpers().stat(documentUri);
if (stat.mtime > parseResult.fileModificationTime) {
return this.parse_document_from_uri(documentUri);
}
return parseResult;
}

parse_document_from_text_and_update_managers(document: vscode.TextDocument) {
Logger.getInstance().log("Start parsing " + document.uri.path);
const documentParser = new DocumentParser(document);
documentParser.parse_document();
this.add_parse_result_to_managers(documentParser.get_parse_result());
}

add_parse_result_to_managers(parseResult: ParseResult) {
parseResult.jobs.forEach((job) => {
this.jobManager.add_job(job);
});
parseResult.project_templates.forEach((template) => {
this.projectTemplateManager.add_project_template(template);
});
Logger.getInstance().log(
"Finished parsing " + parseResult.documentUri + ". Increased total jobs by " + parseResult.jobs.length
);
this.update_status_bar();
}

set_file_watchers() {
vscode.workspace.workspaceFolders?.forEach((workspace) => {
const fileWatcher = vscode.workspace.createFileSystemWatcher(
new vscode.RelativePattern(workspace, this.workspace_pattern)
);
fileWatcher.onDidChange((documentUri) => this.update_job_hierarchy_after_file_changed(documentUri));
fileWatcher.onDidCreate((documentUri) => this.update_job_hierarchy_after_file_created(documentUri));
fileWatcher.onDidDelete((documentUri) => this.update_job_hierarchy_after_files_deleted(documentUri));
this.fileWatchers.push(fileWatcher);
});
}

update_job_hierarchy_after_file_changed(documentUri: vscode.Uri) {
this.projectTemplateManager.remove_all_templates_in_document(documentUri);
this.jobManager.remove_all_jobs_in_document(documentUri);
this.parse_doc_and_update_managers(documentUri);
Logger.getInstance().log("Finished updating zuul config in " + documentUri.path);
}
update_job_hierarchy_after_file_created(documentUri: vscode.Uri) {
this.parse_doc_and_update_managers(documentUri);
Logger.getInstance().log("Finished updating zuul config in " + documentUri.path);
}
update_job_hierarchy_after_files_deleted(documentUri: vscode.Uri) {
Logger.getInstance().log("Removing jobs in: " + documentUri.path);
this.jobManager.remove_all_jobs_in_document(documentUri);
this.projectTemplateManager.remove_all_templates_in_document(documentUri);
}

update_status_bar() {
const totalJobsParsed = this.jobManager.get_total_jobs_parsed();
this.statusBarItem.text = `$(lightbulb) ${totalJobsParsed} job(s) parsed`;
this.statusBarItem.show();
}

get_status_bar_icon(): vscode.StatusBarItem {
return this.statusBarItem;
}

get_job_manager(): JobManager {
return this.jobManager;
}

get_project_template_manager(): ProjectTemplateManager {
return this.projectTemplateManager;
}
}
