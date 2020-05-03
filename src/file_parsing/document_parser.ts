import * as vscode from "vscode";
import * as yaml from "js-yaml";
import { Logger } from "./logger";
import { Job } from "../data_structures/job";
import { Location } from "../data_structures/location";
import { ProjectTemplate } from "../data_structures/project_template";

export class DocumentParser {
	private jobs: Job[] = [];
	private project_templates: ProjectTemplate[] = [];
	private current_locations: Location[] = [];

	private readonly unknown_yaml_tags: string[] = ["!encrypted/pkcs1-oaep"];

	constructor(public readonly document: vscode.TextDocument) {}

	parse_document() {
		yaml.load(this.document.getText(), {
			schema: this.create_yaml_parsing_schema(),
			listener: this.parse_yaml_object,
		});
	}

	parse_yaml_object = (event_type: yaml.EventType, state: any) => {
		if (event_type === "close") {
			if (state.lineIndent === 0 && state.kind === "scalar") {
				if (state.result === "job" || state.result === "project-template") {
					this.current_locations = [];
				}
			} else if (state.lineIndent === 0 && state.kind === "mapping") {
				if (state.result["job"]) {
					this.jobs.push(
						new Job(this.document.uri, state.result["job"], this.remove_duplicate_locations(this.current_locations))
					);
				} else if (state.result["project-template"]) {
					this.project_templates.push(
						new ProjectTemplate(
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
			Logger.getInstance().debug("Unable to get location data for a value: " + e);
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

	create_yaml_parsing_schema(): yaml.Schema {
		let yaml_types: yaml.Type[] = [];
		this.unknown_yaml_tags.forEach((tag) => {
			yaml_types.push(new yaml.Type(tag, { kind: "sequence" }));
		});
		return yaml.Schema.create(yaml_types);
	}

	get_jobs(): Job[] {
		return this.jobs;
	}

	get_project_templates(): ProjectTemplate[] {
		return this.project_templates;
	}
}
