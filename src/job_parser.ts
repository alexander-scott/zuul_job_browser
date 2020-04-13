import * as vscode from "vscode";
import { Job, JobAttribute } from "./job";

export class JobParser {
	private job_regex = /^- job:/gm;
	private job_name_regex = /(?<=name:).*/gm;
	private job_parent_regex = /(?<=parent:).*/gm;
	private special_attribute_keys = ["name", "parent"];

	parse_job_from_line_number(textDocument: vscode.TextDocument, job_line_number: number): Job | undefined {
		let line_number_iterator = job_line_number;
		let job_attributes: JobAttribute[] = [];

		// From the current line, search downwards.
		while (true) {
			let job_attribute = this.parse_job_attribute_from_line(line_number_iterator, textDocument);
			if (job_attribute) {
				job_attributes.push(job_attribute);
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
				job_attributes.push(job_attribute);
			}
		}

		if (job_attributes.length > 0) {
			return new Job(job_attributes, textDocument.uri);
		}

		return undefined;
	}

	parse_job_attribute_from_line(job_line_number: number, textDocument: vscode.TextDocument): JobAttribute | undefined {
		let job_line = textDocument.lineAt(job_line_number);
		let attribute_key = job_line.text.substr(0, job_line.text.indexOf(":"));
		let attribute_value = job_line.text.substr(job_line.text.indexOf(":") + 1);
		if (attribute_key && attribute_value) {
			attribute_key = attribute_key.replace(/\s/g, "");
			attribute_value = this.remove_spaces_from_special_value(attribute_key, attribute_value);
			return new JobAttribute(attribute_key, attribute_value, job_line.range, job_line_number, textDocument.uri);
		}
		return undefined;
	}

	remove_spaces_from_special_value(attribute_key: string, attribute_value: string): string {
		if (this.special_attribute_keys.includes(attribute_key)) {
			return attribute_value.replace(/\s/g, "");
		}
		return attribute_value;
	}

	parse_parent_name_from_line_number(textDocument: vscode.TextDocument, job_line_number: number): string | undefined {
		let line = textDocument.lineAt(job_line_number);
		let line_text = line.text;
		if (this.job_parent_regex.exec(line_text)) {
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
		// If this line is empty then we're at the end of the job
		if (!line_text) {
			return true;
		}
		// If this line is the start/end of a job then exit
		if (this.job_regex.exec(line_text)) {
			return true;
		}
		return false;
	}
}
