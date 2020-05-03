import * as vscode from "vscode";
import * as yaml from "js-yaml";
import { Logger } from "./logger";

export class FileParser {
	private jobs: NewJob[] = [];
	private current_job_locations: Location[] = [];

	constructor(public readonly document: vscode.TextDocument) {}

	listener = (event_type: yaml.EventType, state: any) => {
		if (event_type === "close") {
			// 	try {
			// 		let job_attributes = job.get_all_attributes_with_values();
			// 		job_attributes.forEach((att) => {
			// 			let attribute_value = att.value as string;
			// 			let regex = new RegExp(attribute_value, "g");
			// 			let match: RegExpExecArray | null;
			// 			while ((match = regex.exec(document.getText()))) {
			// 				let attribute_position = document.positionAt(match.index);
			// 				if (job_start_locations.belongs_to_job(job_name, attribute_position.line)) {
			// 					let attribute_location = new vscode.Range(
			// 						attribute_position,
			// 						attribute_position.translate({ characterDelta: attribute_value.length })
			// 					);
			// 					let location_data = new AttributeLocationData(attribute_location, attribute_position.line, document.uri);
			// 					job.add_location_to_attribute(att.key, location_data);
			// 					break;
			// 				}
			// 			}
			// 		});
			// 	} catch (e) {
			// 		Logger.getInstance().debug("Unable to get attribute location data for a key in  " + job_name + ": " + e);
			// 	}
			if (state.lineIndent === 0 && state.kind === "scalar") {
				if (state.result === "job") {
					// Beginning of a job parsing
					this.current_job_locations = [];
				}
			} else if (state.lineIndent === 0 && state.kind === "mapping") {
				if (state.result["job"]) {
					// Full job mapping
					//let cleaned_locations = this.remove_duplicate_locations(this.current_job.locations);
					let prev_loc: Location;
					let locations: Location[] = [];
					this.current_job_locations.forEach((curr_loc) => {
						if (prev_loc) {
							if (
								!(
									curr_loc.value === prev_loc.value &&
									curr_loc.line_indentation === prev_loc.line_indentation &&
									curr_loc.line_number === prev_loc.line_number
								)
							) {
								locations.push(curr_loc);
							}
						} else {
							locations.push(curr_loc);
						}
						prev_loc = curr_loc;
					});
					let new_job = new NewJob(state.result["job"], locations);
					this.jobs.push(new_job);
				}
			} else {
				if (state.kind === "scalar" && state.result) {
					try {
						let regex = new RegExp(state.result, "g");
						let match: RegExpExecArray | null;
						let line = this.document.lineAt(state.line);
						match = regex.exec(line.text);
						if (match) {
							let start_pos = line.range.start.translate({ characterDelta: match.index });
							let end_pos = start_pos.translate({ characterDelta: state.result.length });
							let vscode_location = new vscode.Range(start_pos, end_pos);
							let job_location = new Location(state.result, state.line, state.lineIndent, vscode_location);
							this.current_job_locations.push(job_location);
						}
					} catch (e) {
						Logger.getInstance().debug("Unable to get location data for a value in  " + state.result + ": " + e);
					}
				}
			}
		}
	};

	get_jobs(): NewJob[] {
		return this.jobs;
	}
}

export class Location {
	constructor(
		public readonly value: string,
		public readonly line_number: number,
		public readonly line_indentation: number,
		public readonly vscode_location: vscode.Range
	) {}
}

export class NewJob {
	public document!: vscode.Uri;

	private static readonly name_key = "name";
	private static readonly parent_key = "parent";

	constructor(public readonly job_mapping: any, public readonly locations: Location[]) {}

	get_all_value_locations(): Location[] {
		return this.locations;
	}

	get_value(key_path: string[]): string | string[] | undefined {
		if (key_path.length === 0) throw new Error("Path must be specified!");

		let curr_value = this.job_mapping;
		key_path.forEach((element) => {
			curr_value = curr_value[element];
		});

		return curr_value;
	}

	get_certain_top_level_value(key: string): string {
		if (!key) throw new Error("Path must be specified!");

		if (!this.job_mapping[key]) {
			throw new Error("Requested key (" + key + ") does not exist");
		}
		return this.job_mapping[key];
	}

	get_uncertain_top_level_value(key: string): string | undefined {
		if (!key) throw new Error("Path must be specified!");

		if (!this.job_mapping[key]) {
			return undefined;
		}
		return this.job_mapping[key];
	}

	get_name_value(): string {
		return this.get_certain_top_level_value(NewJob.name_key);
	}

	get_parent_value(): string | undefined {
		return this.get_uncertain_top_level_value(NewJob.parent_key);
	}

	get_location_of_value(value: string): Location {
		let locations = this.locations.filter((job) => job.value === value);
		if (locations.length === 0) {
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
			if (attribute[att] === null) {
				return;
			}
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
				if (att_to_add && (typeof att_to_add === "string" || typeof att_to_add === "boolean")) {
					attributes[new_path] = att_to_add as string;
				} else {
					console.debug("Failed to get value of attribute with key: " + att_to_add.key);
				}
			}
		}
	}
}
