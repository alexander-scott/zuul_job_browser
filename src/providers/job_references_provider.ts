import * as vscode from "vscode";
import { JobParser } from "../job_parsing/job_parser";
import { JobManager } from "../job_parsing/job_manager";
import { ProjectTemplateManager } from "../project_template_parsing/project_template_manager";

export class JobReferencesProvider implements vscode.ReferenceProvider {
	constructor(
		private readonly job_manager: JobManager,
		private readonly project_template_manager: ProjectTemplateManager
	) {}

	provideReferences(
		document: vscode.TextDocument,
		position: vscode.Position,
		_context: vscode.ReferenceContext,
		_token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.Location[]> {
		let range = document.getWordRangeAtPosition(position);
		if (range) {
			let job_name = JobParser.parse_job_from_random_line_number(document, position.line);
			if (job_name) {
				let job = this.job_manager.get_job_with_name(job_name);
				if (job) {
					let child_jobs = this.job_manager.get_all_jobs_with_this_parent(job_name);
					let locations: vscode.Location[] = [];
					if (child_jobs) {
						child_jobs.forEach((child_job) => {
							let name_attribute = child_job.get_job_name_attribute();
							let location = new vscode.Location(name_attribute.location.document, name_attribute.location.range);
							locations.push(location);
						});
					}
					let project_template_jobs = this.project_template_manager.get_all_jobs_with_name(job_name);
					if (project_template_jobs) {
						project_template_jobs.forEach((job) => {
							let location = new vscode.Location(job.document, job.range);
							locations.push(location);
						});
					}
					return locations;
				}
			}
		}
		return undefined;
	}
}
