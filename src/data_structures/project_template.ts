import * as vscode from "vscode";
import { Attribute } from "./attribute";

/**
 * A Zuul Project Template which contains a number of attributes.
 */
export class ProjectTemplate {
	private _attributes: Attribute[] = [];

	constructor(public readonly document: vscode.Uri) {}

	add_attribute(attribute: Attribute) {
		this._attributes.push(attribute);
	}

	get_all_job_names(): String[] {
		let jobs: String[] = [];
		this._attributes.forEach((att) => {
			let attribute_value = att.value as any;
			if (typeof attribute_value !== "string") {
				attribute_value["jobs"].forEach((att: string) => {
					jobs.push(att);
				});
			}
		});
		return jobs;
	}

	get_all_job_names_unique(): Set<string> {
		let jobs: Set<string> = new Set();
		this._attributes.forEach((att) => {
			let attribute_value = att.value as any;
			if (typeof attribute_value !== "string") {
				attribute_value["jobs"].forEach((att: string) => {
					jobs.add(att);
				});
			}
		});
		return jobs;
	}
}
