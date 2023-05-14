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
		const range = document.getWordRangeAtPosition(position);
		if (range) {
			// Jump to job definition from parent attribute
			const parent_name = JobParser.parse_parent_name_from_single_line(document, position.line);
			if (parent_name) {
				const parent_job = this.job_manager.get_job_with_name(parent_name);
				if (parent_job) {
					const parent_job_name = parent_job.get_name_value();
					const parent_job_name_location = parent_job.get_location_of_value(parent_job_name);
					return new vscode.Location(parent_job.document, parent_job_name_location.get_as_vscode_location());
				}
			}

			// Jump to job definition from job name attribute
			const job_name = ProjectTemplateParser.parse_job_name_from_line_in_document(document, position.line);
			if (job_name) {
				const job = this.job_manager.get_job_with_name(job_name);
				if (job) {
					const job_name = job.get_name_value();
					const job_name_location = job.get_location_of_value(job_name);
					return new vscode.Location(job.document, job_name_location.get_as_vscode_location());
				}
			}

			// Jump to playbook from run playbook attribute
			const playbook = JobParser.parse_playbook_run_from_single_line(document, position.line);
			if (playbook) {
				const file = vscode.window.activeTextEditor?.document.uri;
				if (file) {
					const folder = vscode.workspace.getWorkspaceFolder(file)?.uri;
					if (folder) {
						const playbook_path = path.join(folder.fsPath, playbook);
						return new vscode.Location(vscode.Uri.file(playbook_path), new vscode.Position(0, 0));
					}
				}
			}

			// Jump to ansible variable defintion
			const ansible_var = JobParser.parse_anisble_variable_from_position_in_line(document, position);
			if (ansible_var) {
				const job_name = JobParser.parse_job_from_random_line_number(document, position.line);
				if (job_name) {
					const job = this.job_manager.get_job_with_name(job_name);
					if (job) {
						const attributes = JobAttributeCollector.get_attributes_for_job(job, this.job_manager);
						const selected_attribute = JobAttributeCollector.get_specific_attribute_from_array(attributes, ansible_var);
						if (selected_attribute) {
							const attribute_owner = this.job_manager.get_job_with_name(selected_attribute.job_name);
							if (attribute_owner) {
								const attribute_location = attribute_owner.get_location_of_value(ansible_var as string);
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
