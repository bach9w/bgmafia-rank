"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { LoaderCircle, ChevronDown, ChevronUp } from "lucide-react";
import { StatType } from "@/components/RankingsUploader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Тип за данните на играча с класацията
type PlayerRanking = {
	id: string;
	name: string;
	strength: number;
	intelligence: number;
	sex: number;
	victories: number;
	experience: number;
	total_score: number;
	date: string;
	day_type?: string;
};

// Тип за седмични периоди
type WeeklyPeriod = {
	week_start: string;
	week_end: string;
	player_count: number;
};

export default function RankingsPage() {
	const [rankings, setRankings] = useState<PlayerRanking[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [dates, setDates] = useState<string[]>([]);
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [sortBy, setSortBy] = useState<StatType | "total_score">("total_score");
	const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

	// Добавяме състояние за седмична класация
	const [weeklyPeriods, setWeeklyPeriods] = useState<WeeklyPeriod[]>([]);
	const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(
		null,
	);
	const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");

	const toggleRow = (playerId: string) => {
		setExpandedRows((prev) => ({
			...prev,
			[playerId]: !prev[playerId],
		}));
	};

	// Зареждане на наличните дати
	useEffect(() => {
		const fetchDates = async () => {
			setIsLoading(true);

			try {
				// Извличаме директно от таблицата daily_stats
				const { data, error } = await supabase
					.from("daily_stats")
					.select("date")
					.order("date", { ascending: false });

				if (error) {
					throw error;
				}

				if (data && data.length > 0) {
					// Извличаме уникалните дати
					const uniqueDatesSet = new Set<string>();

					data.forEach((item) => {
						if (item.date) {
							// Нормализираме формата на датите, за да бъдат последователни
							// ISO формат е добър избор за сортиране и последователност
							const dateString = new Date(item.date)
								.toISOString()
								.split("T")[0];
							uniqueDatesSet.add(dateString);
						}
					});

					// Превръщаме в масив и сортираме
					const uniqueDates = Array.from(uniqueDatesSet).sort().reverse();

					console.log("Намерени дати:", uniqueDates);

					if (uniqueDates.length > 0) {
						setDates(uniqueDates);

						// Избираме най-новата дата като начална
						if (!selectedDate) {
							setSelectedDate(uniqueDates[0]);
						}
					} else {
						setError("Няма намерени дати в базата данни");
					}
				} else {
					// Няма намерени данни
					setDates([]);
					setError("Няма намерени данни за класациите");
				}
			} catch (err) {
				console.error("Грешка при зареждане на дати:", err);
				setError("Възникна грешка при зареждане на датите");

				// Използваме твърдо зададени дати като резервен вариант
				const hardcodedDates = [
					"2025-04-02",
					"2025-04-01",
					"2025-03-31",
					"2025-03-30",
				];
				console.log("Използване на твърдо кодирани дати:", hardcodedDates);
				setDates(hardcodedDates);

				if (!selectedDate) {
					setSelectedDate(hardcodedDates[0]);
				}
			} finally {
				setIsLoading(false);
			}
		};

		fetchDates();
	}, []); // Премахваме selectedDate от зависимостите

	// Зареждане на класацията за избраната дата
	useEffect(() => {
		const fetchRankings = async () => {
			if (!selectedDate) return;

			setIsLoading(true);
			setError(null);

			try {
				console.log("Зареждане на класация за дата:", selectedDate);

				// Директен join на двете таблици с SQL заявка
				const { data, error } = await supabase
					.from("daily_stats")
					.select(
						`
						strength,
						intelligence, 
						sex,
						victories,
						experience,
						date,
						day_type,
						players(id, name)
					`,
					)
					.eq("date", selectedDate);

				if (error) {
					console.error("SQL грешка:", error);
					throw error;
				}

				console.log("Получени данни:", data?.length || 0, "записа");

				if (data && data.length > 0) {
					// Трансформираме данните в необходимия формат
					const formattedData: PlayerRanking[] = [];

					for (const item of data) {
						if (!item.players) {
							console.warn("Липсват данни за играч:", item);
							continue;
						}

						// Изчисляваме Нова атака (точки) по формулата
						const totalScore =
							Math.round(Number(item.strength || 0) * 0.3) +
							Math.round(Number(item.intelligence || 0) * 0.3) +
							Math.round(Number(item.sex || 0) * 0.4);

						// Достъпваме данните за играча - структурата зависи от Supabase
						const playerInfo =
							typeof item.players === "object"
								? Array.isArray(item.players)
									? item.players[0]
									: item.players
								: { id: "", name: "Непознат играч" };

						// Добавяме в класацията
						formattedData.push({
							id: String(playerInfo.id || ""),
							name: String(playerInfo.name || ""),
							strength: Number(item.strength || 0),
							intelligence: Number(item.intelligence || 0),
							sex: Number(item.sex || 0),
							victories: Number(item.victories || 0),
							experience: Number(item.experience || 0),
							total_score: totalScore,
							date: String(item.date),
							day_type: item.day_type || undefined,
						});
					}

					// Сортираме по Нова атака (total_score) преди да зададем данните
					formattedData.sort((a, b) => b.total_score - a.total_score);

					console.log("Форматирани данни:", formattedData.length, "записа");
					setRankings(formattedData);
				} else {
					console.log("Няма данни за датата:", selectedDate);
					setRankings([]);
					setError("Няма намерени данни за избраната дата");
				}
			} catch (err) {
				console.error("Грешка при зареждане на класацията:", err);
				setError("Грешка при зареждане на класацията");
				setRankings([]);
			} finally {
				setIsLoading(false);
			}
		};

		fetchRankings();
	}, [selectedDate]);

	// Зареждане на наличните седмични периоди
	useEffect(() => {
		const fetchWeeklyPeriods = async () => {
			try {
				console.log("Опитваме да заредим седмични периоди...");

				// Извличаме директно от таблицата daily_stats, групирани по седмица
				const { data, error } = await supabase
					.from("daily_stats")
					.select("date")
					.order("date", { ascending: false });

				if (error) {
					console.error("SQL грешка при извличане на дати:", error);
					throw error;
				}

				if (data && data.length > 0) {
					// Групираме данните по седмици
					const weekMap = new Map<string, WeeklyPeriod>();

					data.forEach((item: { date: string }) => {
						if (item.date) {
							const date = new Date(item.date);
							// Намираме началото на седмицата (събота)
							const day = date.getDay(); // 0 - неделя, 6 - събота
							const daysToSaturday = day === 6 ? 0 : (day + 1) % 7; // Изчисляваме дните до събота

							const weekStart = new Date(date);
							weekStart.setDate(date.getDate() - daysToSaturday);

							const weekEnd = new Date(weekStart);
							weekEnd.setDate(weekStart.getDate() + 6);

							const weekStartStr = weekStart.toISOString().split("T")[0];
							const weekEndStr = weekEnd.toISOString().split("T")[0];

							const key = weekStartStr;

							if (!weekMap.has(key)) {
								weekMap.set(key, {
									week_start: weekStartStr,
									week_end: weekEndStr,
									player_count: 1,
								});
							} else {
								const existing = weekMap.get(key)!;
								existing.player_count += 1;
							}
						}
					});

					// Превръщаме в масив и сортираме по дата
					const periods = Array.from(weekMap.values()).sort(
						(a, b) =>
							new Date(b.week_start).getTime() -
							new Date(a.week_start).getTime(),
					);

					console.log("Намерени седмични периоди:", periods.length);
					setWeeklyPeriods(periods);

					if (periods.length > 0 && !selectedWeekStart) {
						setSelectedWeekStart(periods[0].week_start);
					}
				} else {
					// Няма данни
					console.log("Няма намерени данни за седмични периоди");
					setWeeklyPeriods([]);
				}
			} catch (err) {
				console.error("Грешка при зареждане на седмични периоди:", err);
				// Използваме твърдо кодирани седмични периоди като аварийно решение
				const hardcodedPeriods: WeeklyPeriod[] = [
					{
						week_start: "2025-03-30",
						week_end: "2025-04-05",
						player_count: 138,
					},
				];

				console.log("Използваме твърдо кодирани периоди:", hardcodedPeriods);
				setWeeklyPeriods(hardcodedPeriods);

				if (!selectedWeekStart) {
					setSelectedWeekStart(hardcodedPeriods[0].week_start);
				}
			}
		};

		fetchWeeklyPeriods();
	}, []);

	// Зареждане на седмичната класация
	useEffect(() => {
		const fetchWeeklyRankings = async () => {
			if (!selectedWeekStart || viewMode !== "weekly") return;

			setIsLoading(true);
			setError(null);

			try {
				console.log(
					"Зареждане на седмична класация за период от:",
					selectedWeekStart,
				);

				// Намираме крайната дата на периода (събота + 6 дни)
				const startDate = new Date(selectedWeekStart);
				const endDate = new Date(startDate);
				endDate.setDate(startDate.getDate() + 6);

				const weekEnd = endDate.toISOString().split("T")[0];

				// Извличаме данните директно от daily_stats с JOIN към players
				const { data, error } = await supabase
					.from("daily_stats")
					.select(
						`
						player_id,
						strength,
						intelligence,
						sex,
						victories,
						experience,
						players(id, name)
					`,
					)
					.gte("date", selectedWeekStart)
					.lte("date", weekEnd);

				if (error) {
					console.error(
						"SQL грешка при извличане на седмична класация:",
						error,
					);
					throw error;
				}

				if (data && data.length > 0) {
					// Агрегираме данните по играч
					interface PlayerData {
						id: string;
						name: string;
						strength: number;
						intelligence: number;
						sex: number;
						victories: number;
						experience: number;
					}

					interface PlayerWithId {
						id: string;
						name: string;
					}

					interface PlayerItem {
						player_id: string;
						strength: number;
						intelligence: number;
						sex: number;
						victories: number;
						experience: number;
						players: PlayerWithId | PlayerWithId[] | null;
					}

					const playerMap = new Map<string, PlayerData>();

					data.forEach((item: PlayerItem) => {
						if (!item.players) return;

						// Различни структури в зависимост от това как Supabase връща nested обекти
						let playerInfo: PlayerWithId;

						if (Array.isArray(item.players)) {
							playerInfo = item.players[0] || {
								id: "",
								name: "Непознат играч",
							};
						} else {
							playerInfo = item.players;
						}

						const playerId = String(playerInfo.id || "");

						if (!playerMap.has(playerId)) {
							playerMap.set(playerId, {
								id: playerId,
								name: String(playerInfo.name || ""),
								strength: Number(item.strength || 0),
								intelligence: Number(item.intelligence || 0),
								sex: Number(item.sex || 0),
								victories: Number(item.victories || 0),
								experience: Number(item.experience || 0),
							});
						} else {
							const existing = playerMap.get(playerId)!;
							existing.strength += Number(item.strength || 0);
							existing.intelligence += Number(item.intelligence || 0);
							existing.sex += Number(item.sex || 0);
							existing.victories += Number(item.victories || 0);
							existing.experience += Number(item.experience || 0);
						}
					});

					// Превръщаме в масив и изчисляваме Нова атака
					const formattedData: PlayerRanking[] = Array.from(
						playerMap.values(),
					).map((player) => {
						const totalScore =
							Math.round(player.strength * 0.3) +
							Math.round(player.intelligence * 0.3) +
							Math.round(player.sex * 0.4);

						return {
							id: player.id,
							name: player.name,
							strength: player.strength,
							intelligence: player.intelligence,
							sex: player.sex,
							victories: player.victories,
							experience: player.experience,
							total_score: totalScore,
							date: selectedWeekStart,
							day_type: `Седмица ${formatDateForDisplay(
								selectedWeekStart,
							)} - ${formatDateForDisplay(weekEnd)}`,
						};
					});

					// Сортираме по Нова атака
					formattedData.sort((a, b) => b.total_score - a.total_score);

					console.log(
						"Форматирани седмични данни:",
						formattedData.length,
						"записа",
					);
					setRankings(formattedData);
				} else {
					setRankings([]);
					setError("Няма данни за избрания седмичен период");
				}
			} catch (err) {
				console.error("Грешка при зареждане на седмична класация:", err);
				setError("Грешка при зареждане на седмичната класация");
				setRankings([]);
			} finally {
				setIsLoading(false);
			}
		};

		fetchWeeklyRankings();
	}, [selectedWeekStart, viewMode]);

	// Зареждаме съответните данни според избрания режим
	useEffect(() => {
		// Ако променим режима, трябва да заредим правилните данни
		if (viewMode === "daily" && selectedDate) {
			// Зареждане на дневна класация - вече е имплементирано в друг useEffect
		} else if (viewMode === "weekly" && selectedWeekStart) {
			// Този useEffect ще задейства седмичната класация
		}
	}, [viewMode, selectedDate, selectedWeekStart]);

	// Форматиране на дата за показване
	const formatDateForDisplay = (dateStr: string): string => {
		try {
			// Правилно парсване на датата, използвайки ISO формат
			const date = new Date(dateStr);

			// Проверка за валидна дата
			if (isNaN(date.getTime())) {
				console.error("Невалидна дата за форматиране:", dateStr);
				return "Невалидна дата";
			}

			// Използваме българска локализация за форматиране
			return new Intl.DateTimeFormat("bg-BG", {
				day: "numeric",
				month: "long",
				year: "numeric",
			}).format(date);
		} catch (error) {
			console.error("Грешка при форматиране на дата:", error);
			return dateStr; // Връщаме оригиналния стринг при грешка
		}
	};

	// Форматиране на седмичен период за показване
	const formatWeeklyPeriodForDisplay = (
		weekStartStr: string,
		weekEndStr?: string,
	): string => {
		try {
			const start = new Date(weekStartStr);
			const end = weekEndStr ? new Date(weekEndStr) : new Date(start);

			if (weekEndStr === undefined) {
				// Ако нямаме крайна дата, изчисляваме я
				end.setDate(start.getDate() + 6);
			}

			if (isNaN(start.getTime()) || isNaN(end.getTime())) {
				return "Невалиден период";
			}

			const startFormatted = new Intl.DateTimeFormat("bg-BG", {
				day: "numeric",
				month: "long",
			}).format(start);

			const endFormatted = new Intl.DateTimeFormat("bg-BG", {
				day: "numeric",
				month: "long",
				year: "numeric",
			}).format(end);

			return `${startFormatted} - ${endFormatted}`;
		} catch (error) {
			console.error("Грешка при форматиране на седмичен период:", error);
			return "Грешка при форматиране";
		}
	};

	// Сортиране на класацията
	const sortedRankings = [...rankings].sort((a, b) => {
		const aValue = a[sortBy as keyof PlayerRanking];
		const bValue = b[sortBy as keyof PlayerRanking];

		// Проверяваме дали стойностите са числа преди да извършим сортиране
		if (typeof aValue === "number" && typeof bValue === "number") {
			return bValue - aValue;
		}
		return 0;
	});

	return (
		<div className="container mx-auto py-8">
			<Button
				className="mb-8"
				variant="outline"
				onClick={() => window.history.back()}
			>
				Назад
			</Button>

			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Класация на играчите</CardTitle>
					{selectedDate &&
						viewMode === "daily" &&
						sortedRankings.length > 0 &&
						sortedRankings[0].day_type && (
							<div className="text-sm font-medium text-amber-600 mt-2">
								Вид на деня: {sortedRankings[0].day_type}
							</div>
						)}
					{selectedWeekStart &&
						viewMode === "weekly" &&
						sortedRankings.length > 0 && (
							<div className="text-sm font-medium text-amber-600 mt-2">
								Седмична класация:{" "}
								{formatWeeklyPeriodForDisplay(
									selectedWeekStart,
									weeklyPeriods.find((p) => p.week_start === selectedWeekStart)
										?.week_end,
								)}
							</div>
						)}
				</CardHeader>

				<CardContent>
					<div className="flex flex-col gap-6">
						{/* Табове за превключване между дневна и седмична класация */}
						<Tabs
							value={viewMode}
							onValueChange={(v: string) =>
								setViewMode(v as "daily" | "weekly")
							}
						>
							<TabsList className="mb-4">
								<TabsTrigger value="daily">Дневна класация</TabsTrigger>
								<TabsTrigger value="weekly">Седмична класация</TabsTrigger>
							</TabsList>

							<TabsContent value="daily" className="space-y-4">
								{/* Филтри за дневна класация */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="flex flex-col gap-2">
										<label
											htmlFor="date-filter"
											className="text-sm font-medium"
										>
											Дата на класацията
										</label>
										<Select
											value={selectedDate || ""}
											onValueChange={(value) => setSelectedDate(value)}
										>
											<SelectTrigger id="date-filter" className="w-full">
												<SelectValue placeholder="Изберете дата" />
											</SelectTrigger>
											<SelectContent>
												{dates.map((date) => (
													<SelectItem key={date} value={date}>
														{formatDateForDisplay(date)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="flex flex-col gap-2">
										<label htmlFor="sort-by" className="text-sm font-medium">
											Подреди по
										</label>
										<Select
											value={sortBy}
											onValueChange={(value) =>
												setSortBy(value as StatType | "total_score")
											}
										>
											<SelectTrigger id="sort-by" className="w-full">
												<SelectValue placeholder="Изберете показател" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="total_score">Нова атака</SelectItem>
												<SelectItem value="strength">Сила</SelectItem>
												<SelectItem value="intelligence">Интелект</SelectItem>
												<SelectItem value="sex">Секс</SelectItem>
												<SelectItem value="victories">Победи</SelectItem>
												<SelectItem value="experience">Опит</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</TabsContent>

							<TabsContent value="weekly" className="space-y-4">
								{/* Филтри за седмична класация */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="flex flex-col gap-2">
										<label
											htmlFor="week-filter"
											className="text-sm font-medium"
										>
											Седмичен период
										</label>
										<Select
											value={selectedWeekStart || ""}
											onValueChange={(value) => setSelectedWeekStart(value)}
										>
											<SelectTrigger id="week-filter" className="w-full">
												<SelectValue placeholder="Изберете седмица" />
											</SelectTrigger>
											<SelectContent>
												{weeklyPeriods.map((period) => (
													<SelectItem
														key={period.week_start}
														value={period.week_start}
													>
														{formatWeeklyPeriodForDisplay(
															period.week_start,
															period.week_end,
														)}{" "}
														({period.player_count} играчи)
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="flex flex-col gap-2">
										<label
											htmlFor="sort-by-weekly"
											className="text-sm font-medium"
										>
											Подреди по
										</label>
										<Select
											value={sortBy}
											onValueChange={(value) =>
												setSortBy(value as StatType | "total_score")
											}
										>
											<SelectTrigger id="sort-by-weekly" className="w-full">
												<SelectValue placeholder="Изберете показател" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="total_score">Нова атака</SelectItem>
												<SelectItem value="strength">Обща сила</SelectItem>
												<SelectItem value="intelligence">
													Общ интелект
												</SelectItem>
												<SelectItem value="sex">Общ секс</SelectItem>
												<SelectItem value="victories">Общо победи</SelectItem>
												<SelectItem value="experience">Общ опит</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</TabsContent>
						</Tabs>

						{/* Класация - обща секция за показване на данните (и за дневна и за седмична) */}
						{isLoading ? (
							<div className="flex justify-center items-center py-12">
								<LoaderCircle className="h-8 w-8 animate-spin text-primary" />
							</div>
						) : error ? (
							<div className="py-8 text-center text-red-500">{error}</div>
						) : sortedRankings.length === 0 ? (
							<div className="py-8 text-center text-gray-500">
								Няма данни за класацията в избрания период
							</div>
						) : (
							<>
								{/* Мобилен изглед - само за малки екрани */}
								<div className="md:hidden">
									<div className="bg-gray-50 px-4 py-3 border-b border-gray-300 grid grid-cols-12 gap-2">
										<div className="col-span-2 text-xs font-medium text-gray-500 uppercase">
											№
										</div>
										<div className="col-span-7 text-xs font-medium text-gray-500 uppercase">
											Име
										</div>
										<div className="col-span-3 text-xs font-medium text-gray-500 uppercase">
											Атака
										</div>
									</div>
									{sortedRankings.map((player, index) => (
										<div key={player.id} className="border-b border-gray-200">
											<div
												className={`px-4 py-3 grid grid-cols-12 gap-2 items-center cursor-pointer ${
													index % 2 === 0 ? "bg-white" : "bg-gray-50"
												}`}
												onClick={() => toggleRow(player.id)}
											>
												<div className="col-span-2 text-sm font-medium text-gray-900">
													{index + 1}
												</div>
												<div className="col-span-7 text-sm text-gray-900 flex items-center">
													{player.name}
													<span className="ml-auto">
														{expandedRows[player.id] ? (
															<ChevronUp size={16} />
														) : (
															<ChevronDown size={16} />
														)}
													</span>
												</div>
												<div className="col-span-3 text-sm font-medium text-gray-900">
													{player.total_score.toLocaleString()}
												</div>
											</div>

											{expandedRows[player.id] && (
												<div className="bg-gray-50 px-4 py-3 grid grid-cols-2 gap-4 text-sm">
													<div className="col-span-1">
														<p className="font-medium text-gray-500">Опит:</p>
														<p className="text-gray-900">
															{player.experience.toLocaleString()}
														</p>
													</div>
													<div className="col-span-1">
														<p className="font-medium text-gray-500">Победи:</p>
														<p className="text-gray-900">
															{player.victories.toLocaleString()}
														</p>
													</div>
													<div className="col-span-1">
														<p className="font-medium text-gray-500">Сила:</p>
														<p className="text-gray-900">
															{player.strength.toLocaleString()}
														</p>
													</div>
													<div className="col-span-1">
														<p className="font-medium text-gray-500">
															Интелект:
														</p>
														<p className="text-gray-900">
															{player.intelligence.toLocaleString()}
														</p>
													</div>
													<div className="col-span-1">
														<p className="font-medium text-gray-500">Секс:</p>
														<p className="text-gray-900">
															{player.sex.toLocaleString()}
														</p>
													</div>
												</div>
											)}
										</div>
									))}
								</div>

								{/* Десктоп изглед - видим само на средни и големи екрани */}
								<div className="overflow-x-auto hidden md:block">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="w-12">№</TableHead>
												<TableHead>Име</TableHead>
												<TableHead className="text-right">Сила</TableHead>
												<TableHead className="text-right">Интелект</TableHead>
												<TableHead className="text-right">Секс</TableHead>
												<TableHead className="text-right">Победи</TableHead>
												<TableHead className="text-right">Опит</TableHead>
												<TableHead className="text-right">Нова атака</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{sortedRankings.map((player, index) => (
												<TableRow key={player.id}>
													<TableCell>{index + 1}</TableCell>
													<TableCell className="font-medium">
														{player.name}
													</TableCell>
													<TableCell className="text-right">
														{player.strength.toLocaleString()}
													</TableCell>
													<TableCell className="text-right">
														{player.intelligence.toLocaleString()}
													</TableCell>
													<TableCell className="text-right">
														{player.sex.toLocaleString()}
													</TableCell>
													<TableCell className="text-right">
														{player.victories.toLocaleString()}
													</TableCell>
													<TableCell className="text-right">
														{player.experience.toLocaleString()}
													</TableCell>
													<TableCell className="text-right font-semibold">
														{player.total_score.toLocaleString()}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
