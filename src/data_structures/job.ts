import * as vscode from "vscode";
import { AttributeLocationData } from "./attribute_location_data";
import { Attribute } from "./attribute";

/**
 * A Zuul Job which contains a number of attributes.
 */
export class Job {
	private _attributes: Attribute[] = [];

	private static readonly name_attribute_key = "name";
	private static readonly parent_attribute_key = "parent";

	constructor(public readonly document: vscode.Uri) {}

	add_attribute(attribute: Attribute) {
		this._attributes.push(attribute);
	}

	add_location_to_attribute(attribute_key: string, attribute_location: AttributeLocationData) {
		this.add_location_to_attribute_recursive(this._attributes, attribute_key, attribute_location);
	}

	add_location_to_attribute_recursive(
		attributes: Attribute[],
		attribute_key: string,
		attribute_location: AttributeLocationData
	): boolean {
		attributes.forEach((attribute) => {
			let attribute_value = attribute.value;
			if (attribute.key === attribute_key) {
				attribute.set_location(attribute_location);
				return true;
			} else {
				if (attribute_value instanceof Array) {
					return this.add_location_to_attribute_recursive(attribute_value, attribute_key, attribute_location);
				}
				return false;
			}
		});
		return false;
	}

	get_all_attributes(): Attribute[] {
		return this._attributes;
	}

	get_job_name_attribute(): Attribute {
		let attribute = this._attributes.find((att) => att.key === Job.name_attribute_key);
		if (!attribute) {
			throw new Error("Job name is missing");
		}
		return attribute;
	}

	get_parent_attribute(): Attribute | undefined {
		return this._attributes.find((att) => att.key === Job.parent_attribute_key);
	}
}
