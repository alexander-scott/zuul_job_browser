import "reflect-metadata";
import * as vscode from "vscode";
import * as yaml from "js-yaml";
import { Logger } from "./logger";
import { Job } from "../data_structures/job";
import { Location } from "../data_structures/location";
import { ProjectTemplate } from "../data_structures/project_template";
import { Type } from "class-transformer";

export class DocumentParser {
	private parse_result: ParseResult;
	private current_locations: Location[] = [];

	private readonly unknown_yaml_tags: string[] = ["!encrypted/pkcs1-oaep"];

	constructor(public readonly document: vscode.TextDocument) {
		this.parse_result = new ParseResult(document.uri);
	}

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
					const new_job = new Job(this.document.uri, state.result["job"]);
					new_job.add_locations(this.remove_duplicate_locations(this.current_locations));
					this.parse_result.add_job(new_job);
				} else if (state.result["project-template"]) {
					const new_template = new ProjectTemplate(this.document.uri, state.result["project-template"]);
					new_template.add_locations(this.remove_duplicate_locations(this.current_locations));
					this.parse_result.add_project_template(new_template);
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
			const regex = new RegExp(state.result, "g");
			const line = this.document.lineAt(state.line);
			const match: RegExpExecArray | null = regex.exec(line.text);
			if (match) {
				const start_pos = line.range.start.translate({ characterDelta: match.index });
				const end_pos = start_pos.translate({ characterDelta: state.result.length });
				const job_location = new Location(
					state.result,
					state.line,
					state.lineIndent,
					start_pos,
					end_pos,
					this.document.uri
				);
				this.current_locations.push(job_location);
			}
		} catch (e) {
			Logger.getInstance().debug("Unable to get location data for a value");
		}
	}

	remove_duplicate_locations(locations: Location[]): Location[] {
		let prev_loc: Location;
		const return_locations: Location[] = [];
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
		const yaml_types: yaml.Type[] = [];
		this.unknown_yaml_tags.forEach((tag) => {
			yaml_types.push(new yaml.Type(tag, { kind: "sequence" }));
		});
		return yaml.Schema.create(yaml_types);
	}

	get_parse_result(): ParseResult {
		return this.parse_result;
	}
}

export class ParseResult {
	public modification_time!: number;
	@Type(() => Job)
	public jobs: Job[] = [];
	@Type(() => ProjectTemplate)
	public project_templates: ProjectTemplate[] = [];

	constructor(public readonly doc_uri: vscode.Uri) {}

	add_job(job: Job) {
		this.jobs.push(job);
	}

	add_project_template(project_template: ProjectTemplate) {
		this.project_templates.push(project_template);
	}

	set_modification_time(time: number) {
		this.modification_time = time;
	}
}
