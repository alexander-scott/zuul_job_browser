import * as vscode from "vscode";

export class JobParser {
	private static readonly job_regex = /^- job:/gm;
	private static readonly job_name_regex = /(?<=name:).*/;
	private static readonly job_parent_regex = /(?<=parent:).*/;
	private static readonly playbook_path_regex = /(.*?)\.(yaml)$/;
	private static readonly ansible_variable_regex = /{{([^}]*)}}/;
	private static readonly special_attribute_keys = ["name", "parent"];

	static parse_parent_name_from_single_line(
		document: vscode.TextDocument,
		job_line_number: number
	): string | undefined {
		let line = document.lineAt(job_line_number);
		let line_text = line.text;
		if (JobParser.job_parent_regex.exec(line_text)) {
			return line_text.replace(/\s/g, "").toLowerCase().split(":").pop();
		}
		return undefined;
	}

	static parse_job_name_from_single_line(document: vscode.TextDocument, job_line_number: number): string | undefined {
		let line = document.lineAt(job_line_number);
		let line_text = line.text;
		if (JobParser.job_name_regex.exec(line_text)) {
			return line_text.replace(/\s/g, "").toLowerCase().split(":").pop();
		}
		return undefined;
	}

	static parse_playbook_run_from_single_line(
		document: vscode.TextDocument,
		job_line_number: number
	): string | undefined {
		let line = document.lineAt(job_line_number);
		let line_text = line.text;
		if (JobParser.playbook_path_regex.exec(line_text)) {
			let split_line = line_text.replace(/\s/g, "").toLowerCase().split(":");
			if (split_line.length === 1) {
				return split_line.pop()?.substr(1); // Remove the '-' from the beginning of the string
			} else {
				return split_line.pop();
			}
		}
		return undefined;
	}

	static parse_job_from_random_line_number(document: vscode.TextDocument, job_line_number: number): string | undefined {
		let line_number_iterator = job_line_number;

		// From the current line, search downwards.
		while (true) {
			let job_attribute = JobParser.parse_job_attribute_from_line(line_number_iterator, document);
			if (job_attribute) {
				if (job_attribute.attribute_key === "name") {
					return job_attribute.attribute_value;
				}
			}
			line_number_iterator++;
			if (JobParser.at_the_end_of_job_definition(document, line_number_iterator)) {
				break;
			}
		}

		line_number_iterator = job_line_number;

		// From the current line, search upwards.
		while (true) {
			line_number_iterator--;
			if (JobParser.at_the_end_of_job_definition(document, line_number_iterator)) {
				break;
			}
			let job_attribute = JobParser.parse_job_attribute_from_line(line_number_iterator, document);
			if (job_attribute) {
				if (job_attribute.attribute_key === "name") {
					return job_attribute.attribute_value;
				}
			}
		}
		return undefined;
	}

	static parse_job_attribute_from_line(
		job_line_number: number,
		document: vscode.TextDocument
	): { [id: string]: string } | undefined {
		let job_line = document.lineAt(job_line_number);
		let attribute_key = job_line.text.substr(0, job_line.text.indexOf(":"));
		let attribute_value = job_line.text.substr(job_line.text.indexOf(":") + 1);
		if (attribute_key && attribute_value) {
			attribute_key = attribute_key.replace(/\s/g, "");
			attribute_value = this.remove_spaces_from_special_value(attribute_key, attribute_value);
			return { attribute_key, attribute_value };
		}
		return undefined;
	}

	static remove_spaces_from_special_value(attribute_key: string, attribute_value: string): string {
		if (JobParser.special_attribute_keys.includes(attribute_key)) {
			return attribute_value.replace(/\s/g, "");
		}
		return attribute_value;
	}

	static at_the_end_of_job_definition(document: vscode.TextDocument, line_number: number): boolean {
		// Make sure we're not at the end of the document
		if (line_number >= document.lineCount || line_number < 0) {
			return true;
		}
		let line = document.lineAt(line_number);
		let line_text = line.text;
		// If this line is the start of a job then exit
		if (JobParser.job_regex.exec(line_text)) {
			return true;
		}
		return false;
	}

	static parse_anisble_variable_from_position_in_line(
		document: vscode.TextDocument,
		position: vscode.Position
	): string | undefined {
		let job_line = document.lineAt(position.line);
		let regex = new RegExp(JobParser.ansible_variable_regex, "g");
		let match: RegExpExecArray | null;
		while ((match = regex.exec(job_line.text))) {
			let start_pos = job_line.range.start.translate({ characterDelta: match.index - 1 });
			let end_pos = start_pos.translate({ characterDelta: match[1].length + 2 });
			let match_pos = new vscode.Range(start_pos, end_pos);
			if (match_pos.contains(position)) {
				return match[1];
			}
		}
		return undefined;
	}
}
