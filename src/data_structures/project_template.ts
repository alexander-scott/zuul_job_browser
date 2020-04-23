import * as vscode from "vscode";
import { Attribute } from "./attribute";

export class ProjectTemplate {
	private attributes: Attribute[] = [];

	constructor(public readonly document: vscode.Uri) {}

	add_attribute(attribute: Attribute) {
		this.attributes.push(attribute);
	}

	get_all_job_names(): String[] {
		let jobs: String[] = [];
		this.attributes.forEach((att) => {
			let attribute_value = att.attribute_value as any;
			if (typeof attribute_value !== "string") {
				attribute_value["jobs"].forEach((att: string) => {
					jobs.push(att);
				});
			}
		});
		return jobs;
	}
}
