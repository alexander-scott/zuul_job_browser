import * as vscode from "vscode";
import { AttributeLocationData } from "../data_structures/attribute_location_data";
import { JobDefinitionManager } from "./job_definition_manager";

export class JobParser {
	private static readonly job_regex = /^- job:/gm;
	private static readonly job_name_regex = /(?<=name:).*/;
	private static readonly job_parent_regex = /(?<=parent:).*/;
	private static readonly special_attribute_keys = ["name", "parent"];

	add_location_data_to_jobs(
		textDocument: vscode.TextDocument,
		job_line_number: number,
		jobManager: JobDefinitionManager
	) {
		let line_number_iterator = job_line_number;
		let job_attributes: AttributeLocationData[] = [];
		let job_name;

		// From the current line, search downwards.
		let current_attribute;
		while (true) {
			let job_line = textDocument.lineAt(line_number_iterator);
			let attribute_key = job_line.text.substr(0, job_line.text.indexOf(":"));
			let attribute_value = job_line.text.substr(job_line.text.indexOf(":") + 1);
			let attribute_indentation = attribute_key.search(/\S/);
			if (attribute_key && attribute_value) {
				attribute_key = attribute_key.replace(/\s/g, "");
				attribute_value = this.remove_spaces_from_special_value(attribute_key, attribute_value);
				current_attribute = new AttributeLocationData(
					attribute_key,
					attribute_value,
					job_line.range,
					job_line.lineNumber,
					textDocument.uri
				);
				if (current_attribute.attribute_key === "name") {
					job_name = current_attribute.attribute_value;
				}
				job_attributes.push(current_attribute);
			} else if (job_line.text && current_attribute) {
				current_attribute.attribute_value = current_attribute.attribute_value + job_line.text;
			}
			line_number_iterator++;
			if (this.at_the_end_of_job_definition(textDocument, line_number_iterator)) {
				break;
			}
		}

		if (job_name) {
			let job = jobManager.get_job_with_name(job_name);
			if (job) {
				job_attributes.forEach((att) => {
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

	parse_job_from_line_number(textDocument: vscode.TextDocument, job_line_number: number): string | undefined {
		let line_number_iterator = job_line_number;

		// From the current line, search downwards.
		while (true) {
			let job_attribute = this.parse_job_attribute_from_line(line_number_iterator, textDocument);
			if (job_attribute) {
				if (job_attribute.attribute_key === "name") {
					return job_attribute.attribute_value;
				}
			}
			line_number_iterator++;
			if (this.at_the_end_of_job_definition(textDocument, line_number_iterator)) {
				break;
			}
		}

		line_number_iterator = job_line_number;

		// From the current line, search upwards.
		while (true) {
			line_number_iterator--;
			if (this.at_the_end_of_job_definition(textDocument, line_number_iterator)) {
				break;
			}
			let job_attribute = this.parse_job_attribute_from_line(line_number_iterator, textDocument);
			if (job_attribute) {
				if (job_attribute.attribute_key === "name") {
					return job_attribute.attribute_value;
				}
			}
		}
		return undefined;
	}

	parse_job_attribute_from_line(
		job_line_number: number,
		textDocument: vscode.TextDocument
	): AttributeLocationData | undefined {
		let job_line = textDocument.lineAt(job_line_number);
		let attribute_key = job_line.text.substr(0, job_line.text.indexOf(":"));
		let attribute_value = job_line.text.substr(job_line.text.indexOf(":") + 1);
		if (attribute_key && attribute_value) {
			attribute_key = attribute_key.replace(/\s/g, "");
			attribute_value = this.remove_spaces_from_special_value(attribute_key, attribute_value);
			return new AttributeLocationData(
				attribute_key,
				attribute_value,
				job_line.range,
				job_line_number,
				textDocument.uri
			);
		}
		return undefined;
	}

	remove_spaces_from_special_value(attribute_key: string, attribute_value: string): string {
		if (JobParser.special_attribute_keys.includes(attribute_key)) {
			return attribute_value.replace(/\s/g, "");
		}
		return attribute_value;
	}

	static parse_parent_name_from_line_number(
		textDocument: vscode.TextDocument,
		job_line_number: number
	): string | undefined {
		let line = textDocument.lineAt(job_line_number);
		let line_text = line.text;
		if (JobParser.job_parent_regex.exec(line_text)) {
			return line_text.replace(/\s/g, "").toLowerCase().split(":").pop();
		}
		return undefined;
	}

	static parse_job_name_from_line_number(
		textDocument: vscode.TextDocument,
		job_line_number: number
	): string | undefined {
		let line = textDocument.lineAt(job_line_number);
		let line_text = line.text;
		if (JobParser.job_name_regex.exec(line_text)) {
			return line_text.replace(/\s/g, "").toLowerCase().split(":").pop();
		}
		return undefined;
	}

	at_the_end_of_job_definition(textDocument: vscode.TextDocument, line_number: number): boolean {
		// Make sure we're not at the end of the document
		if (line_number >= textDocument.lineCount || line_number < 0) {
			return true;
		}
		let line = textDocument.lineAt(line_number);
		let line_text = line.text;
		// If this line is the start of a job then exit
		if (JobParser.job_regex.exec(line_text)) {
			return true;
		}
		return false;
	}
}
