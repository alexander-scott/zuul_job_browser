import * as vscode from "vscode";
import { JobManager } from "../job_parsing/job_manager";
import { ProjectTemplateManager } from "../project_template_parsing/project_template_manager";
import { ProjectTemplateParser } from "../project_template_parsing/project_template_parser";
import * as yaml from "js-yaml";
import { ProjectTemplate } from "../data_structures/project_template";
import { JobParser } from "../job_parsing/job_parser";
import { Logger } from "./logger";
import { FileParser } from "./file_parser";
import { NewJob } from "../data_structures/new_job";

/**
 * In change of parsing the relevant files and watching for if they change.
 */
export class FileManager {
	private file_watchers: vscode.FileSystemWatcher[] = [];
	private job_manager = new JobManager();
	private project_template_manager = new ProjectTemplateManager();
	private status_bar_item: vscode.StatusBarItem;

	private readonly unknown_yaml_tags: string[] = ["!encrypted/pkcs1-oaep"];

	constructor(private readonly workspace_pattern: string) {
		this.status_bar_item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
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
					let document = await vscode.workspace.openTextDocument(doc_uri);
					this.parse_document(document);
				});
			});
		});
	}

	parse_document(document: vscode.TextDocument) {
		Logger.getInstance().log("Start parsing " + document.uri.path);
		let file_parser = new FileParser(document);
		let new_jobs: NewJob[] = [];
		let new_project_templates: ProjectTemplate[] = [];
		const objects = yaml.load(document.getText(), {
			schema: this.create_yaml_parsing_schema(),
			listener: file_parser.listener,
		});
		new_jobs = file_parser.get_jobs();
		objects?.forEach((object: any) => {
			if (object["job"]) {
				//let job = JobParser.parse_job_from_yaml_object(document, object["job"]);
				//new_jobs.push(job);
			} else if (object["project-template"]) {
				let project_template = ProjectTemplateParser.parse_project_template_from_yaml_object(
					document,
					object["project-template"]
				);
				new_project_templates.push(project_template);
			}
		});
		new_jobs.forEach((job) => {
			this.job_manager.add_job(job);
		});
		new_project_templates.forEach((template) => {
			this.project_template_manager.add_project_template(template);
		});
		ProjectTemplateParser.parse_job_location_data(new_project_templates, document, this.project_template_manager);
		JobParser.parse_job_location_data_in_document(document, this.job_manager);
		Logger.getInstance().log("Finished parsing " + document.uri.path + ". Increased total jobs by " + new_jobs.length);
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

	async update_job_hierarchy_after_file_changed(doc: vscode.Uri) {
		let document = await vscode.workspace.openTextDocument(doc);
		this.project_template_manager.remove_all_templates_in_document(doc);
		this.job_manager.remove_all_jobs_in_document(doc);
		this.parse_document(document);
		Logger.getInstance().log("Finished updating zuul config in " + doc.path);
	}
	async update_job_hierarchy_after_file_created(doc: vscode.Uri) {
		let document = await vscode.workspace.openTextDocument(doc);
		this.parse_document(document);
		Logger.getInstance().log("Finished updating zuul config in " + doc.path);
	}
	update_job_hierarchy_after_files_deleted(doc_uri: vscode.Uri) {
		Logger.getInstance().log("Removing jobs in: " + doc_uri.path);
		this.job_manager.remove_all_jobs_in_document(doc_uri);
		this.project_template_manager.remove_all_templates_in_document(doc_uri);
	}

	update_status_bar() {
		let total_jobs = this.job_manager.get_total_jobs_parsed();
		this.status_bar_item.text = `$(megaphone) ${total_jobs} job(s) parsed`;
		this.status_bar_item.show();
	}

	create_yaml_parsing_schema(): yaml.Schema {
		let yaml_types: yaml.Type[] = [];
		this.unknown_yaml_tags.forEach((tag) => {
			yaml_types.push(new yaml.Type(tag, { kind: "sequence" }));
		});
		return yaml.Schema.create(yaml_types);
	}

	get_job_manager(): JobManager {
		return this.job_manager;
	}

	get_project_template_mannager(): ProjectTemplateManager {
		return this.project_template_manager;
	}
}
