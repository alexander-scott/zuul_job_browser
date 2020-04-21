import * as vscode from "vscode";
import { JobDefinitionManager } from "./job_definition_manager";
import { JobParser } from "./job_parser";
import * as yaml from "js-yaml";
import { Job, JobAttribute } from "../data_structures/job";

export class JobDefinitionparser {
	static parse_job_location_data(textDocument: vscode.TextDocument, jobManager: JobDefinitionManager): void {
		let job_parser = new JobParser();
		let job_regex = /^- job:/gm;
		let match: RegExpExecArray | null;
		while ((match = job_regex.exec(textDocument.getText()))) {
			let line_number = textDocument.positionAt(match.index).line;
			job_parser.add_location_data_to_jobs(textDocument, line_number, jobManager);
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
					let job = new Job(textDocument.uri);
					for (let key in object["job"]) {
						let value = object["job"][key];
						let attribute_value = this.parse_child_attributes(value);
						job.add_attribute(new JobAttribute(key, attribute_value));
					}
					jobManager.add_job(job);
				}
			});
		}
	}

	static parse_child_attributes(attribute: any): JobAttribute[] | string {
		if (attribute instanceof Array) {
			let job_attributes: JobAttribute[] = [];
			for (let key in attribute) {
				let value = attribute[key];
				let attribute_value = this.parse_child_attributes(value);
				job_attributes.push(new JobAttribute(key, attribute_value));
			}
			return job_attributes;
		} else {
			return attribute;
		}
	}
}
