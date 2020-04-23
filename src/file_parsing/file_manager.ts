import * as vscode from "vscode";
import { JobDefinitionManager } from "../job_parsing/job_definition_manager";
import { ProjectTemplateJobManager } from "../project_template_parsing/project_template_job_manager";
import { ProjectTemplateParser } from "../project_template_parsing/project_template_parser";
import { JobDefinitionparser } from "../job_parsing/job_definition_parser";
import * as yaml from "js-yaml";
import { Job } from "../data_structures/job";
import { ProjectTemplate } from "../data_structures/project_template";

export class FileManager {
	private file_watchers: vscode.FileSystemWatcher[] = [];
	private job_manager = new JobDefinitionManager();
	private project_template_job_manager = new ProjectTemplateJobManager();

	constructor(private readonly workspace_pattern: string) {}

	destroy() {
		this.file_watchers.forEach((file_watcher) => {
			file_watcher.dispose();
		});
	}

	async parse_all_files() {
		this.job_manager.remove_all_jobs();
		if (vscode.workspace.workspaceFolders) {
			vscode.workspace.workspaceFolders.forEach((workspace) => {
				vscode.workspace.findFiles(new vscode.RelativePattern(workspace, this.workspace_pattern)).then((results) => {
					results.forEach(async (doc_uri) => {
						let document = await vscode.workspace.openTextDocument(doc_uri);
						this.parse_document(document);
					});
				});
			});
		}
		console.log("Finished building job hierarchy");
	}

	parse_document(document: vscode.TextDocument) {
		let new_jobs: Job[] = [];
		let new_project_templates: ProjectTemplate[] = [];
		const objects = yaml.safeLoad(document.getText());
		if (objects) {
			objects.forEach((object: any) => {
				if (object["job"]) {
					let job = JobDefinitionparser.parse_job_definitions(document, object["job"]);
					new_jobs.push(job);
				} else if (object["project-template"]) {
					let project_template = ProjectTemplateParser.parse_project_template(document, object["project-template"]);
					new_project_templates.push(project_template);
				}
			});
		}
		new_jobs.forEach((job) => {
			this.job_manager.add_job(job);
		});
		new_project_templates.forEach((template) => {
			this.project_template_job_manager.add_project_template(template);
		});
		ProjectTemplateParser.parse_job_location_data(new_project_templates, document, this.project_template_job_manager);
		JobDefinitionparser.parse_job_location_data(document, this.job_manager);
	}

	set_file_watchers() {
		if (vscode.workspace.workspaceFolders) {
			vscode.workspace.workspaceFolders.forEach((workspace) => {
				let file_watcher = vscode.workspace.createFileSystemWatcher(
					new vscode.RelativePattern(workspace, this.workspace_pattern)
				);
				file_watcher.onDidChange((doc) => this.update_job_hierarchy_after_file_changed(doc));
				file_watcher.onDidCreate((doc) => this.update_job_hierarchy_after_file_created(doc));
				file_watcher.onDidDelete((doc) => this.update_job_hierarchy_after_files_deleted(doc));
				this.file_watchers.push(file_watcher);
			});
		}
	}

	async update_job_hierarchy_after_file_changed(doc: vscode.Uri) {
		let document = await vscode.workspace.openTextDocument(doc);
		this.project_template_job_manager.remove_all_jobs_in_document(doc);
		this.job_manager.remove_all_jobs_in_document(doc);
		this.parse_document(document);
		console.log("Finished updating zuul config in " + doc.path);
	}
	async update_job_hierarchy_after_file_created(doc: vscode.Uri) {
		let document = await vscode.workspace.openTextDocument(doc);
		this.parse_document(document);
		console.log("Finished updating zuul config in " + doc.path);
	}
	update_job_hierarchy_after_files_deleted(doc_uri: vscode.Uri) {
		console.log("Removing jobs in: " + doc_uri.path);
		this.job_manager.remove_all_jobs_in_document(doc_uri);
		this.project_template_job_manager.remove_all_jobs_in_document(doc_uri);
	}

	get_job_manager(): JobDefinitionManager {
		return this.job_manager;
	}

	get_project_template_mannager(): ProjectTemplateJobManager {
		return this.project_template_job_manager;
	}
}
