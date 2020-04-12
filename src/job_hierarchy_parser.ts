import * as vscode from 'vscode';
import { JobManager } from "./job_manager";
import { Job } from './job';

export class JobHierarchyParser {
    private _jobManager = new JobManager();


    getJobManager(): JobManager {
        return this._jobManager;
    }

    parse(textDocument: vscode.TextDocument): void {
        this._parseJobHierarchy(textDocument);
    }

    _parseJobHierarchy(textDocument: vscode.TextDocument): void {
        let job_regex = /^- job:/gm;
        let match: RegExpExecArray | null;
        while (match = job_regex.exec(textDocument.getText())) {
            let line_number = textDocument.positionAt(match.index).line;
            this._parseIndividualJob(textDocument, line_number);
        }
    }

    _parseIndividualJob(textDocument: vscode.TextDocument, job_line_number: number): void {
        let job_name_regex = /(?<=name:).*/gm;
        let job_name = null;
        let job_name_location = null;
        let job_parent_regex = /(?<=parent:).*/gm;
        let parent_name = null;
        let parent_name_location = null;

        while (true) {
            job_line_number++;
            // Make sure we're not at the end of the document
            if (job_line_number >= textDocument.lineCount) {
                break;
            }
            let line = textDocument.lineAt(job_line_number);
            let line_text = line.text;
            // If this line is empty then we're at the end of the job
            if (!line_text) {
                break;
            }
            if (job_name_regex.exec(line_text)) {
                job_name = line_text.replace(/\s/g, "").toLowerCase().split(":").pop();
                job_name_location = line;
                continue;
            }
            if (job_parent_regex.exec(line_text)) {
                parent_name = line_text.replace(/\s/g, "").toLowerCase().split(":").pop();
                parent_name_location = line;
                continue;
            }
        }

        if (job_name !== null && job_name !== undefined && parent_name !== null && parent_name !== undefined && job_name_location !== null && parent_name_location !== null) {
            //console.log("SUCCESS2: " + job_name + " -- " + parent_name);
            this._jobManager.add_job(new Job(job_name_location.text, job_name, parent_name, job_name_location.range, parent_name_location.range));
        }
    }
}