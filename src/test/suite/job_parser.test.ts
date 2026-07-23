import * as vscode from "vscode";
import * as assert from "assert";

import * as path from "path";
import { TextDecoder } from "util";

import { extensionId } from "../../contants";

import { JobAttributeCollector, JobAttribute } from "../../job_parsing/job_attribute_collector";
import { JobParser } from "../../job_parsing/job_parser";
import { FileManager } from "../../file_parsing/file_manager";
import { Job } from "../../data_structures/job";
import { Location } from "../../data_structures/location";
import { Logger } from "../../file_parsing/logger";
import { ParseResult } from "../../file_parsing/document_parser";

vscode.window.showInformationMessage("Start all job parser tests");

suite("Job Parser Test Suite", () => {
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
			vscode.Uri.file(path.resolve(path.resolve(__dirname, "test_files/zuul.d"), "test-jobs.yaml"))
		);
		const test_file_decoded = new TextDecoder("utf-8").decode(test_file_encoded);
		test_file = await vscode.workspace.openTextDocument({ language: "yaml", content: test_file_decoded });

		//vscode.window.showTextDocument(test_file);
	}

	test("Test correct total job count is parsed", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);

		const expected_jobs_found = 12;
		const total_jobs_found = file_manager.get_job_manager().get_total_jobs_parsed();

		assert.equal(total_jobs_found, expected_jobs_found);
	});

	//#region Find job by name

	test("Test find job by name", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);

		let job_name = "test-job-1";
		let job = file_manager.get_job_manager().get_job_with_name(job_name);
		assert.notEqual(job, undefined);

		job_name = "test-job-with-comment-after";
		job = file_manager.get_job_manager().get_job_with_name(job_name);
		assert.notEqual(job, undefined);

		job_name = "test-job-after-comment";
		job = file_manager.get_job_manager().get_job_with_name(job_name);
		assert.notEqual(job, undefined);
	});

	//#endregion

	//#region Find job by parent

	test("Test find jobs with parent", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);

		const parent_name = "test-job-1";
		const expected_children = 2;

		const child_jobs = file_manager.get_job_manager().get_all_jobs_with_this_parent(parent_name);

		assert.equal(child_jobs.length, expected_children);
	});

	//#endregion

	//#region Correct job attribute parsing

	test("Test parse job attribute with child override", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		const job_name = "test-job-with-attribute-overrides";
		const expected_child_attribute = "ubuntu-something";
		const expected_parent_attribute = "42";
		const job = file_manager.get_job_manager().get_job_with_name(job_name) as Job;
		const attributes = JobAttributeCollector.get_attributes_for_job(job, file_manager.get_job_manager());
		const child_attribute = attributes["node-image"].value;
		const parent_attribute = attributes["cpp-version"].value;
		assert.equal(child_attribute, expected_child_attribute);
		assert.equal(parent_attribute, expected_parent_attribute);
	});

	test("Test parse job name with comment after", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);

		const job_name = "test-job-with-comment-after";

		const job = file_manager.get_job_manager().get_job_with_name(job_name);

		assert.notEqual(job, undefined);
	});

	//#endregion

	//#region Location tests

	test("Test get correct job name line number", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);

		const job_name = "test-job-3";
		const expected_job_line_number = 5;
		const job = file_manager.get_job_manager().get_job_with_name(job_name);
		const job_name_location = job?.get_location_of_value(job_name!).line_number;
		assert.notEqual(job, undefined);
		assert.equal(job_name_location, expected_job_line_number);
	});

	test("Test get correct job parent name line number", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);

		const job_name = "test-job-2";
		const expected_job_line_number = 12;
		const job = file_manager.get_job_manager().get_job_with_name(job_name);
		const parent_name = job?.get_parent_value();
		const job_line_number = job?.get_location_of_value(parent_name!).line_number;
		assert.notEqual(job, undefined);
		assert.equal(job_line_number, expected_job_line_number);
	});

	test("Test get correct job line number with multiple name variables", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);

		const job_name = "test-job-with-multiple-name-variables";
		const expected_job_line_number = 50;
		const job = file_manager.get_job_manager().get_job_with_name(job_name);
		const job_line_number = job?.get_location_of_value(job_name).line_number;
		assert.notEqual(job, undefined);
		assert.equal(job_line_number, expected_job_line_number);
	});

	//#endregion

	//#region JobManager method tests

	test("Test add duplicate job does not increase count", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		const total_before = file_manager.get_job_manager().get_total_jobs_parsed();
		const existing_job = file_manager.get_job_manager().get_job_with_name("test-job-1") as Job;
		file_manager.get_job_manager().add_job(existing_job);
		assert.equal(file_manager.get_job_manager().get_total_jobs_parsed(), total_before);
	});

	test("Test remove all jobs clears the manager", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		file_manager.get_job_manager().remove_all_jobs();
		assert.equal(file_manager.get_job_manager().get_total_jobs_parsed(), 0);
	});

	test("Test remove all jobs in document", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		file_manager.get_job_manager().remove_all_jobs_in_document(test_file.uri);
		assert.equal(file_manager.get_job_manager().get_total_jobs_parsed(), 0);
	});

	test("Test get all jobs returns correct count", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		assert.equal(file_manager.get_job_manager().get_all_jobs().length, 12);
	});

	test("Test get all jobs in document returns matching jobs", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		const jobs_in_doc = file_manager.get_job_manager().get_all_jobs_in_document(test_file.uri);
		assert.equal(jobs_in_doc.length, 12);
	});

	test("Test get all jobs in document returns empty for different uri", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		const other_uri = vscode.Uri.file("/nonexistent/file.yaml");
		const jobs_in_doc = file_manager.get_job_manager().get_all_jobs_in_document(other_uri);
		assert.equal(jobs_in_doc.length, 0);
	});

	test("Test get job at range finds the correct job", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		// "test-job-1" is at line 1 (0-indexed), col 10-20
		const word_range = new vscode.Range(new vscode.Position(1, 12), new vscode.Position(1, 15));
		const job = file_manager.get_job_manager().get_job_at(word_range);
		assert.notEqual(job, undefined);
		assert.equal(job?.get_name_value(), "test-job-1");
	});

	test("Test get job at range returns undefined when no overlap", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		// Empty line 3 — no job location here
		const word_range = new vscode.Range(new vscode.Position(3, 0), new vscode.Position(3, 1));
		const job = file_manager.get_job_manager().get_job_at(word_range);
		assert.equal(job, undefined);
	});

	test("Test get parent job returns undefined for nonexistent job", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		const parent = file_manager.get_job_manager().get_parent_job_from_job_name("nonexistent-job");
		assert.equal(parent, undefined);
	});

	test("Test get parent job returns undefined for job with no parent", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		// test-job-with-comment-after has no parent attribute
		const parent = file_manager.get_job_manager().get_parent_job_from_job_name("test-job-with-comment-after");
		assert.equal(parent, undefined);
	});

	test("Test get parent job returns undefined when parent not in manager", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		// test-job-1 parent is "base-library" which is not in the test file
		const parent = file_manager.get_job_manager().get_parent_job_from_job_name("test-job-1");
		assert.equal(parent, undefined);
	});

	test("Test get parent job returns correct parent when in manager", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		// test-job-2 parent is "test-job-1" which IS in the manager
		const parent = file_manager.get_job_manager().get_parent_job_from_job_name("test-job-2");
		assert.notEqual(parent, undefined);
		assert.equal(parent?.get_name_value(), "test-job-1");
	});

	test("Test get all jobs with name returns matching jobs", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		const jobs = file_manager.get_job_manager().get_all_jobs_with_name("test-job-1");
		assert.equal(jobs.length, 1);
	});

	test("Test get all jobs with name returns empty for nonexistent job", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		const jobs = file_manager.get_job_manager().get_all_jobs_with_name("nonexistent-job");
		assert.equal(jobs.length, 0);
	});

	//#endregion

	//#region JobAttributeCollector static method tests

	test("Test get specific attribute by direct key match", async () => {
		const attrs: { [id: string]: JobAttribute } = {
			"cpp-version": new JobAttribute("42", "test-job-3"),
			"node-image": new JobAttribute("windows-92", "test-job-3"),
		};
		const result = JobAttributeCollector.get_specific_attribute_from_array(attrs, "cpp-version");
		assert.notEqual(result, undefined);
		assert.equal(result?.value, "42");
	});

	test("Test get specific attribute by split key match", async () => {
		const attrs: { [id: string]: JobAttribute } = {
			"vars.my-var": new JobAttribute("some-value", "test-job-3"),
		};
		const result = JobAttributeCollector.get_specific_attribute_from_array(attrs, "my-var");
		assert.notEqual(result, undefined);
		assert.equal(result?.value, "some-value");
	});

	test("Test get specific attribute returns undefined when not found", async () => {
		const attrs: { [id: string]: JobAttribute } = {
			"cpp-version": new JobAttribute("42", "test-job-3"),
		};
		const result = JobAttributeCollector.get_specific_attribute_from_array(attrs, "nonexistent");
		assert.equal(result, undefined);
	});

	//#endregion

	//#region JobParser static method tests

	test("Test parse parent name from line with parent attribute", async () => {
		// Line 2 (0-indexed): "    parent: base-library"
		const parent = JobParser.parse_parent_name_from_single_line(test_file, 2);
		assert.equal(parent, "base-library");
	});

	test("Test parse parent name from line without parent attribute", async () => {
		// Line 1: "    name: test-job-1" — no parent here
		const parent = JobParser.parse_parent_name_from_single_line(test_file, 1);
		assert.equal(parent, undefined);
	});

	test("Test parse job name from line with name attribute", async () => {
		// Line 1 (0-indexed): "    name: test-job-1"
		const name = JobParser.parse_job_name_from_single_line(test_file, 1);
		assert.equal(name, "test-job-1");
	});

	test("Test parse job name from line without name attribute", async () => {
		// Line 2: "    parent: base-library" — no name here
		const name = JobParser.parse_job_name_from_single_line(test_file, 2);
		assert.equal(name, undefined);
	});

	test("Test parse playbook run from line with run colon format", async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: "yaml",
			content: "- job:\n    name: playbook-job\n    run: playbooks/test.yaml\n",
		});
		// Line 2 (0-indexed): "    run: playbooks/test.yaml"
		const result = JobParser.parse_playbook_run_from_single_line(doc, 2);
		assert.equal(result, "playbooks/test.yaml");
	});

	test("Test parse playbook run from line with bullet list format", async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: "yaml",
			content: "- job:\n    name: playbook-job\n    pre-run:\n      - playbooks/setup.yaml\n",
		});
		// Line 3 (0-indexed): "      - playbooks/setup.yaml"
		const result = JobParser.parse_playbook_run_from_single_line(doc, 3);
		assert.equal(result, "playbooks/setup.yaml");
	});

	test("Test parse playbook run from line without yaml extension returns undefined", async () => {
		// Line 1: "    name: test-job-1" has no .yaml extension
		const result = JobParser.parse_playbook_run_from_single_line(test_file, 1);
		assert.equal(result, undefined);
	});

	test("Test at end of job definition at start of job block", async () => {
		// Line 0: "- job:" starts a new job
		assert.equal(JobParser.at_the_end_of_job_definition(test_file, 0), true);
	});

	test("Test at end of job definition inside job returns false", async () => {
		// Line 1: "    name: test-job-1" is inside a job
		assert.equal(JobParser.at_the_end_of_job_definition(test_file, 1), false);
	});

	test("Test at end of job definition at negative line returns true", async () => {
		assert.equal(JobParser.at_the_end_of_job_definition(test_file, -1), true);
	});

	test("Test at end of job definition beyond document end returns true", async () => {
		assert.equal(JobParser.at_the_end_of_job_definition(test_file, 99999), true);
	});

	test("Test parse job attribute from line with valid attribute", async () => {
		// Line 5 (0-indexed): "    name: test-job-3"
		const result = JobParser.parse_job_attribute_from_line(5, test_file);
		assert.notEqual(result, undefined);
		assert.equal(result?.["attribute_key"], "name");
		assert.equal(result?.["attribute_value"], "test-job-3");
	});

	test("Test parse job attribute from empty line returns undefined", async () => {
		// Line 3 (0-indexed): empty
		const result = JobParser.parse_job_attribute_from_line(3, test_file);
		assert.equal(result, undefined);
	});

	test("Test parse job attribute from line with colon but no value returns undefined", async () => {
		// Line 0: "- job:" has colon but no value after it
		const result = JobParser.parse_job_attribute_from_line(0, test_file);
		assert.equal(result, undefined);
	});

	test("Test remove spaces from special value strips spaces", async () => {
		const result = JobParser.remove_spaces_from_special_value("name", "  test value  ");
		assert.equal(result, "testvalue");
	});

	test("Test remove spaces from non-special value keeps spaces", async () => {
		const result = JobParser.remove_spaces_from_special_value("node-image", "  ubuntu-latest  ");
		assert.equal(result, "  ubuntu-latest  ");
	});

	test("Test parse ansible variable from position inside variable", async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: "yaml",
			content: '- job:\n    name: ansible-job\n    run: "{{ my_variable }}"\n',
		});
		// Line 2: '    run: "{{ my_variable }}"'
		// "{{ my_variable }}" — {{ starts at col 10, my_variable at col 13
		const position = new vscode.Position(2, 14);
		const result = JobParser.parse_anisble_variable_from_position_in_line(doc, position);
		assert.equal(result, "my_variable");
	});

	test("Test parse ansible variable from position outside variable returns undefined", async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: "yaml",
			content: '- job:\n    name: ansible-job\n    run: "{{ my_variable }}"\n',
		});
		// Position at the start of the line — not inside any {{ }}
		const position = new vscode.Position(2, 0);
		const result = JobParser.parse_anisble_variable_from_position_in_line(doc, position);
		assert.equal(result, undefined);
	});

	//#endregion

	//#region Job data structure tests

	test("Test Job get value throws on empty path", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		const job = file_manager.get_job_manager().get_job_with_name("test-job-1") as Job;
		assert.throws(() => job.get_value([]), Error);
	});

	test("Test Job get value returns correct value", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		const job = file_manager.get_job_manager().get_job_with_name("test-job-1") as Job;
		assert.equal(job.get_value(["name"]), "test-job-1");
	});

	test("Test Job get certain top level value throws on empty key", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		const job = file_manager.get_job_manager().get_job_with_name("test-job-1") as Job;
		assert.throws(() => job.get_certain_top_level_value(""), Error);
	});

	test("Test Job get certain top level value throws on missing key", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		const job = file_manager.get_job_manager().get_job_with_name("test-job-1") as Job;
		assert.throws(() => job.get_certain_top_level_value("nonexistent"), Error);
	});

	test("Test Job get uncertain top level value throws on empty key", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		const job = file_manager.get_job_manager().get_job_with_name("test-job-1") as Job;
		assert.throws(() => job.get_uncertain_top_level_value(""), Error);
	});

	test("Test Job get uncertain top level value returns undefined for missing key", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		const job = file_manager.get_job_manager().get_job_with_name("test-job-1") as Job;
		assert.equal(job.get_uncertain_top_level_value("nonexistent"), undefined);
	});

	test("Test Job get location with dotted key falls back to split key", async () => {
		const uri = vscode.Uri.file("/test/fake.yaml");
		const job = new Job(uri, { name: "test", vars: { "my-var": "value" } });
		const loc = new Location(
			"my-var",
			0,
			4,
			new vscode.Position(0, 0),
			new vscode.Position(0, 6),
			uri
		);
		job.add_locations([loc]);
		// "vars.my-var" is not found directly; falls back to split key "my-var"
		const result = job.get_location_of_value("vars.my-var");
		assert.equal(result.value, "my-var");
	});

	test("Test Job get all attributes skips null parent", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		const job = file_manager.get_job_manager().get_job_with_name("test-job-with-null-parent") as Job;
		const attrs = job.get_all_attributes_with_values();
		assert.equal(attrs["parent"], undefined);
		assert.equal(attrs["name"], "test-job-with-null-parent");
	});

	test("Test Job get all attributes with empty array value", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		const job = file_manager.get_job_manager().get_job_with_name("test-job-with-empty-variable-array") as Job;
		const attrs = job.get_all_attributes_with_values();
		assert.equal(attrs["name"], "test-job-with-empty-variable-array");
	});

	test("Test Job get all attributes with boolean and number values", async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: "yaml",
			content: "- job:\n    name: typed-job\n    timeout: 1800\n    voting: false\n",
		});
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(doc);
		const job = file_manager.get_job_manager().get_job_with_name("typed-job") as Job;
		assert.notEqual(job, undefined);
		const attrs = job.get_all_attributes_with_values();
		assert.equal(attrs["timeout"], 1800 as unknown as string);
		assert.equal(attrs["voting"], false as unknown as string);
	});

	//#endregion

	//#region Logger tests

	test("Test Logger getInstance returns singleton", async () => {
		const logger1 = Logger.getInstance();
		const logger2 = Logger.getInstance();
		assert.strictEqual(logger1, logger2);
	});

	test("Test Logger constructor throws when instance already exists", async () => {
		// After any test has run, Logger.instance is set; direct construction must throw
		assert.throws(() => {
			new Logger();
		}, Error);
	});

	test("Test Logger log and debug do not throw", async () => {
		assert.doesNotThrow(() => {
			Logger.getInstance().log("test log message");
			Logger.getInstance().debug("test debug message");
		});
	});

	//#endregion

	//#region ParseResult tests

	test("Test ParseResult set modification time", async () => {
		const result = new ParseResult(vscode.Uri.file("/test/fake.yaml"));
		result.set_modification_time(99999);
		assert.equal(result.modification_time, 99999);
	});

	//#endregion

	//#region DocumentParser error-handling tests

	test("Test DocumentParser handles invalid regex in YAML value gracefully", async () => {
		// "(unclosed" forms an invalid regex (unclosed parenthesis group); parsing must not throw
		const doc = await vscode.workspace.openTextDocument({
			language: "yaml",
			content: "- job:\n    name: test-regex-job\n    bad-pattern: \"(unclosed\"\n",
		});
		const file_manager = new FileManager("");
		assert.doesNotThrow(() => {
			file_manager.parse_document_from_text_and_update_managers(doc);
		});
		// The job must still be parsed correctly despite the invalid-regex value
		const job = file_manager.get_job_manager().get_job_with_name("test-regex-job");
		assert.notEqual(job, undefined);
	});

	test("Test DocumentParser remove_duplicate_locations removes consecutive duplicate", async () => {
		const doc = await vscode.workspace.openTextDocument({ language: "yaml", content: "test: value\n" });
		const { DocumentParser } = await import("../../file_parsing/document_parser");
		const parser = new DocumentParser(doc);
		const uri = vscode.Uri.file("/test/fake.yaml");
		const pos_start = new vscode.Position(0, 0);
		const pos_end = new vscode.Position(0, 4);
		const loc1 = new Location("dup", 0, 0, pos_start, pos_end, uri);
		const loc2 = new Location("dup", 0, 0, pos_start, pos_end, uri); // exact duplicate
		const loc3 = new Location("other", 1, 0, pos_start, pos_end, uri); // non-duplicate
		const result = parser.remove_duplicate_locations([loc1, loc2, loc3]);
		// loc2 is a consecutive duplicate of loc1 and should be removed
		assert.equal(result.length, 2);
		assert.equal(result[0].value, "dup");
		assert.equal(result[1].value, "other");
	});

	//#endregion

	//#region Additional Job data structure edge cases

	test("Test Job get location of value throws when multiple locations exist", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);
		// test-job-with-multiple-name-variables has "name" as a YAML key at two different
		// positions (job-level name and secrets[].name), so get_location_of_value("name") throws
		const job = file_manager.get_job_manager().get_job_with_name("test-job-with-multiple-name-variables") as Job;
		assert.throws(() => job.get_location_of_value("name"), /Not implemented/);
	});

	test("Test Job get location of value throws when not found with no valid split", async () => {
		const uri = vscode.Uri.file("/test/fake.yaml");
		const job = new Job(uri, { name: "test-job" });
		// No locations added — empty-string value causes split to return "" (falsy) → throws
		assert.throws(() => job.get_location_of_value(""), /No locations found/);
	});

	test("Test Job get all attributes skips undefined values", async () => {
		const uri = vscode.Uri.file("/test/fake.yaml");
		// Directly constructed mapping with an undefined attribute value
		const job = new Job(uri, { name: "test-job", "undef-attr": undefined });
		const attrs = job.get_all_attributes_with_values();
		// undefined is not string/boolean/number, so it must be skipped
		assert.equal(attrs["undef-attr"], undefined);
		assert.equal(attrs["name"], "test-job");
	});

	//#endregion

	//#region JobAttributeCollector falsy split-key edge case

	test("Test get specific attribute skips key with empty split segment", async () => {
		// A key ending in "." has an empty last segment after split — must be skipped gracefully
		const attrs: { [id: string]: JobAttribute } = {
			"vars.": new JobAttribute("value", "test-job"),
		};
		// "vars.".split(".").pop() === "" — falsy — no match
		const result = JobAttributeCollector.get_specific_attribute_from_array(attrs, "value");
		assert.equal(result, undefined);
	});

	//#endregion

	//#region parse_job_from_random_line_number edge cases

	test("Test parse job from random line returns undefined for job without name", async () => {
		// A YAML job block with no name attribute — both searches exhaust without finding "name"
		const doc = await vscode.workspace.openTextDocument({
			language: "yaml",
			content: "- job:\n    parent: base\n",
		});
		// Start on the parent line; downward search hits end-of-file, upward hits "- job:" boundary
		const result = JobParser.parse_job_from_random_line_number(doc, 1);
		assert.equal(result, undefined);
	});

	test("Test parse job from random line finds name by searching past non-name attributes", async () => {
		// Start position is on a non-name attribute line; search must pass "node-image" before finding "name"
		// Line 7 (0-indexed) in test-jobs.yaml: "    node-image: "windows-92""
		const result = JobParser.parse_job_from_random_line_number(test_file, 7);
		assert.equal(result, "test-job-3");
	});

	//#endregion
});
