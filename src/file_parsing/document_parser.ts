import "reflect-metadata";
import * as vscode from "vscode";
import * as yaml from "js-yaml";
import { Logger } from "./logger";
import { Job } from "../data_structures/job";
import { Location } from "../data_structures/location";
import { ProjectTemplate } from "../data_structures/project_template";
import { Type } from "class-transformer";

export class DocumentParser {
	private parseResult: ParseResult;
	private currentLocations: Location[] = [];

	private readonly unknown_yaml_tags: string[] = ["!encrypted/pkcs1-oaep"];

	constructor(public readonly document: vscode.TextDocument) {
		this.parseResult = new ParseResult(document.uri);
	}

	parse_document() {
		yaml.load(this.document.getText(), {
			schema: this.create_yaml_parsing_schema(),
			listener: this.parse_yaml_object,
		});
	}

	parse_yaml_object = (eventType: yaml.EventType, state: yaml.State) => {
		if (eventType === "close") {
			if (state.lineIndent === 0 && state.kind === "scalar") {
				if (state.result === "job" || state.result === "project-template") {
					this.currentLocations = [];
				}
			} else if (state.lineIndent === 0 && state.kind === "mapping") {
				if (state.result["job"]) {
					const parsedJob = new Job(this.document.uri, state.result["job"]);
					parsedJob.add_locations(this.remove_duplicate_locations(this.currentLocations));
					this.parseResult.add_job(parsedJob);
				} else if (state.result["project-template"]) {
					const parsedTemplate = new ProjectTemplate(this.document.uri, state.result["project-template"]);
					parsedTemplate.add_locations(this.remove_duplicate_locations(this.currentLocations));
					this.parseResult.add_project_template(parsedTemplate);
				}
			} else {
				if (state.kind === "scalar" && state.result) {
					this.try_parse_location(state);
				}
			}
		}
	};

	try_parse_location(state: yaml.State) {
		try {
			const regex = new RegExp(state.result, "g");
			const line = this.document.lineAt(state.line);
			const match: RegExpExecArray | null = regex.exec(line.text);
			if (match) {
				const startPosition = line.range.start.translate({ characterDelta: match.index });
				const endPosition = startPosition.translate({ characterDelta: state.result.length });
				const valueLocation = new Location(
					state.result,
					state.line,
					state.lineIndent,
					startPosition,
					endPosition,
					this.document.uri
				);
				this.currentLocations.push(valueLocation);
			}
		} catch {
			Logger.getInstance().debug("Unable to get location data for a value");
		}
	}

	remove_duplicate_locations(locations: Location[]): Location[] {
		let previousLocation: Location;
		const deduplicatedLocations: Location[] = [];
		locations.forEach((currentLocation) => {
			if (previousLocation) {
				if (
					!(
						currentLocation.value === previousLocation.value &&
						currentLocation.line_indentation === previousLocation.line_indentation &&
						currentLocation.line_number === previousLocation.line_number
					)
				) {
					deduplicatedLocations.push(currentLocation);
				}
			} else {
				deduplicatedLocations.push(currentLocation);
			}
			previousLocation = currentLocation;
		});
		return deduplicatedLocations;
	}

	create_yaml_parsing_schema(): yaml.Schema {
		const customYamlTypes: yaml.Type[] = [];
		this.unknown_yaml_tags.forEach((tag) => {
			customYamlTypes.push(new yaml.Type(tag, { kind: "sequence" }));
		});
		return yaml.DEFAULT_SCHEMA.extend(customYamlTypes);
	}

	get_parse_result(): ParseResult {
		return this.parseResult;
	}
}

export class ParseResult {
	public fileModificationTime!: number;
	@Type(() => Job)
	public jobs: Job[] = [];
	@Type(() => ProjectTemplate)
	public project_templates: ProjectTemplate[] = [];

	constructor(public readonly documentUri: vscode.Uri) {}

	add_job(job: Job) {
		this.jobs.push(job);
	}

	add_project_template(project_template: ProjectTemplate) {
		this.project_templates.push(project_template);
	}

	set_modification_time(time: number) {
		this.fileModificationTime = time;
	}
}
