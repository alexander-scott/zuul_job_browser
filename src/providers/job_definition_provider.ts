import * as vscode from "vscode";
import { JobParser } from "../job_parsing/job_parser";
import { JobDefinitionManager } from "../job_parsing/job_definition_manager";

export class JobDefinitionProvider implements vscode.DefinitionProvider {
	private job_manager = new JobDefinitionManager();

	constructor(job_manager: JobDefinitionManager) {
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
				let parent_job = this.job_manager.get_job_with_name(parent_name);
				if (parent_job) {
					let attribute = parent_job.get_job_name_attribute();
					if (!attribute) {
						throw new Error("Parent attribute doesn't exist>?!?!?!?!");
					}
					return new vscode.Location(attribute.document, attribute.attribute_location);
				}
			}
		}
		return undefined;
	}
}
