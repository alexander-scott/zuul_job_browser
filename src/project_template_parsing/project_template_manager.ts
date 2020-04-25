import * as vscode from "vscode";
import { ProjectTemplate } from "../data_structures/project_template";
import { AttributeLocationData } from "../data_structures/attribute_location_data";

/**
 * Sample model of what the text in the document contains.
 */
export class ProjectTemplateManager {
	private _project_templates: ProjectTemplate[] = [];
	private _job_locations: { [id: string]: AttributeLocationData[] } = {};

	add_project_template(project_template: ProjectTemplate) {
		this._project_templates.push(project_template);
	}

	add_job_location_data(name: string, location_data: AttributeLocationData) {
		if (this._job_locations[name]) {
			this._job_locations[name].push(location_data);
		} else {
			this._job_locations[name] = [location_data];
		}
	}

	remove_all_templates_in_document(uri: vscode.Uri): void {
		for (const key in this._job_locations) {
			this._job_locations[key] = this._job_locations[key].filter((job) => job.document.path !== uri.path);
		}
		this._project_templates = this._project_templates.filter((template) => template.document.path !== uri.path);
	}

	remove_all_templates() {
		this._job_locations = {};
		this._project_templates = [];
	}

	get_all_jobs_with_name(job_name: string): AttributeLocationData[] | undefined {
		return this._job_locations[job_name];
	}

	get_single_job_with_name_on_line(job_name: string, line_number: number): AttributeLocationData | undefined {
		let jobs_with_name = this._job_locations[job_name];
		return jobs_with_name.find((job) => job.line_number === line_number);
	}

	get_first_job_with_name(job_name: string): AttributeLocationData | undefined {
		let jobs = this._job_locations[job_name];
		if (jobs) {
			return jobs[0];
		}
		return undefined;
	}

	get_all_project_templates(): ProjectTemplate[] {
		return this._project_templates;
	}
}
