import * as vscode from "vscode";
import { Location } from "./location";
import { Type } from "class-transformer";

export class Job {
	@Type(() => Location)
	private readonly locations: Location[] = [];
	private static readonly name_key = "name";
	private static readonly parent_key = "parent";

	constructor(public readonly document: vscode.Uri, public readonly job_mapping: any) {}

	add_locations(locations: Location[]) {
		locations.forEach((element) => {
			this.locations.push(element);
		});
	}

	get_all_value_locations(): Location[] {
		return this.locations;
	}

	get_value(key_path: string[]): string | string[] | undefined {
		if (key_path.length === 0) {
			throw new Error("Path must be specified!");
		}

		let curr_value = this.job_mapping;
		key_path.forEach((element) => {
			curr_value = curr_value[element];
		});

		return curr_value;
	}

	get_certain_top_level_value(key: string): string {
		if (!key) {
			throw new Error("Path must be specified!");
		}

		if (!this.job_mapping[key]) {
			throw new Error("Requested key (" + key + ") does not exist");
		}
		return this.job_mapping[key];
	}

	get_uncertain_top_level_value(key: string): string | undefined {
		if (!key) {
			throw new Error("Path must be specified!");
		}

		if (!this.job_mapping[key]) {
			return undefined;
		}
		return this.job_mapping[key];
	}

	get_name_value(): string {
		return this.get_certain_top_level_value(Job.name_key);
	}

	get_parent_value(): string | undefined {
		return this.get_uncertain_top_level_value(Job.parent_key);
	}

	get_location_of_value(value: string): Location {
		let locations = this.locations.filter((job) => job.value === value);
		if (locations.length === 0) {
			let split_string = value.split(".").pop();
			if (split_string) {
				return this.get_location_of_value(split_string);
			}
			throw new Error("No locations found!");
		}
		if (locations.length === 1) {
			return locations[0];
		}
		// We must find the correct one!
		throw new Error("Not implemented");
	}

	get_all_attributes_with_values(): { [id: string]: string } {
		let attributes: {} = {};
		this._get_all_attributes_with_values_recursive(this.job_mapping, "", attributes);
		return attributes;
	}

	_get_all_attributes_with_values_recursive(attribute: any, curr_path: string, attributes: { [id: string]: string }) {
		for (const att in attribute) {
			// if (attribute[att] === null) {
			// 	return;
			// }
			let new_path;
			if (!curr_path) {
				new_path = att;
			} else {
				new_path = curr_path + "." + att;
			}
			if (attribute[att] instanceof Array || typeof attribute[att] === "object") {
				this._get_all_attributes_with_values_recursive(attribute[att], new_path, attributes);
			} else {
				let att_to_add = attribute[att];
				if (typeof att_to_add === "string" || typeof att_to_add === "boolean" || typeof att_to_add === "number") {
					attributes[new_path] = att_to_add as string;
				}
			}
		}
	}
}
