import * as vscode from "vscode";
import { JobParser } from "../job_parsing/job_parser";
import { JobDefinitionManager } from "../job_parsing/job_definition_manager";
import { ProjectTemplateManager } from "../project_template_parsing/project_template_manager";
import { ProjectTemplateParser } from "../project_template_parsing/project_template_parser";

export class JobDefinitionProvider implements vscode.DefinitionProvider {
	constructor(
		private readonly job_manager: JobDefinitionManager,
		private readonly project_template_manager: ProjectTemplateManager
	) {}

	provideDefinition(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.Location | vscode.Location[] | vscode.LocationLink[]> {
		let range = document.getWordRangeAtPosition(position);
		if (range) {
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

			let job_name = ProjectTemplateParser.parse_job_name_from_line_in_document(document, position.line);
			if (job_name) {
				let job = this.job_manager.get_job_with_name(job_name);
				if (job) {
					let attribute = job.get_job_name_attribute();
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
