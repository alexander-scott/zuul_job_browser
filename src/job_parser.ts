import * as vscode from "vscode";
import { Job } from "./job";

export class JobParser {
	private job_name_regex = /(?<=name:).*/gm;
	private job_parent_regex = /(?<=parent:).*/gm;

	parse_job_from_line_number(textDocument: vscode.TextDocument, job_line_number: number): Job | undefined {
		let job_name = null;
		let job_name_location = null;

		let parent_name = null;
		let parent_name_location = null;

		let line_iterator = job_line_number;

		// From the current line, search downwards.
		while (true) {
			// Make sure we're not at the end of the document
			if (line_iterator >= textDocument.lineCount) {
				break;
			}
			let line = textDocument.lineAt(line_iterator);
			let line_text = line.text;
			// If this line is empty then we're at the end of the job
			if (!line_text) {
				break;
			}
			if (this.job_name_regex.exec(line_text)) {
				job_name = line_text.replace(/\s/g, "").toLowerCase().split(":").pop();
				job_name_location = line;
				continue;
			}
			if (this.job_parent_regex.exec(line_text)) {
				parent_name = line_text.replace(/\s/g, "").toLowerCase().split(":").pop();
				parent_name_location = line;
				continue;
			}
			line_iterator++;
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

		line_iterator = job_line_number;

		// From the current line, search upwards.
		while (true) {
			// Make sure we're not at the end of the document
			if (line_iterator <= 0) {
				break;
			}
			let line = textDocument.lineAt(line_iterator);
			let line_text = line.text;
			// If this line is empty then we're at the end of the job
			if (!line_text) {
				break;
			}
			if (this.job_name_regex.exec(line_text)) {
				job_name = line_text.replace(/\s/g, "").toLowerCase().split(":").pop();
				job_name_location = line;
				continue;
			}
			if (this.job_parent_regex.exec(line_text)) {
				parent_name = line_text.replace(/\s/g, "").toLowerCase().split(":").pop();
				parent_name_location = line;
				continue;
			}
			line_iterator--;
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
}
