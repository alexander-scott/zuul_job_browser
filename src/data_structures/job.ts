import * as vscode from "vscode";
import { Attribute } from "./attribute";

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
		let attribute = this._job_attributes.find((att) => att.attribute_key === this._name_attribute);
		if (!attribute) {
			throw new Error("Job name is missing");
		}
		return attribute;
	}

	get_parent_attribute(): Attribute | undefined {
		return this._job_attributes.find((att) => att.attribute_key === this._parent_attribute);
	}

	add_location_to_attribute(
		attribute_key: string,
		attribute_location: vscode.Range,
		attribute_line_number: number,
		document: vscode.Uri
	) {
		this.add_location_to_attribute_recursive(
			this._job_attributes,
			attribute_key,
			attribute_location,
			attribute_line_number,
			document
		);
	}

	add_location_to_attribute_recursive(
		attributes: Attribute[],
		attribute_key: string,
		attribute_location: vscode.Range,
		attribute_line_number: number,
		document: vscode.Uri
	): boolean {
		attributes.forEach((attribute) => {
			let attribute_value = attribute.attribute_value;
			if (attribute.attribute_key === attribute_key) {
				attribute.set_location(attribute_location, attribute_line_number, document);
				return true;
			} else {
				if (attribute_value instanceof Array) {
					return this.add_location_to_attribute_recursive(
						attribute_value,
						attribute_key,
						attribute_location,
						attribute_line_number,
						document
					);
				}
				return false;
			}
		});
		return false;
	}
}
