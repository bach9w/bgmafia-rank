"use client";

import { useEffect, useState } from "react";
import { DailyStat } from "@/types/database.types";
import { RankingTable } from "@/components/RankingTable";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { ScrapeButton } from "@/components/ScrapeButton";

// Тип за показване на статистика с daily_stats
type PlayerWithStats = {
	id: string;
	name: string;
	daily_stats: DailyStat[];
};

type PlayerRanking = {
	id: string;
	name: string;
	strength: number;
	intelligence: number;
	sex: number;
	victories: number;
	experience: number;
	total_score: number;
	attack: number; // Атака = (Сила * 0.45 + Интелект * 0.55)
	respect: number; // Респект = (Атака * 0.85 + Сексапил * 0.15)
	date: string;
};

export default function Home() {
	const [rankings, setRankings] = useState<PlayerRanking[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isSeasonStarted, setIsSeasonStarted] = useState<boolean>(false);
	const router = useRouter();

	// Функция за проверка дали сезонът е стартирал
	const checkSeasonStatus = () => {
		// Целевата дата за старт на сезона - утре в 19:00 часа
		const start = new Date("2025-03-31T19:00:00");
		start.setDate(start.getDate() + 1);
		start.setHours(19, 0, 0, 0);

		const now = new Date();

		// Ако текущото време е след посочената дата, сезонът е стартирал
		setIsSeasonStarted(now >= start);

		return now >= start;
	};

	// Проверяваме статуса на сезона при зареждане на компонента
	useEffect(() => {
		checkSeasonStatus();

		// Проверяваме на всеки 60 секунди
		const interval = setInterval(() => {
			const isStarted = checkSeasonStatus();
			if (isStarted) {
				// Ако сезонът е стартирал, спираме проверката
				clearInterval(interval);
			}
		}, 60000);

		return () => clearInterval(interval);
	}, []);

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
								attack: 0,
								respect: 0,
								date: new Date().toISOString().split("T")[0], // Текуща дата
							});
						}

						// Сумираме стойностите за всички дни
						const playerSummary = playerMap.get(playerId)!;
						player.daily_stats.forEach((stat: Partial<DailyStat>) => {
							playerSummary.strength += Number(stat.strength || 0);
							playerSummary.intelligence += Number(stat.intelligence || 0);
							playerSummary.sex += Number(stat.sex || 0);
							playerSummary.victories += Number(stat.victories || 0);
							playerSummary.experience += Number(stat.experience || 0);
						});

						// Изчисляваме атака и респект по точните формули
						playerSummary.attack = Math.round(
							playerSummary.strength * 0.33 + playerSummary.intelligence * 0.55,
						);

						playerSummary.respect = Math.round(
							playerSummary.strength * 0.42 +
								playerSummary.sex * 0.42 +
								playerSummary.intelligence * 0.42,
						);

						playerSummary.total_score = playerSummary.respect;

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
		<main className="min-h-screen p-2 md:p-0 bg-black ">
			<div className="max-w-7xl mx-auto space-y-8">
				<h1 className="text-3xl font-bold text-center mb-8 text-white pt-8">
					Класация на Играчите
				</h1>

				{isSeasonStarted && (
					<div className="bg-yellow-800 text-white p-6 rounded-lg mx-4 md:mx-8">
						<div className="flex items-center mb-2">
							<Calendar className="h-6 w-6 mr-2" />
							<h2 className="text-xl font-bold">Нов сезон на BGMafia!</h2>
						</div>
						<p className="mb-2">
							Новият сезон започва утре след 19:00 часа. Дотогава всички функции
							за добавяне на данни са изключени.
						</p>
						<p className="text-yellow-300 font-semibold">
							Очаквайте нови функционалности и подобрения в системата.
						</p>
					</div>
				)}

				<div className="flex flex-col gap-8 text-black">
					<div className="">
						<div className="flex flex-col md:flex-row justify-between bg-white items-center p-8">
							<h2 className="text-xl font-semibold mb-4 text-black">
								Обща класация (сума от всички дни)
							</h2>
							<div className="grid grid-cols-2 gap-2 md:flex md:flex-row  w-full items-center justify-center">
								<Button
									variant="destructive"
									className=" col-span-2"
									onClick={() => {
										router.push("/rankings");
									}}
								>
									История на класациите
								</Button>

								<Link href="/rankings/upload">
									<Button disabled={!isSeasonStarted}>Добави показатели</Button>
								</Link>

								<Button
									variant="default"
									disabled={!isSeasonStarted}
									onClick={() => {
										router.push("/day-type");
									}}
								>
									Добави ден
								</Button>
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
				<ScrapeButton />
			</div>
		</main>
	);
}
