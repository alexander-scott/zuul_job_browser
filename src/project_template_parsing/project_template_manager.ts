import * as vscode from "vscode";
import { ProjectTemplate } from "../data_structures/project_template";
import { Location } from "../data_structures/location";

/**
 * Sample model of what the text in the document contains.
 */
export class ProjectTemplateManager {
	private _project_templates: ProjectTemplate[] = [];

	add_project_template(project_template: ProjectTemplate) {
		this._project_templates.push(project_template);
	}

	remove_all_templates_in_document(uri: vscode.Uri): void {
		this._project_templates = this._project_templates.filter((template) => template.document.path !== uri.path);
	}

	remove_all_templates() {
		this._project_templates = [];
	}

	get_all_jobs_with_name(job_name: string): Location[] {
		let locations: Location[] = [];
		this._project_templates.forEach((template) => {
			locations.push(...template.get_all_locations_with_value(job_name));
		});
		return locations;
	}

	get_single_job_on_line(document: vscode.Uri, line_number: number): Location | undefined {
		let valid_templates = this._project_templates.filter((template) => template.document.path === document.path);
		for (const key in valid_templates) {
			let job_on_line = valid_templates[key].get_all_value_locations().find((loc) => loc.line_number === line_number);
			if (job_on_line) {
				return job_on_line;
			}
		}
		return undefined;
	}

	get_first_job_with_name(job_name: string): Location | undefined {
		for (const key in this._project_templates) {
			let job = this._project_templates[key].get_all_value_locations().find((loc) => loc.value === job_name);
			if (job) {
				return job;
			}
		}
		return undefined;
	}

	get_all_project_templates(): ProjectTemplate[] {
		return this._project_templates;
	}
}
