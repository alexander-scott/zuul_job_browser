import * as vscode from "vscode";
import { AttributeLocationData } from "./attribute_location_data";

export class Attribute {
	public location!: AttributeLocationData;

	constructor(public readonly key: string, public readonly value: Attribute[] | string) {}

	set_location(location: AttributeLocationData) {
		this.location = location;
	}
}
