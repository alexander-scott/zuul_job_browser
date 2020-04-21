import * as vscode from "vscode";

export class NewJob {
	public job_attributes: NewJobAttribute[] = [];
	private name_attribute = "name";
	private parent_attribute = "parent";

	constructor(public readonly document: vscode.Uri) {}

	add_attribute(attribute: NewJobAttribute) {
		this.job_attributes.push(attribute);
	}

	get_all_attributes(): NewJobAttribute[] {
		return this.job_attributes;
	}

	get_job_name_attribute(): NewJobAttribute {
		let attribute = this.job_attributes.find((att) => att.attribute_key === this.name_attribute);
		if (!attribute) {
			throw new Error("Job name is missing");
		}
		return attribute;
	}

	get_parent_attribute(): NewJobAttribute | undefined {
		return this.job_attributes.find((att) => att.attribute_key === this.parent_attribute);
	}

	add_location_to_attribute(
		attribute_key: string,
		attribute_location: vscode.Range,
		attribute_line_number: number,
		document: vscode.Uri
	) {
		this.add_location_to_attribute_recursive(
			this.job_attributes,
			attribute_key,
			attribute_location,
			attribute_line_number,
			document
		);
	}

	add_location_to_attribute_recursive(
		attributes: NewJobAttribute[],
		attribute_key: string,
		attribute_location: vscode.Range,
		attribute_line_number: number,
		document: vscode.Uri
	): boolean {
		attributes.forEach((attribute) => {
			let attribute_value = attribute.attribute_value;
			if (attribute.attribute_key == attribute_key) {
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

export class NewJobAttribute {
	public attribute_location!: vscode.Range;
	public attribute_line_number!: number;
	public document!: vscode.Uri;

	constructor(public readonly attribute_key: string, public readonly attribute_value: NewJobAttribute[] | string) {}

	set_location(attribute_location: vscode.Range, attribute_line_number: number, document: vscode.Uri) {
		this.attribute_location = attribute_location;
		this.attribute_line_number = attribute_line_number;
		this.document = document;
	}
}
