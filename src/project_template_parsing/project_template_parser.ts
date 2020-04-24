import * as vscode from "vscode";
import { ProjectTemplateManager } from "./project_template_manager";
import { ProjectTemplate } from "../data_structures/project_template";
import { AttributeLocationData } from "../data_structures/attribute_location_data";
import { Attribute } from "../data_structures/attribute";

export class ProjectTemplateParser {
	static parse_project_template_from_yaml_object(document: vscode.TextDocument, yaml_object: any): ProjectTemplate {
		let project_template = new ProjectTemplate(document.uri);
		for (let key in yaml_object) {
			let value = yaml_object[key];
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
		project_template_manager: ProjectTemplateManager
	) {
		project_templates.forEach((template) => {
			let job_names = template.get_all_job_names_unique();
			job_names.forEach((job_name) => {
				let name = job_name as any;
				let regex = new RegExp(name, "g");
				let match: RegExpExecArray | null;
				while ((match = regex.exec(textDocument.getText()))) {
					let line_number = textDocument.positionAt(match.index).line;
					let job_line = textDocument.lineAt(line_number);
					let location_data = new AttributeLocationData(job_line.range, line_number, textDocument.uri);
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
