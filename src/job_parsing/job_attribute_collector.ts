import { JobDefinitionManager } from "./job_definition_manager";
import { NewJob, NewJobAttribute } from "./new_job";

/**
 * Collects all the attributes for this job, starting with the top level parent.
 * Child attributes with the same key overwrite parent attributes.
 */
export class JobAttributeCollector {
	static get_attributes_for_job(job: NewJob, job_manager: JobDefinitionManager): { [id: string]: NewJobAttribute } {
		var attributes: { [id: string]: NewJobAttribute } = {};
		let parents: string[] = [job.get_job_name_attribute().attribute_value as string];

		let current_parent_attribute = job.get_parent_attribute();
		while (current_parent_attribute) {
			let current_parent_name = current_parent_attribute.attribute_value as string;

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
