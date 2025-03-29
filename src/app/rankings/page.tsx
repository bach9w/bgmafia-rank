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

export default function RankingsPage() {
	const [rankings, setRankings] = useState<PlayerRanking[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [dates, setDates] = useState<string[]>([]);
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [sortBy, setSortBy] = useState<StatType | "total_score">("total_score");
	const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

	const toggleRow = (playerId: string) => {
		setExpandedRows((prev) => ({
			...prev,
			[playerId]: !prev[playerId],
		}));
	};

	// Зареждане на наличните дати
	useEffect(() => {
		const fetchDates = async () => {
			try {
				const { data, error } = await supabase
					.from("daily_stats")
					.select("date")
					.order("date", { ascending: false })
					.limit(100);

				if (error) {
					throw error;
				}

				if (data) {
					// Извличаме уникалните дати
					const uniqueDates = Array.from(
						new Set(data.map((item) => item.date)),
					);
					setDates(uniqueDates);

					// Избираме най-новата дата като начална
					if (uniqueDates.length > 0 && !selectedDate) {
						setSelectedDate(uniqueDates[0]);
					}
				}
			} catch (err) {
				console.error("Грешка при зареждане на дати:", err);
				setError("Грешка при зареждане на наличните дати");
			}
		};

		fetchDates();
	}, [selectedDate]);

	// Зареждане на класацията за избраната дата
	useEffect(() => {
		const fetchRankings = async () => {
			if (!selectedDate) return;

			setIsLoading(true);
			setError(null);

			try {
				// Използваме по-прост подход, който е по-надежден
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

				console.log("Получени данни:", data);

				if (data && data.length > 0) {
					// Трансформираме данните в необходимия формат
					const formattedData: PlayerRanking[] = [];

					for (const item of data) {
						if (!item.players) {
							console.warn("Липсват данни за играч:", item);
							continue;
						}

						// Изчисляваме общия брой точки
						const totalScore =
							Number(item.strength || 0) +
							Number(item.intelligence || 0) +
							Number(item.sex || 0) +
							Number(item.victories || 0) +
							Number(item.experience || 0);

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

					setRankings(formattedData);
				} else {
					setRankings([]);
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

	// Форматиране на дата за показване
	const formatDateForDisplay = (dateStr: string): string => {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat("bg-BG", {
			day: "numeric",
			month: "long",
			year: "numeric",
		}).format(date);
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
						sortedRankings.length > 0 &&
						sortedRankings[0].day_type && (
							<div className="text-sm font-medium text-amber-600 mt-2">
								Вид на деня: {sortedRankings[0].day_type}
							</div>
						)}
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-6">
						{/* Филтри */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="flex flex-col gap-2">
								<label htmlFor="date-filter" className="text-sm font-medium">
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
										<SelectItem value="total_score">Общ резултат</SelectItem>
										<SelectItem value="strength">Сила</SelectItem>
										<SelectItem value="intelligence">Интелект</SelectItem>
										<SelectItem value="sex">Секс</SelectItem>
										<SelectItem value="victories">Победи</SelectItem>
										<SelectItem value="experience">Опит</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Класация */}
						{isLoading ? (
							<div className="flex justify-center items-center py-12">
								<LoaderCircle className="h-8 w-8 animate-spin text-primary" />
							</div>
						) : error ? (
							<div className="py-8 text-center text-red-500">{error}</div>
						) : sortedRankings.length === 0 ? (
							<div className="py-8 text-center text-gray-500">
								Няма данни за класацията на избраната дата
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
											Общо
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
												<TableHead className="text-right">Общо точки</TableHead>
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
