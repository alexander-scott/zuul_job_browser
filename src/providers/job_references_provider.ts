import * as vscode from "vscode";
import { JobParser } from "../job_parsing/job_parser";
import { JobDefinitionManager } from "../job_parsing/job_definition_manager";

export class JobReferencesProvider implements vscode.ReferenceProvider {
	private job_manager = new JobDefinitionManager();

	constructor(job_manager: JobDefinitionManager) {
		this.job_manager = job_manager;
	}

	provideReferences(
		document: vscode.TextDocument,
		position: vscode.Position,
		context: vscode.ReferenceContext,
		token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.Location[]> {
		let range = document.getWordRangeAtPosition(position);
		if (range) {
			// Make sure we are at a parent
			let parent_job = new JobParser().parse_job_from_line_number(document, position.line);
			if (parent_job) {
				let child_jobs = this.job_manager.get_all_jobs_with_this_parent(
					parent_job.get_job_name_attribute().attribute_value
				);
				if (child_jobs) {
					let locations: vscode.Location[] = [];
					child_jobs.forEach((child_job) => {
						let name_attribute = child_job.get_job_name_attribute();
						let location = new vscode.Location(name_attribute.document, name_attribute.attribute_location);
						locations.push(location);
					});
					return locations;
				}
			}
		}
		return undefined;
	}
}
