import * as vscode from "vscode";
import * as yaml from "js-yaml";
import { Logger } from "./logger";
import { Job } from "../data_structures/job";
import { Location } from "../data_structures/location";
import { NewProjectTemplate } from "../data_structures/new_project_template";

export class FileParser {
	private jobs: Job[] = [];
	private project_templates: NewProjectTemplate[] = [];
	private current_locations: Location[] = [];

	constructor(public readonly document: vscode.TextDocument) {}

	listener = (event_type: yaml.EventType, state: any) => {
		if (event_type === "close") {
			if (state.lineIndent === 0 && state.kind === "scalar") {
				if (state.result === "job") {
					// Beginning of a job parsing
					this.current_locations = [];
				}
			} else if (state.lineIndent === 0 && state.kind === "mapping") {
				if (state.result["job"]) {
					this.jobs.push(
						new Job(this.document.uri, state.result["job"], this.remove_duplicate_locations(this.current_locations))
					);
				} else if (state.result["project-template"]) {
					this.project_templates.push(
						new NewProjectTemplate(
							this.document.uri,
							state.result["project-template"],
							this.remove_duplicate_locations(this.current_locations)
						)
					);
				}
			} else {
				if (state.kind === "scalar" && state.result) {
					this.try_parse_location(state);
				}
			}
		}
	};

	try_parse_location(state: any) {
		try {
			let regex = new RegExp(state.result, "g");
			let match: RegExpExecArray | null;
			let line = this.document.lineAt(state.line);
			match = regex.exec(line.text);
			if (match) {
				let start_pos = line.range.start.translate({ characterDelta: match.index });
				let end_pos = start_pos.translate({ characterDelta: state.result.length });
				let vscode_location = new vscode.Range(start_pos, end_pos);
				let job_location = new Location(state.result, state.line, state.lineIndent, vscode_location, this.document.uri);
				this.current_locations.push(job_location);
			}
		} catch (e) {
			Logger.getInstance().debug("Unable to get location data for a value in  " + state.result + ": " + e);
		}
	}

	remove_duplicate_locations(locations: Location[]): Location[] {
		let prev_loc: Location;
		let return_locations: Location[] = [];
		locations.forEach((curr_loc) => {
			if (prev_loc) {
				if (
					!(
						curr_loc.value === prev_loc.value &&
						curr_loc.line_indentation === prev_loc.line_indentation &&
						curr_loc.line_number === prev_loc.line_number
					)
				) {
					return_locations.push(curr_loc);
				}
			} else {
				return_locations.push(curr_loc);
			}
			prev_loc = curr_loc;
		});
		return return_locations;
	}

	get_jobs(): Job[] {
		return this.jobs;
	}

	get_project_templates(): NewProjectTemplate[] {
		return this.project_templates;
	}
}
