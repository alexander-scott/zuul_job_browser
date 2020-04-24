import * as vscode from "vscode";
import { Attribute } from "./attribute";
import { AttributeLocationData } from "./attribute_location_data";

export class Job {
	private _job_attributes: Attribute[] = [];
	private readonly _name_attribute = "name";
	private readonly _parent_attribute = "parent";

	constructor(public readonly document: vscode.Uri) {}

	add_attribute(attribute: Attribute) {
		this._job_attributes.push(attribute);
	}

	get_all_attributes(): Attribute[] {
		return this._job_attributes;
	}

	get_job_name_attribute(): Attribute {
		let attribute = this._job_attributes.find((att) => att.key === this._name_attribute);
		if (!attribute) {
			throw new Error("Job name is missing");
		}
		return attribute;
	}

	get_parent_attribute(): Attribute | undefined {
		return this._job_attributes.find((att) => att.key === this._parent_attribute);
	}

	add_location_to_attribute(attribute_key: string, attribute_location: AttributeLocationData) {
		this.add_location_to_attribute_recursive(this._job_attributes, attribute_key, attribute_location);
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
}
