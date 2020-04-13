import * as vscode from "vscode";
import { Job, JobAttribute } from "./job";
import { JobDefinitionManager } from "./job_definition_manager";

export class JobAttributeCollector {
	static get_attributes_for_job(job: Job, job_manager: JobDefinitionManager): { [id: string]: JobAttribute } {
		var attributes: { [id: string]: JobAttribute } = {};
		let parents: string[] = [job.get_job_name_attribute().attribute_value];

		let current_parent_attribute = job.get_parent_attribute();
		while (current_parent_attribute) {
			let current_parent_name = current_parent_attribute.attribute_value;

			parents.push(current_parent_name);
			current_parent_attribute = undefined;

			let next_parent = job_manager.get_job_with_name(current_parent_name);
			if (next_parent) {
				current_parent_attribute = next_parent.get_parent_attribute();
			}
		}

		while (parents.length > 0) {
			let parent_name = parents.pop();
			if (parent_name) {
				let parent = job_manager.get_job_with_name(parent_name);
				parent?.job_attributes.forEach((attribute) => {
					attributes[attribute.attribute_key] = attribute;
				});
			}
		}
		return attributes;
	}
}
