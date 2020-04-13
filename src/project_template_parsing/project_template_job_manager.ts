import * as vscode from "vscode";
import { ProjectTemplateJob } from "./project_template_job";

/**
 * Sample model of what the text in the document contains.
 */
export class ProjectTemplateJobManager {
	private _jobs: ProjectTemplateJob[] = [];
	private _known_files: Set<string> = new Set();

	add_job(job: ProjectTemplateJob): void {
		this._known_files.add(job.document.path);
		this._jobs.push(job);
	}

	is_known_file(uri: vscode.Uri): boolean {
		return this._known_files.has(uri.path);
	}

	remove_all_jobs_in_document(uri: vscode.Uri): void {
		this._known_files.delete(uri.path);
		this._jobs = this._jobs.filter((job) => job.document.path !== uri.path);
	}

	get_all_jobs_with_name(job_name: string): ProjectTemplateJob[] | undefined {
		return this._jobs.filter((job) => job.job_name === job_name);
	}
}
