import { JobManager } from "./job_manager";
import { Job } from "../data_structures/job";

/**
 * Collects all the attributes for this job, starting with the top level parent.
 * Child attributes with the same key overwrite parent attributes.
 */
export class JobAttributeCollector {
	static get_attributes_for_job(job: Job, job_manager: JobManager): { [id: string]: JobAttribute } {
		const attributes: { [id: string]: JobAttribute } = {};
		const parents: string[] = [job.get_name_value()];

		let current_parent_attribute = job.get_parent_value();
		while (current_parent_attribute) {
			const current_parent_name = current_parent_attribute;

			parents.push(current_parent_name);
			current_parent_attribute = undefined;

			const next_parent = job_manager.get_job_with_name(current_parent_name);
			if (next_parent) {
				current_parent_attribute = next_parent.get_parent_value();
			}
		}

		while (parents.length > 0) {
			const parent_name = parents.pop();
			if (parent_name) {
				const parent = job_manager.get_job_with_name(parent_name);
				if (parent) {
					const values = parent.get_all_attributes_with_values();
					for (const key in values) {
						attributes[key] = new JobAttribute(values[key], parent_name);
					}
				}
			}
		}
		return attributes;
	}

	static get_specific_attribute_from_array(
		attributes: { [id: string]: JobAttribute },
		selected_key: string
	): JobAttribute | undefined {
		if (attributes[selected_key]) {
			return attributes[selected_key];
		}

		for (const key in attributes) {
			const attribute = attributes[key];
			const split_key = key.split(".").pop();
			if (split_key) {
				if (split_key === selected_key) {
					return attribute;
				}
			}
		}

		return undefined;
	}
}

export class JobAttribute {
	constructor(public readonly value: string | boolean, public readonly job_name: string) {}
}
