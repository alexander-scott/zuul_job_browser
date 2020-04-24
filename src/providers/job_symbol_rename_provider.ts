import * as vscode from "vscode";
import { JobParser } from "../job_parsing/job_parser";
import { JobDefinitionManager } from "../job_parsing/job_definition_manager";
import { ProjectTemplateManager } from "../project_template_parsing/project_template_manager";

export class JobRenameProvider implements vscode.RenameProvider {
	constructor(
		private readonly job_manager: JobDefinitionManager,
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
			let job_name = JobParser.parse_job_from_random_line_number(document, position.line);
			if (job_name) {
				let job = this.job_manager.get_job_with_name(job_name);
				if (job) {
					let workspace_edit = new vscode.WorkspaceEdit();
					let name_attribute = job.get_job_name_attribute();
					workspace_edit.replace(name_attribute.location.document, name_attribute.location.range, newName);
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
			let job_name = JobParser.parse_job_from_random_line_number(document, position.line);
			if (job_name) {
				let job = this.job_manager.get_job_with_name(job_name);
				if (job) {
					let name_attribute = job.get_job_name_attribute();
					let placeholder = name_attribute.value as string;
					let range = name_attribute.location.range;
					return { range, placeholder };
				}
			}
		}
		return undefined;
	}
}
