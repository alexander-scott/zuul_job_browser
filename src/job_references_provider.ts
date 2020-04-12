import * as vscode from "vscode";
import { JobHierarchyParser } from "./job_hierarchy_parser";
import { JobParser } from "./job_parser";

export class JobReferencesProvider implements vscode.ReferenceProvider {
	private job_hierarchy_provider = new JobHierarchyParser();

	constructor(parser: JobHierarchyParser) {
		this.job_hierarchy_provider = parser;
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
			let job = new JobParser().parse_job_from_line_number(document, position.line);
			if (job) {
				let child_jobs = this.job_hierarchy_provider.get_job_manager().get_all_child_jobs(job.job_name);
				if (child_jobs) {
					let locations: vscode.Location[] = [];
					child_jobs.forEach((element) => {
						let location = new vscode.Location(element.document.uri, element.parent_name_location);
						locations.push(location);
					});
					return locations;
				}
			}
		}
		return undefined;
	}
}
