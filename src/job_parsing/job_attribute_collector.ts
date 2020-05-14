import { JobManager } from "./job_manager";
import { Job } from "../data_structures/job";

/**
 * Collects all the attributes for this job, starting with the top level parent.
 * Child attributes with the same key overwrite parent attributes.
 */
export class JobAttributeCollector {
	static get_attributes_for_job(job: Job, job_manager: JobManager): { [id: string]: JobAttribute } {
		let attributes: { [id: string]: JobAttribute } = {};
		let parents: string[] = [job.get_name_value()];

		let current_parent_attribute = job.get_parent_value();
		while (current_parent_attribute) {
			let current_parent_name = current_parent_attribute;

			parents.push(current_parent_name);
			current_parent_attribute = undefined;

			let next_parent = job_manager.get_job_with_name(current_parent_name);
			if (next_parent) {
				current_parent_attribute = next_parent.get_parent_value();
			}
		}

		while (parents.length > 0) {
			let parent_name = parents.pop();
			if (parent_name) {
				let parent = job_manager.get_job_with_name(parent_name);
				if (parent) {
					let values = parent.get_all_attributes_with_values();
					for (let key in values) {
						attributes[key] = new JobAttribute(values[key], parent_name);
					}
				}
			}
		}
		return attributes;
	}
}

export class JobAttribute {
	constructor(public readonly value: string | boolean, public readonly job_name: string) {}
}
