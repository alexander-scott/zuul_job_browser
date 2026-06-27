import * as vscode from "vscode";
import { Location } from "./location";
import { Type } from "class-transformer";

export class Job {
	@Type(() => Location)
	private readonly locations: Location[] = [];
	private static readonly name_key = "name";
	private static readonly parent_key = "parent";

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor(public readonly document: vscode.Uri, public readonly jobDefinition: any) {}

	add_locations(locations: Location[]) {
		locations.forEach((location) => {
			this.locations.push(location);
		});
	}

	get_all_value_locations(): Location[] {
		return this.locations;
	}

	get_value(key_path: string[]): string | string[] | undefined {
		if (key_path.length === 0) {
			throw new Error("Path must be specified!");
		}

		let currentValue = this.jobDefinition;
		key_path.forEach((element) => {
			currentValue = currentValue[element];
		});

		return currentValue;
	}

	getRequiredTopLevelValue(key: string): string {
		if (!key) {
			throw new Error("Path must be specified!");
		}

		if (!this.jobDefinition[key]) {
			throw new Error("Requested key (" + key + ") does not exist");
		}
		return this.jobDefinition[key];
	}

	getOptionalTopLevelValue(key: string): string | undefined {
		if (!key) {
			throw new Error("Path must be specified!");
		}

		if (!this.jobDefinition[key]) {
			return undefined;
		}
		return this.jobDefinition[key];
	}

	get_name_value(): string {
		return this.getRequiredTopLevelValue(Job.name_key);
	}

	get_parent_value(): string | undefined {
		return this.getOptionalTopLevelValue(Job.parent_key);
	}

	get_location_of_value(value: string): Location {
		const locations = this.locations.filter((job) => job.value === value);
		if (locations.length === 0) {
			const split_string = value.split(".").pop();
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
		const attributes: Record<string, string> = {};
		this.getAllAttributesWithValuesRecursive(this.jobDefinition, "", attributes);
		return attributes;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	getAllAttributesWithValuesRecursive(attribute: any, currentPath: string, attributes: { [id: string]: string }) {
		for (const attributeKey in attribute) {
			// if (attribute[attributeKey] === null) {
			// 	return;
			// }
			let attributePath;
			if (!currentPath) {
				attributePath = attributeKey;
			} else {
				attributePath = currentPath + "." + attributeKey;
			}
			if (attribute[attributeKey] instanceof Array || typeof attribute[attributeKey] === "object") {
				this.getAllAttributesWithValuesRecursive(attribute[attributeKey], attributePath, attributes);
			} else {
				const attributeValue = attribute[attributeKey];
				if (typeof attributeValue === "string" || typeof attributeValue === "boolean" || typeof attributeValue === "number") {
					attributes[attributePath] = attributeValue as string;
				}
			}
		}
	}
}
