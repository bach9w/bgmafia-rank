export type Player = {
	id: string;
	name: string;
	created_at: string;
};

export type DailyStat = {
	id: string;
	player_id: string;
	date: string;
	experience: number;
	victories: number;
	strength: number;
	intelligence: number;
	sex: number;
	created_at: string;
};

export type PlayerRanking = {
	id: string;
	name: string;
	date: string;
	experience: number;
	victories: number;
	strength: number;
	intelligence: number;
	sex: number;
	total_score: number;
};
