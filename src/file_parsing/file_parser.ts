import * as vscode from "vscode";
import * as yaml from "js-yaml";
import { Logger } from "./logger";
import { NewJob } from "../data_structures/new_job";
import { Location } from "../data_structures/location";

export class FileParser {
	private jobs: NewJob[] = [];
	private current_job_locations: Location[] = [];

	constructor(public readonly document: vscode.TextDocument) {}

	listener = (event_type: yaml.EventType, state: any) => {
		if (event_type === "close") {
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
					let new_job = new NewJob(this.document.uri, state.result["job"], locations);
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
