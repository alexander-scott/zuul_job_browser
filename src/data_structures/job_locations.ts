export class JobLocations {
	public job_locations: JobLocation[] = [];

	add_job_location(job_location: JobLocation) {
		this.job_locations.push(job_location);
	}

	sort() {
		this.job_locations = this.job_locations.sort((n1, n2) => {
			if (n1.line_number > n2.line_number) {
				return 1;
			}

			if (n1.line_number < n2.line_number) {
				return -1;
			}

			return 0;
		});
	}

	belongs_to_job(job_name: string, line_number: number): boolean {
		let index = 0;
		while (true) {
			if (index >= this.job_locations.length) {
				break;
			}

			let current_job = this.job_locations[index];
			if (current_job.line_number < line_number) {
				if (current_job.job_name === job_name) {
					if (index + 1 >= this.job_locations.length) {
						return true;
					}
					let next_job_line_number = this.job_locations[index + 1].line_number;
					if (line_number < next_job_line_number) {
						return true;
					}
				}
			}
			index++;
		}
		return false;
	}
}

export class JobLocation {
	constructor(public readonly line_number: number, public readonly job_name: string) {}
}
