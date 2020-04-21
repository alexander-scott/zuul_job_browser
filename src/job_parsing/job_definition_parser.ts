import * as vscode from "vscode";
import { JobDefinitionManager } from "./job_definition_manager";
import { JobParser } from "./job_parser";
import * as yaml from "js-yaml";
import { NewJob, NewJobAttribute } from "./new_job";

export class JobDefinitionparser {
	static parse_job_location_data(textDocument: vscode.TextDocument, jobManager: JobDefinitionManager): void {
		let job_parser = new JobParser();
		let job_regex = /^- job:/gm;
		let match: RegExpExecArray | null;
		while ((match = job_regex.exec(textDocument.getText()))) {
			let line_number = textDocument.positionAt(match.index).line;
			let location_data = job_parser.parse_job_from_job_beginning(textDocument, line_number);
			if (location_data) {
				let job = jobManager.get_job_with_name(location_data.get_job_name_attribute().attribute_value);
				if (job) {
					location_data.get_all_attributes().forEach((att) => {
						job?.add_location_to_attribute(
							att.attribute_key,
							att.attribute_location,
							att.attribute_line_number,
							att.document
						);
					});
				}
			}
		}
	}

	static parse_job_definitions_in_document_using_parser(
		textDocument: vscode.TextDocument,
		jobManager: JobDefinitionManager
	) {
		const objects = yaml.safeLoad(textDocument.getText());
		if (objects) {
			objects.forEach((object: any) => {
				if (object["job"]) {
					let job = new NewJob(textDocument.uri);
					for (let key in object["job"]) {
						let value = object["job"][key];
						let attribute_value = this.parse_child_attributes(value);
						job.add_attribute(new NewJobAttribute(key, attribute_value));
					}
					jobManager.add_job(job);
				}
			});
		}
	}

	static parse_child_attributes(attribute: any): NewJobAttribute[] | string {
		if (attribute instanceof Array) {
			let job_attributes: NewJobAttribute[] = [];
			for (let key in attribute) {
				let value = attribute[key];
				let attribute_value = this.parse_child_attributes(value);
				job_attributes.push(new NewJobAttribute(key, attribute_value));
			}
			return job_attributes;
		} else {
			return attribute;
		}
	}
}
