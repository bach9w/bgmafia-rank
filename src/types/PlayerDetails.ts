import { DailyStat } from "./database.types";

export interface PlayerDetails {
	id: string;
	name: string;
	profile_id: string;
	stats: DailyStat[];
	totalStats: {
		strength: number;
		intelligence: number;
		sex: number;
		victories: number;
		experience: number;
		total_score: number;
	};
	// Статистика за последните 30 дни
	recentActivity: {
		date: string;
		strength?: number;
		intelligence?: number;
		sex?: number;
		victories?: number;
		experience?: number;
	}[];
}
