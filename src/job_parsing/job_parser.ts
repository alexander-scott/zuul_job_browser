import * as vscode from "vscode";
import { JobManager } from "./job_manager";
import { AttributeLocationData } from "../data_structures/attribute_location_data";
import { Job } from "../data_structures/job";
import { Attribute } from "../data_structures/attribute";
import { JobLocations, JobLocation } from "../data_structures/job_locations";
import { Logger } from "../file_parsing/logger";

export class JobParser {
	private static readonly job_regex = /^- job:/gm;
	private static readonly job_name_regex = /(?<=name:).*/;
	private static readonly job_parent_regex = /(?<=parent:).*/;
	private static readonly playbook_path_regex = /(.*?)\.(yaml)$/;
	private static readonly special_attribute_keys = ["name", "parent"];

	/**
	 * Creates a Job object from parsed YAML objects
	 * @param document The document that the object was parsed from
	 * @param yaml_object The parsed object
	 */
	static parse_job_from_yaml_object(document: vscode.TextDocument, yaml_object: any): Job {
		let job = new Job(document.uri);
		for (let key in yaml_object) {
			let value = yaml_object[key];
			let attribute_value = this.parse_job_child_attributes(value);
			job.add_attribute(new Attribute(key, attribute_value));
		}
		return job;
	}

	/**
	 * Recursively parses any child attributes of the current attribute
	 * @param attribute The current attribute
	 */
	static parse_job_child_attributes(attribute: any): Attribute[] | string {
		if (attribute instanceof Array) {
			let job_attributes: Attribute[] = [];
			for (let key in attribute) {
				let value = attribute[key];
				let attribute_value = this.parse_job_child_attributes(value);
				job_attributes.push(new Attribute(key, attribute_value));
			}
			return job_attributes;
		} else {
			return attribute;
		}
	}

	static parse_job_location_data_in_document(document: vscode.TextDocument, job_manager: JobManager): void {
		// 1. Loop through each `- job` and store the job_name of this job and line number of the start of the job.
		//    This can be done by finding regex matches for `- job`, then finding the job_name attribute from that like.
		// 2. Loop through each job and each job's attribute in job_manager.
		// 3. Perform a regex match on the attribute value.
		// 4. If the line number of the attribute value found is in the right location for this job, i.e., between
		//    the line number at job_name and the line number of the night job.
		// 5. Then check if the keys are the same.
		// 6. If they are then set the location data for this attribute.

		// Step 1 - Find and store the job start locations
		let job_start_locations: JobLocations = new JobLocations();
		let job_regex = /^- job:/gm;
		let match: RegExpExecArray | null;
		while ((match = job_regex.exec(document.getText()))) {
			let job_line_number = document.positionAt(match.index).line;
			let job_name = JobParser.parse_job_from_random_line_number(document, job_line_number);
			if (job_name) {
				job_start_locations.add_job_location(new JobLocation(job_line_number, job_name));
			}
		}
		job_start_locations.sort();

		// Step 2 - Loop through all job and job attributes
		let jobs = job_manager.get_all_jobs_in_document(document.uri);
		// jobs.forEach((job) => {
		// 	let job_name = job.get_job_name_attribute().value as string;
		// 	try {
		// 		let job_attributes = job.get_all_attributes_with_values();
		// 		job_attributes.forEach((att) => {
		// 			let attribute_value = att.value as string;
		// 			let regex = new RegExp(attribute_value, "g");
		// 			let match: RegExpExecArray | null;
		// 			while ((match = regex.exec(document.getText()))) {
		// 				let attribute_position = document.positionAt(match.index);
		// 				if (job_start_locations.belongs_to_job(job_name, attribute_position.line)) {
		// 					let attribute_location = new vscode.Range(
		// 						attribute_position,
		// 						attribute_position.translate({ characterDelta: attribute_value.length })
		// 					);
		// 					let location_data = new AttributeLocationData(attribute_location, attribute_position.line, document.uri);
		// 					job.add_location_to_attribute(att.key, location_data);
		// 					break;
		// 				}
		// 			}
		// 		});
		// 	} catch (e) {
		// 		Logger.getInstance().debug("Unable to get attribute location data for a key in  " + job_name + ": " + e);
		// 	}
		// });
	}

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

	static at_the_end_of_job_definition(textDocument: vscode.TextDocument, line_number: number): boolean {
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
