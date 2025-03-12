"use client";

import { useEffect, useState } from "react";
import { PlayerRanking, DailyStat } from "@/types/database.types";
import { RankingTable } from "@/components/RankingTable";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Тип за показване на статистика с daily_stats
type PlayerWithStats = {
	id: string;
	name: string;
	daily_stats: DailyStat[];
};

export default function Home() {
	const [rankings, setRankings] = useState<PlayerRanking[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchRankings = async () => {
		try {
			// Променяме заявката да извлича сумарните данни за всички дни
			const { data: aggregatedData, error: aggregationError } =
				await supabase.rpc("get_players_summary_stats");

			if (aggregationError) {
				// Ако RPC функцията не е налична, използваме алтернативна агрегация директно в заявката
				console.warn(
					"Грешка при извикване на RPC функцията:",
					aggregationError,
				);

				// Извличаме данните ръчно със summing
				const { data, error } = await supabase.from("players").select(`
						id,
						name,
						daily_stats!inner (
							date,
							strength,
							intelligence,
							sex,
							victories,
							experience
						)
					`);

				if (error) throw error;

				// Трансформираме данните и сумираме стойностите за всеки играч
				const playerMap = new Map<string, PlayerRanking>();

				if (data) {
					(data as PlayerWithStats[]).forEach((player) => {
						if (!player.daily_stats || !Array.isArray(player.daily_stats))
							return;

						// Извличаме ID и име на играча
						const playerId = player.id;
						const playerName = player.name;

						// Намираме или създаваме запис за играча
						if (!playerMap.has(playerId)) {
							playerMap.set(playerId, {
								id: playerId,
								name: playerName,
								strength: 0,
								intelligence: 0,
								sex: 0,
								victories: 0,
								experience: 0,
								total_score: 0,
								date: new Date().toISOString().split("T")[0], // Текуща дата
							});
						}

						// Сумираме стойностите за всички дни
						const playerSummary = playerMap.get(playerId)!;
						player.daily_stats.forEach((stat: Partial<DailyStat>) => {
							playerSummary.strength += Number(stat.strength || 0);
							playerSummary.intelligence += Number(stat.intelligence || 0);
							playerSummary.sex += Number(stat.sex || 0);
						});

						// Обновяваме общия резултат
						playerSummary.total_score =
							playerSummary.strength +
							playerSummary.intelligence +
							playerSummary.sex;

						// Съхраняваме обратно в Map-а
						playerMap.set(playerId, playerSummary);
					});
				}

				// Конвертираме Map-а в масив и сортираме по общ резултат
				const playerRankings = Array.from(playerMap.values()).sort(
					(a, b) => b.total_score - a.total_score,
				);

				setRankings(playerRankings);
			} else {
				// Обработка на резултатите от RPC функцията, ако е налична
				setRankings(aggregatedData || []);
			}
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Грешка при зареждане на класацията",
			);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchRankings();

		// Subscribe to changes
		const channel = supabase
			.channel("player_rankings")
			.on("postgres_changes", { event: "*", schema: "public" }, () => {
				fetchRankings();
			})
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, []);

	return (
		<main className="min-h-screen p-8 bg-black ">
			<div className="max-w-7xl mx-auto space-y-8">
				<h1 className="text-3xl font-bold text-center mb-8 text-white">
					Класация на Играчите
				</h1>

				<div className="flex flex-col gap-8 text-black">
					<div className="">
						<div className="flex flex-col md:flex-row justify-between bg-white items-center p-8">
							<h2 className="text-xl font-semibold mb-4 text-black">
								Обща класация (сума от всички дни)
							</h2>
							<div className="flex gap-2">
								<Link href="/rankings">
									<Button variant="outline">История на класациите</Button>
								</Link>
								<Link href="/rankings/upload">
									<Button>Добави показатели</Button>
								</Link>
							</div>
						</div>
						{isLoading ? (
							<div className="text-center py-8">Зареждане...</div>
						) : error ? (
							<div className="text-red-600 text-center py-8">{error}</div>
						) : rankings.length === 0 ? (
							<div className="text-center py-8">
								Все още няма данни в класацията
							</div>
						) : (
							<RankingTable rankings={rankings} />
						)}
					</div>
				</div>
			</div>
		</main>
	);
}
