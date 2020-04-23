import * as vscode from "vscode";
import { ProjectTemplateJob } from "./project_template_job";
import { ProjectTemplate } from "../data_structures/project_template";
import { RawLocationData } from "../data_structures/attribute_location_data";

/**
 * Sample model of what the text in the document contains.
 */
export class ProjectTemplateJobManager {
	private _project_templates: ProjectTemplate[] = [];
	private _known_files: Set<string> = new Set();
	private _job_locations: { [id: string]: RawLocationData[] } = {};

	add_project_template(project_template: ProjectTemplate) {
		this._project_templates.push(project_template);
	}

	parse_job_location_data(project_templates: ProjectTemplate[], textDocument: vscode.TextDocument) {
		project_templates.forEach((template) => {
			let job_names = template.get_all_job_names();
			job_names.forEach((job_name) => {
				let name = job_name as any;
				let regex = new RegExp(name, "g");
				let match: RegExpExecArray | null;
				if ((match = regex.exec(textDocument.getText()))) {
					let line_number = textDocument.positionAt(match.index).line;
					let job_line = textDocument.lineAt(line_number);
					let location_data = new RawLocationData(job_line.range, line_number, textDocument.uri);
					if (this._job_locations[name]) {
						this._job_locations[name].push(location_data);
					} else {
						this._job_locations[name] = [location_data];
					}
				}
			});
		});
		this._known_files.add(textDocument.uri.path);
	}

	is_known_file(uri: vscode.Uri): boolean {
		return this._known_files.has(uri.path);
	}

	remove_all_jobs_in_document(uri: vscode.Uri): void {
		for (const key in this._job_locations) {
			this._job_locations[key] = this._job_locations[key].filter((job) => job.document.path !== uri.path);
		}
		this._known_files.delete(uri.path);
	}

	get_all_jobs_with_name(job_name: string): RawLocationData[] | undefined {
		return this._job_locations[job_name];
	}
}
