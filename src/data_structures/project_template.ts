import * as vscode from "vscode";
import { Location } from "./location";
import { Type } from "class-transformer";

export class ProjectTemplate {
	@Type(() => Location)
	private readonly locations: Location[] = [];
	constructor(public readonly document: vscode.Uri, public readonly job_mapping: any) {}

	add_locations(locations: Location[]) {
		locations.forEach((element) => {
			this.locations.push(element);
		});
	}

	get_all_value_locations(): Location[] {
		return this.locations;
	}

	get_all_locations_with_value(value: string): Location[] {
		let locations_with_value = this.locations.filter((loc) => loc.value === value);
		return locations_with_value;
	}
}
