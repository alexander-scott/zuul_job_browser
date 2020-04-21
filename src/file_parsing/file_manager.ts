import * as vscode from "vscode";
import { JobDefinitionManager } from "../job_parsing/job_definition_manager";
import { ProjectTemplateJobManager } from "../project_template_parsing/project_template_job_manager";
import { ProjectTemplateParser } from "../project_template_parsing/project_template_parser";
import { DocType } from "../doc_type";
import { JobDefinitionparser } from "../job_parsing/job_definition_parser";
import * as yaml from "js-yaml";

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
						const objects = yaml.safeLoad(document.getText());
						if (objects) {
							objects.forEach((object: any) => {
								if (object["job"]) {
									let job = JobDefinitionparser.parse_job_definitions(document, object["job"]);
									this.job_manager.add_job(job);
								} else if (object["project-template"]) {
									let project_template = ProjectTemplateParser.parse_project_template(
										document,
										object["project-template"]
									);
									this.project_template_job_manager.add_project_template(project_template);
								}
							});
						}
						//JobDefinitionparser.parse_job_definitions_in_document_using_parser(document, this.job_manager);
						JobDefinitionparser.parse_job_location_data(document, this.job_manager);
						ProjectTemplateParser.parse_project_template_in_document(document, this.project_template_job_manager);
					});
				});
			});
		}
		console.log("Finished building job hierarchy");
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
		if (this.project_template_job_manager.is_known_file(doc)) {
			console.log("Starting updating project template in " + doc.path);
			this.project_template_job_manager.remove_all_jobs_in_document(doc);
			ProjectTemplateParser.parse_project_template_in_document(document, this.project_template_job_manager);
			console.log("Finished updating project template in " + doc.path);
		} else if (this.job_manager.is_known_file(doc)) {
			console.log("Starting updating jobs in " + doc.path);
			this.job_manager.remove_all_jobs_in_document(doc);
			JobDefinitionparser.parse_job_location_data(document, this.job_manager);
			console.log("Finished updating jobs in " + doc.path);
		} else {
			this.update_job_hierarchy_after_file_created(doc);
		}
	}
	async update_job_hierarchy_after_file_created(doc: vscode.Uri) {
		let document = await vscode.workspace.openTextDocument(doc);
		if (DocType.is_a_project_template(document)) {
			console.log("Starting parsing project template in " + doc.path);
			ProjectTemplateParser.parse_project_template_in_document(document, this.project_template_job_manager);
			console.log("Finished parsing project template in " + doc.path);
		} else {
			console.log("Starting parsing jobs in " + doc.path);
			JobDefinitionparser.parse_job_location_data(document, this.job_manager);
			console.log("Finished parsing jobs in " + doc.path);
		}
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
