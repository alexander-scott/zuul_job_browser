import * as vscode from "vscode";
import { ProjectTemplateJob } from "./project_template_job";

/**
 * Sample model of what the text in the document contains.
 */
export class ProjectTemplateJobManager {
	private _jobs: ProjectTemplateJob[] = [];

	add_job(job: ProjectTemplateJob): void {
		this._jobs.push(job);
	}
}
