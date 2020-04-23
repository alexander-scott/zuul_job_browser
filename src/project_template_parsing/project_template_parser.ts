import * as vscode from "vscode";
import { ProjectTemplateJobManager } from "./project_template_job_manager";
import { ProjectTemplateJob } from "./project_template_job";
import { ProjectTemplate } from "../data_structures/project_template";
import { Attribute } from "../data_structures/attribute";
import { RawLocationData } from "../data_structures/attribute_location_data";

export class ProjectTemplateParser {
	static parse_project_template(document: vscode.TextDocument, object: any): ProjectTemplate {
		let project_template = new ProjectTemplate(document.uri);
		for (let key in object) {
			let value = object[key];
			let attribute_value = this.parse_child_attributes(value);
			project_template.add_attribute(new Attribute(key, attribute_value));
		}
		return project_template;
	}

	static parse_child_attributes(attribute: any): Attribute[] | string {
		if (attribute instanceof Array) {
			let job_attributes: Attribute[] = [];
			for (let key in attribute) {
				let value = attribute[key];
				let attribute_value = this.parse_child_attributes(value);
				job_attributes.push(new Attribute(key, attribute_value));
			}
			return job_attributes;
		} else {
			return attribute;
		}
	}

	static parse_job_location_data(
		project_templates: ProjectTemplate[],
		textDocument: vscode.TextDocument,
		project_template_manager: ProjectTemplateJobManager
	) {
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
					project_template_manager.add_job_location_data(name, location_data);
				}
			});
		});
	}

	static parse_job_name_from_line_in_document(
		textDocument: vscode.TextDocument,
		line_number: number
	): string | undefined {
		let job_regex = /(?<=\s-).*/gm;
		let job_line = textDocument.lineAt(line_number).text;
		if (job_regex.exec(job_line)) {
			let job_name = job_line
				.substr(job_line.indexOf("-") + 1)
				.replace(/\s/g, "")
				.replace(":", "");
			return job_name;
		}
		return undefined;
	}
}
