import * as vscode from "vscode";
import * as assert from "assert";

import * as path from "path";
import { TextDecoder } from "util";

import { extensionId } from "../../contants";

import { FileManager } from "../../file_parsing/file_manager";
import { ProjectTemplateParser } from "../../project_template_parsing/project_template_parser";

vscode.window.showInformationMessage("Start all project template parser tests");

suite("Project Template Parser Test Suite", () => {
	let test_file: vscode.TextDocument;

	setup(async function () {
		const ext = vscode.extensions.getExtension(extensionId);
		if (!ext) {
			throw new Error("Extension was not found.");
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

	//#region ProjectTemplateManager additional tests

	test("Test remove all templates in document clears templates for that uri", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		assert.equal(file_manager.get_project_template_manager().get_all_project_templates().length, 1);
		file_manager.get_project_template_manager().remove_all_templates_in_document(test_file.uri);
		assert.equal(file_manager.get_project_template_manager().get_all_project_templates().length, 0);
	});

	test("Test remove all templates clears all templates", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		file_manager.get_project_template_manager().remove_all_templates();
		assert.equal(file_manager.get_project_template_manager().get_all_project_templates().length, 0);
	});

	test("Test get all jobs with name returns empty array when name not present", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		const locations = file_manager.get_project_template_manager().get_all_jobs_with_name("nonexistent-job");
		assert.equal(locations.length, 0);
	});

	test("Test get single job on line returns correct location", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		// Line 7 (0-indexed) in test-project-template.yaml: "        - test-job-3"
		const loc = file_manager.get_project_template_manager().get_single_job_on_line(test_file.uri, 7);
		assert.notEqual(loc, undefined);
		assert.equal(loc?.value, "test-job-3");
	});

	test("Test get single job on line returns undefined for empty line", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		// Use a line number that has no job location
		const loc = file_manager.get_project_template_manager().get_single_job_on_line(test_file.uri, 0);
		assert.equal(loc, undefined);
	});

	test("Test get single job on line returns undefined for different document", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		const other_uri = vscode.Uri.file("/nonexistent/file.yaml");
		const loc = file_manager.get_project_template_manager().get_single_job_on_line(other_uri, 7);
		assert.equal(loc, undefined);
	});

	//#endregion

	//#region ProjectTemplateParser static method tests

	test("Test parse job name from line with job bullet returns job name", async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: "yaml",
			content: "- project-template:\n    check:\n      jobs:\n        - test-job-1\n",
		});
		// Line 3 (0-indexed): "        - test-job-1"
		const name = ProjectTemplateParser.parse_job_name_from_line_in_document(doc, 3);
		assert.equal(name, "test-job-1");
	});

	test("Test parse job name from line without bullet returns undefined", async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: "yaml",
			content: "- project-template:\n    name: template-name\n",
		});
		// Line 1: "    name: template-name" — no ` -` pattern
		const name = ProjectTemplateParser.parse_job_name_from_line_in_document(doc, 1);
		assert.equal(name, undefined);
	});

	//#endregion

	//#region Location tests

	test("Test Location get as vscode location returns correct range", async () => {
		const uri = vscode.Uri.file("/test/fake.yaml");
		const start = new vscode.Position(5, 10);
		const end = new vscode.Position(5, 20);
		const { Location } = await import("../../data_structures/location");
		const loc = new Location("test-value", 5, 4, start, end, uri);
		const range = loc.get_as_vscode_location();
		assert.ok(range.start.isEqual(start));
		assert.ok(range.end.isEqual(end));
	});

	//#endregion

	//#region ProjectTemplate data structure tests

	test("Test ProjectTemplate get all locations with value returns matching locations", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		const templates = file_manager.get_project_template_manager().get_all_project_templates();
		assert.equal(templates.length, 1);
		const template = templates[0];
		// "test-job-3" appears 5 times in the template
		const locs = template.get_all_locations_with_value("test-job-3");
		assert.equal(locs.length, 5);
		// A value that doesn't exist should return empty
		const empty = template.get_all_locations_with_value("nonexistent");
		assert.equal(empty.length, 0);
	});

	//#endregion
});
