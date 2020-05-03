import * as vscode from "vscode";
import { JobParser } from "../job_parsing/job_parser";
import { JobManager } from "../job_parsing/job_manager";
import { ProjectTemplateManager } from "../project_template_parsing/project_template_manager";
import { ProjectTemplateParser } from "../project_template_parsing/project_template_parser";

export class JobRenameProvider implements vscode.RenameProvider {
	constructor(
		private readonly job_manager: JobManager,
		private readonly project_template_manager: ProjectTemplateManager
	) {}

	provideRenameEdits(
		document: vscode.TextDocument,
		position: vscode.Position,
		newName: string,
		_token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.WorkspaceEdit> {
		let range = document.getWordRangeAtPosition(position);
		if (range) {
			let job_name = JobParser.parse_job_name_from_single_line(document, position.line);
			if (!job_name) {
				job_name = ProjectTemplateParser.parse_job_name_from_line_in_document(document, position.line);
			}
			if (job_name) {
				let job = this.job_manager.get_job_with_name(job_name);
				if (job) {
					let workspace_edit = new vscode.WorkspaceEdit();

					// Rename the main job name
					let job_name = job.get_name_value();
					let job_name_location = job.get_location_of_value(job_name);
					workspace_edit.replace(job.document, job_name_location.vscode_location, newName);

					// Rename all child jobs
					let child_jobs = this.job_manager.get_all_jobs_with_this_parent(job_name);
					if (child_jobs) {
						child_jobs.forEach((child_job) => {
							let parent_name = child_job.get_parent_value() as string;
							let parent_location = child_job.get_location_of_value(parent_name);
							workspace_edit.replace(child_job.document, parent_location.vscode_location, newName);
						});
					}

					// Rename all instances in project templates
					let project_template_jobs = this.project_template_manager.get_all_jobs_with_name(job_name);
					if (project_template_jobs) {
						project_template_jobs.forEach((job) => {
							workspace_edit.replace(job.document, job.range, newName);
						});
					}

					return workspace_edit;
				}
			}
		}
		return undefined;
	}

	prepareRename?(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.Range | { range: vscode.Range; placeholder: string }> {
		let range = document.getWordRangeAtPosition(position);
		if (range) {
			let job_name = JobParser.parse_job_name_from_single_line(document, position.line);
			if (job_name) {
				let job = this.job_manager.get_job_with_name(job_name);
				if (job) {
					let job_name = job.get_name_value();
					let job_name_location = job.get_location_of_value(job_name);
					let placeholder = job_name as string;
					let range = job_name_location.vscode_location;
					return { range, placeholder };
				}
			}
			job_name = ProjectTemplateParser.parse_job_name_from_line_in_document(document, position.line);
			if (job_name) {
				let location_data = this.project_template_manager.get_single_job_with_name_on_line(job_name, position.line);
				if (location_data) {
					let placeholder = job_name;
					let range = location_data.range;
					return { range, placeholder };
				}
			}
		}
		return undefined;
	}
}
