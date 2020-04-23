import * as vscode from "vscode";
import { ProjectTemplateJob } from "./project_template_job";
import { ProjectTemplate } from "../data_structures/project_template";
import { RawLocationData } from "../data_structures/attribute_location_data";

/**
 * Sample model of what the text in the document contains.
 */
export class ProjectTemplateJobManager {
	private _project_templates: ProjectTemplate[] = [];
	private _job_locations: { [id: string]: RawLocationData[] } = {};

	add_project_template(project_template: ProjectTemplate) {
		this._project_templates.push(project_template);
	}

	remove_all_jobs_in_document(uri: vscode.Uri): void {
		for (const key in this._job_locations) {
			this._job_locations[key] = this._job_locations[key].filter((job) => job.document.path !== uri.path);
		}
	}

	get_all_jobs_with_name(job_name: string): RawLocationData[] | undefined {
		return this._job_locations[job_name];
	}

	add_job_location_data(name: string, location_data: RawLocationData) {
		if (this._job_locations[name]) {
			this._job_locations[name].push(location_data);
		} else {
			this._job_locations[name] = [location_data];
		}
	}
}
