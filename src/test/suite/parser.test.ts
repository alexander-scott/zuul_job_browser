import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { JobDefinitionparser } from "../../job_parsing/job_definition_parser";
import { TextDecoder } from "util";
import { extensionId } from "../../contants";
import path = require("path");
import { JobDefinitionManager } from "../../job_parsing/job_definition_manager";

suite("Job Parser Test Suite", () => {
	let extension: vscode.Extension<any>;
	let test_file: vscode.TextDocument;

	setup(async function () {
		const ext = vscode.extensions.getExtension(extensionId);
		if (!ext) {
			throw new Error("Extension was not found.");
		}
		if (ext) {
			extension = ext;
		}

		vscode.window.showInformationMessage("Start all job parser tests");

		await load_test_doc();
	});

	async function load_test_doc(): Promise<void> {
		let test_file_encoded = await vscode.workspace.fs.readFile(
			vscode.Uri.file(path.resolve(path.resolve(__dirname, "test_files"), "jobs-test.yaml"))
		);
		let test_file_decoded = new TextDecoder("utf-8").decode(test_file_encoded);
		test_file = await vscode.workspace.openTextDocument({ language: "yaml", content: test_file_decoded });
		vscode.window.showTextDocument(test_file);
	}

	test("Parse jobs", async () => {
		let job_manager = new JobDefinitionManager();
		JobDefinitionparser.parse_job_definitions_in_document(test_file, job_manager);

		let total_jobs_found = job_manager.get_total_jobs_parsed();
		assert.equal(total_jobs_found, 6);
	});
});
