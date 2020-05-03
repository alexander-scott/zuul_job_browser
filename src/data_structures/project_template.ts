import * as vscode from "vscode";
import { Location } from "./location";

export class ProjectTemplate {
	constructor(
		public readonly document: vscode.Uri,
		public readonly job_mapping: any,
		public readonly locations: Location[]
	) {}

	get_all_value_locations(): Location[] {
		return this.locations;
	}

	get_all_locations_with_value(value: string): Location[] {
		let locations_with_value = this.locations.filter((loc) => loc.value === value);
		return locations_with_value;
	}
}
