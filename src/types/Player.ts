export interface Player {
	id?: string;
	name: string;
	strength: number;
	gang?: string;
	experience?: number;
	victories?: number;
	intelligence?: number;
	sex?: number;
	exists?: boolean;
	rank?: number;
	duplicateRanks?: number[];
	profileId?: string;
	profileUrl?: string;
	duplicateProfiles?: {
		id: string;
		url: string;
		name: string;
	}[];
}
