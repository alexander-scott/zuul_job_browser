import * as vscode from "vscode";
import { JobParser } from "./job_parser";
import { JobManager } from "./job_manager";

export class JobReferencesProvider implements vscode.ReferenceProvider {
	private job_manager = new JobManager();

	constructor(job_manager: JobManager) {
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
			let job = new JobParser().parse_job_from_line_number(document, position.line);
			if (job) {
				let child_jobs = this.job_manager.get_all_child_jobs(job.job_name);
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
