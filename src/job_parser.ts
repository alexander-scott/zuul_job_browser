import * as vscode from "vscode";
import { Job } from "./job";

export class JobParser {
	private job_regex = /^- job:/gm;
	private job_name_regex = /(?<=name:).*/gm;
	private job_parent_regex = /(?<=parent:).*/gm;

	parse_job_from_line_number(textDocument: vscode.TextDocument, job_line_number: number): Job | undefined {
		let job_name = null;
		let job_name_location = null;

		let parent_name = null;
		let parent_name_location = null;

		let line_number_iterator = job_line_number;

		// From the current line, search downwards.
		while (true) {
			let line = textDocument.lineAt(line_number_iterator);
			if (this.job_name_regex.exec(line.text)) {
				job_name = line.text.replace(/\s/g, "").toLowerCase().split(":").pop();
				job_name_location = line;
				continue;
			}
			if (this.job_parent_regex.exec(line.text)) {
				parent_name = line.text.replace(/\s/g, "").toLowerCase().split(":").pop();
				parent_name_location = line;
				continue;
			}
			line_number_iterator++;
			if (this.at_the_end_of_job_definition(textDocument, line_number_iterator)) {
				break;
			}
		}

		if (
			job_name !== null &&
			job_name !== undefined &&
			parent_name !== null &&
			parent_name !== undefined &&
			job_name_location !== null &&
			parent_name_location !== null
		) {
			return new Job(
				job_name_location.text,
				job_name,
				parent_name,
				job_name_location.range,
				parent_name_location.range,
				textDocument
			);
		}

		line_number_iterator = job_line_number;

		// From the current line, search upwards.
		while (true) {
			let line = textDocument.lineAt(line_number_iterator);
			if (this.job_name_regex.exec(line.text)) {
				job_name = line.text.replace(/\s/g, "").toLowerCase().split(":").pop();
				job_name_location = line;
				continue;
			}
			if (this.job_parent_regex.exec(line.text)) {
				parent_name = line.text.replace(/\s/g, "").toLowerCase().split(":").pop();
				parent_name_location = line;
				continue;
			}
			line_number_iterator--;
			if (this.at_the_end_of_job_definition(textDocument, line_number_iterator)) {
				break;
			}
		}

		if (
			job_name !== null &&
			job_name !== undefined &&
			parent_name !== null &&
			parent_name !== undefined &&
			job_name_location !== null &&
			parent_name_location !== null
		) {
			return new Job(
				job_name_location.text,
				job_name,
				parent_name,
				job_name_location.range,
				parent_name_location.range,
				textDocument
			);
		}

		return undefined;
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
