import * as vscode from "vscode";
import { JobParser } from "../job_parsing/job_parser";
import { JobDefinitionManager } from "../job_parsing/job_definition_manager";
import { ProjectTemplateParser } from "../project_template_parsing/project_template_parser";
import path = require("path");

export class JobDefinitionProvider implements vscode.DefinitionProvider {
	constructor(private readonly job_manager: JobDefinitionManager) {}

	provideDefinition(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.Location | vscode.Location[] | vscode.LocationLink[]> {
		let range = document.getWordRangeAtPosition(position);
		if (range) {
			// Jump to job definition from parent attribute
			let parent_name = JobParser.parse_parent_name_from_single_line(document, position.line);
			if (parent_name) {
				let parent_job = this.job_manager.get_job_with_name(parent_name);
				if (parent_job) {
					let attribute = parent_job.get_job_name_attribute();
					if (!attribute) {
						throw new Error("Parent attribute doesn't exist>?!?!?!?!");
					}
					return new vscode.Location(attribute.location.document, attribute.location.range);
				}
			}

			// Jump to job definition from job name attribute
			let job_name = ProjectTemplateParser.parse_job_name_from_line_in_document(document, position.line);
			if (job_name) {
				let job = this.job_manager.get_job_with_name(job_name);
				if (job) {
					let attribute = job.get_job_name_attribute();
					if (!attribute) {
						throw new Error("Parent attribute doesn't exist>?!?!?!?!");
					}
					return new vscode.Location(attribute.location.document, attribute.location.range);
				}
			}

			// Jump to playbook from run playbook attribute
			let playbook = JobParser.parse_playbook_run_from_single_line(document, position.line);
			if (playbook) {
				let file = vscode.window.activeTextEditor?.document.uri;
				if (file) {
					let folder = vscode.workspace.getWorkspaceFolder(file)?.uri;
					if (folder) {
						let playbook_path = path.join(folder.fsPath, playbook);
						return new vscode.Location(vscode.Uri.file(playbook_path), new vscode.Position(0, 0));
					}
				}
			}
		}
		return undefined;
	}
}
