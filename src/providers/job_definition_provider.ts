import * as vscode from "vscode";
import { JobParser } from "../job_parsing/job_parser";
import { JobManager } from "../job_parsing/job_manager";
import { ProjectTemplateParser } from "../project_template_parsing/project_template_parser";
import path = require("path");
import { JobAttributeCollector } from "../job_parsing/job_attribute_collector";

export class JobDefinitionProvider implements vscode.DefinitionProvider {
	constructor(private readonly job_manager: JobManager) {}

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
					let parent_job_name = parent_job.get_name_value();
					let parent_job_name_location = parent_job.get_location_of_value(parent_job_name);
					return new vscode.Location(parent_job.document, parent_job_name_location.get_as_vscode_location());
				}
			}

			// Jump to job definition from job name attribute
			let job_name = ProjectTemplateParser.parse_job_name_from_line_in_document(document, position.line);
			if (job_name) {
				let job = this.job_manager.get_job_with_name(job_name);
				if (job) {
					let job_name = job.get_name_value();
					let job_name_location = job.get_location_of_value(job_name);
					return new vscode.Location(job.document, job_name_location.get_as_vscode_location());
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

			// Jump to ansible variable defintion
			let ansible_var = JobParser.parse_anisble_variable_from_position_in_line(document, position);
			if (ansible_var) {
				let job_name = JobParser.parse_job_from_random_line_number(document, position.line);
				if (job_name) {
					let job = this.job_manager.get_job_with_name(job_name);
					if (job) {
						let attributes = JobAttributeCollector.get_attributes_for_job(job, this.job_manager);
						let selected_attribute = JobAttributeCollector.get_specific_attribute_from_array(attributes, ansible_var);
						if (selected_attribute) {
							let attribute_owner = this.job_manager.get_job_with_name(selected_attribute.job_name);
							if (attribute_owner) {
								let attribute_location = attribute_owner.get_location_of_value(ansible_var as string);
								if (attribute_location) {
									return new vscode.Location(attribute_owner.document, attribute_location.get_as_vscode_location());
								}
							}
						}
					}
				}
			}
		}
		return undefined;
	}
}
