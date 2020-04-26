import * as vscode from "vscode";
import { Attribute } from "./attribute";
import { Logger } from "../file_parsing/logger";

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
		let job_names: Set<string> = new Set();
		this._attributes.forEach((att) => {
			let attribute_value = att.value as any;
			if (typeof attribute_value !== "string") {
				let attribute_jobs = attribute_value["jobs"]; // Must be an array with a jobs attribute (a pipeline)
				if (attribute_jobs) {
					for (const job in attribute_jobs) {
						// If this attribute has dependencies
						if (attribute_jobs[job] instanceof Array || typeof attribute_jobs[job] === "object") {
							for (const key in attribute_jobs[job]) {
								let obj = attribute_jobs[job][key];
								if (obj["dependencies"]) {
									if (key && typeof key === "string") {
										job_names.add(key);
									} else {
										Logger.getInstance().debug("Key is not a string: " + key);
									}

									obj["dependencies"].forEach((dep: string) => {
										if (dep && typeof dep === "string") {
											job_names.add(dep);
										} else {
											Logger.getInstance().debug("Dep is not a string: " + dep);
										}
									});
								}
							}
						} else {
							let job_name = attribute_jobs[job];
							if (job_name && typeof job_name === "string") {
								job_names.add(job_name);
							} else {
								Logger.getInstance().debug("Job name is not a string: " + job_name);
							}
						}
					}
				}
			}
		});
		return job_names;
	}
}
