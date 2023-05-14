import * as vscode from "vscode";
import * as assert from "assert";

import path = require("path");
import { TextDecoder } from "util";

import { extensionId } from "../../contants";

import { FileManager } from "../../file_parsing/file_manager";

vscode.window.showInformationMessage("Start all project template parser tests");

suite("Project Template Parser Test Suite", () => {
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

		await load_test_doc();
	});

	async function load_test_doc(): Promise<void> {
		const test_file_encoded = await vscode.workspace.fs.readFile(
			vscode.Uri.file(path.resolve(path.resolve(__dirname, "test_files/zuul.d"), "test-project-template.yaml"))
		);
		const test_file_decoded = new TextDecoder("utf-8").decode(test_file_encoded);
		test_file = await vscode.workspace.openTextDocument({ language: "yaml", content: test_file_decoded });

		//vscode.window.showTextDocument(test_file);
	}

	test("Test correct total project template is parsed", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);

		const expected_templates_found = 1;
		const total_jobs_found = file_manager.get_project_template_manager().get_all_project_templates().length;

		assert.equal(total_jobs_found, expected_templates_found);
	});

	//#region Find job by name

	test("Test correct total jobs instance count", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);

		const expected_jobs_found = 5;
		const total_jobs_found = file_manager.get_project_template_manager().get_all_jobs_with_name("test-job-3")?.length;

		assert.equal(total_jobs_found, expected_jobs_found);
	});

	test("Test correct total jobs instance count similiar name", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);

		const expected_jobs_found = 1;
		const total_jobs_found = file_manager.get_project_template_manager().get_all_jobs_with_name("test-job-2")?.length;

		assert.equal(total_jobs_found, expected_jobs_found);
	});

	//#endregion

	//#region Job locations

	test("Test correct total job location", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		const job = file_manager.get_project_template_manager().get_first_job_with_name("test-job-7");
		assert.notEqual(job, undefined);
		const expected_line_number = 25;
		const line_number = job?.line_number;
		assert.equal(line_number, expected_line_number);
	});

	//#endregion
});
