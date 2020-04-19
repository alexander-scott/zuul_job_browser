import * as vscode from "vscode";

export class Job {
	private name_attribute = "name";
	private parent_attribute = "parent";

	constructor(public readonly job_attributes: JobAttribute[], public readonly document: vscode.Uri) {}

	get_job_name_attribute(): JobAttribute {
		let job = this.job_attributes.find((att) => att.attribute_key === this.name_attribute);
		if (!job) {
			throw new Error("Job name is missing");
		}
		return job;
	}

	get_parent_attribute(): JobAttribute | undefined {
		return this.job_attributes.find((att) => att.attribute_key === this.parent_attribute);
	}

	get_attribute(attribute_name: string): JobAttribute | undefined {
		return this.job_attributes.find((att) => att.attribute_key === attribute_name);
	}
}

export class JobAttribute {
	constructor(
		public readonly attribute_key: string,
		public attribute_value: string,
		public readonly attribute_location: vscode.Range,
		public readonly attribute_line_number: number,
		public readonly document: vscode.Uri
	) {}
}
