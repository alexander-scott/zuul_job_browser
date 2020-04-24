import { AttributeLocationData } from "./attribute_location_data";

/**
 * A Zuul attribute with it's location in vscode space.
 * An attribute can either have a value of string or more attributes.
 */
export class Attribute {
	public location!: AttributeLocationData;

	constructor(public readonly key: string, public readonly value: Attribute[] | string) {}

	set_location(location: AttributeLocationData) {
		this.location = location;
	}
}
