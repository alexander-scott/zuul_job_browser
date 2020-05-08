import * as vscode from "vscode";
import { JobManager } from "../job_parsing/job_manager";
import { ProjectTemplateManager } from "../project_template_parsing/project_template_manager";
import { Logger } from "./logger";
import { DocumentParser, ParseResult } from "./document_parser";

const Cache = require("vscode-cache");

/**
 * In change of parsing the relevant files and watching for if they change.
 */
export class FileManager {
	private file_watchers: vscode.FileSystemWatcher[] = [];
	private job_manager = new JobManager();
	private project_template_manager = new ProjectTemplateManager();
	private status_bar_item: vscode.StatusBarItem;
	private cache: any;

	constructor(private readonly workspace_pattern: string) {
		this.status_bar_item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
		this.status_bar_item.tooltip = "Rebuild Zuul Job Hierarchy";
		this.status_bar_item.command = "zuulplugin.rebuild-hierarchy";
	}

	initalise_cache(extension_context: vscode.ExtensionContext) {
		this.cache = new Cache(extension_context);
	}

	destroy() {
		this.file_watchers.forEach((file_watcher) => {
			file_watcher.dispose();
		});
		this.status_bar_item.dispose();
	}

	get_status_bar_icon(): vscode.StatusBarItem {
		return this.status_bar_item;
	}

	async parse_all_files() {
		this.job_manager.remove_all_jobs();
		this.project_template_manager.remove_all_templates();
		vscode.workspace.workspaceFolders?.forEach((workspace) => {
			vscode.workspace.findFiles(new vscode.RelativePattern(workspace, this.workspace_pattern)).then((results) => {
				results.forEach(async (doc_uri) => {
					this.parse_doc_and_update_managers(doc_uri);
				});
			});
		});
	}

	async parse_doc_and_update_managers(doc_uri: vscode.Uri) {
		let parse_result: ParseResult;
		if (this.cache.has(doc_uri)) {
			parse_result = this.parse_doc_from_cache(doc_uri);
		} else {
			parse_result = await this.parse_document_from_uri(doc_uri);
		}
		this.add_parse_result_to_managers(parse_result);
	}

	async parse_document_from_uri(doc_uri: vscode.Uri): Promise<ParseResult> {
		let document = await vscode.workspace.openTextDocument(doc_uri);
		Logger.getInstance().log("Start parsing " + document.uri.path);
		let doc_parser = new DocumentParser(document);
		doc_parser.parse_document();
		return doc_parser.get_parse_result();
	}

	parse_document_from_text_and_update_managers(document: vscode.TextDocument) {
		Logger.getInstance().log("Start parsing " + document.uri.path);
		let doc_parser = new DocumentParser(document);
		doc_parser.parse_document();
		this.add_parse_result_to_managers(doc_parser.get_parse_result());
	}

	parse_doc_from_cache(document: vscode.Uri): ParseResult {
		let parse_result = this.cache.get(document) as ParseResult;
		let now_date = new Date();
		return parse_result;
	}

	add_parse_result_to_managers(parse_result: ParseResult) {
		parse_result.get_jobs().forEach((job) => {
			this.job_manager.add_job(job);
		});
		parse_result.get_project_templates().forEach((template) => {
			this.project_template_manager.add_project_template(template);
		});
		Logger.getInstance().log(
			"Finished parsing " + parse_result.doc_uri + ". Increased total jobs by " + parse_result.get_jobs().length
		);
		this.update_status_bar();
	}

	set_file_watchers() {
		vscode.workspace.workspaceFolders?.forEach((workspace) => {
			let file_watcher = vscode.workspace.createFileSystemWatcher(
				new vscode.RelativePattern(workspace, this.workspace_pattern)
			);
			file_watcher.onDidChange((doc) => this.update_job_hierarchy_after_file_changed(doc));
			file_watcher.onDidCreate((doc) => this.update_job_hierarchy_after_file_created(doc));
			file_watcher.onDidDelete((doc) => this.update_job_hierarchy_after_files_deleted(doc));
			this.file_watchers.push(file_watcher);
		});
	}

	update_job_hierarchy_after_file_changed(doc: vscode.Uri) {
		this.project_template_manager.remove_all_templates_in_document(doc);
		this.job_manager.remove_all_jobs_in_document(doc);
		this.parse_doc_and_update_managers(doc);
		Logger.getInstance().log("Finished updating zuul config in " + doc.path);
	}
	update_job_hierarchy_after_file_created(doc: vscode.Uri) {
		this.parse_doc_and_update_managers(doc);
		Logger.getInstance().log("Finished updating zuul config in " + doc.path);
	}
	update_job_hierarchy_after_files_deleted(doc_uri: vscode.Uri) {
		Logger.getInstance().log("Removing jobs in: " + doc_uri.path);
		this.job_manager.remove_all_jobs_in_document(doc_uri);
		this.project_template_manager.remove_all_templates_in_document(doc_uri);
	}

	update_status_bar() {
		let total_jobs = this.job_manager.get_total_jobs_parsed();
		this.status_bar_item.text = `$(lightbulb) ${total_jobs} job(s) parsed`;
		this.status_bar_item.show();
	}

	get_job_manager(): JobManager {
		return this.job_manager;
	}

	get_project_template_manager(): ProjectTemplateManager {
		return this.project_template_manager;
	}
}
