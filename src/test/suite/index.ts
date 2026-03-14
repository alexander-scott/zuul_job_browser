import * as path from 'path';
import * as fs from 'fs';
import * as Mocha from 'mocha';
import * as glob from 'glob';

function writeCoverage() {
	const g = global as unknown as Record<string, unknown>;
	const coverageData = g['__coverage__'];
	if (coverageData) {
		const nycOutputDir = path.join(__dirname, '../../../.nyc_output');
		fs.mkdirSync(nycOutputDir, { recursive: true });
		fs.writeFileSync(
			path.join(nycOutputDir, 'coverage.json'),
			JSON.stringify(coverageData)
		);
		console.log('Coverage data written to .nyc_output/coverage.json');
	}
}

export function run(): Promise<void> {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
		color: true
	});

	const testsRoot = path.resolve(__dirname, '..');

	return new Promise((c, e) => {
		glob.glob('**/**.test.js', { cwd: testsRoot }).then(files => {
			// Add files to the test suite
			files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

			try {
				// Run the mocha test
				mocha.run(failures => {
					writeCoverage();
					if (failures > 0) {
						e(new Error(`${failures} tests failed.`));
					} else {
						c();
					}
				});
			} catch (err) {
				console.error(err);
				e(err);
			}
		});
	});
}
