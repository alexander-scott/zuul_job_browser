import * as vscode from "vscode";
import { JobParser } from "./job_parser";
import { JobManager } from "./job_manager";

export class JobDefinitionProvider implements vscode.DefinitionProvider {
	private job_manager = new JobManager();

	constructor(job_manager: JobManager) {
		this.job_manager = job_manager;
	}
	provideDefinition(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.Location | vscode.Location[] | vscode.LocationLink[]> {
		let range = document.getWordRangeAtPosition(position);
		if (range) {
			// Make sure we are at a parent
			let parent_name = new JobParser().parse_parent_name_from_line_number(document, position.line);
			if (parent_name) {
				let parent_job = this.job_manager.get_a_single_job_with_name(parent_name).pop();
				if (parent_job) {
					return new vscode.Location(parent_job.document.uri, parent_job.job_name_location);
				}
			}
		}
		return undefined;
	}
}
