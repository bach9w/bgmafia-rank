"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	ArrowLeft,
	Calendar,
	Edit,
	Loader2,
	Save,
	Sword,
	Brain,
	Heart,
	Trophy,
	Star,
	ChevronUp,
	ChevronDown,
} from "lucide-react";
import { PlayerDetails } from "@/types/PlayerDetails";

export default function PlayerPage() {
	const params = useParams();
	const [playerData, setPlayerData] = useState<PlayerDetails | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [newName, setNewName] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

	useEffect(() => {
		const fetchPlayerData = async () => {
			setIsLoading(true);
			setError(null);

			try {
				const response = await fetch(`/api/players/${params.id}`);

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(
						errorData.message || "Грешка при зареждане на данните",
					);
				}

				const data = await response.json();

				// Форматираме данните в правилния формат
				const playerDetails: PlayerDetails = {
					id: data.player.id,
					name: data.player.name,
					profile_id: data.player.profile_id,
					stats: data.stats,
					totalStats: data.totalStats,
					recentActivity: data.recentActivity,
				};

				setPlayerData(playerDetails);
				setNewName(playerDetails.name);
			} catch (err) {
				console.error("Грешка при зареждане на данните за играча:", err);
				setError(
					err instanceof Error
						? err.message
						: "Възникна грешка при зареждане на данните",
				);
				toast.error("Грешка при зареждане", {
					description:
						err instanceof Error
							? err.message
							: "Не можахме да заредим данните за играча",
				});
			} finally {
				setIsLoading(false);
			}
		};

		if (params.id) {
			fetchPlayerData();
		}
	}, [params.id]);

	const handleSaveName = async () => {
		if (!playerData || newName === playerData.name) return;

		setIsSaving(true);

		try {
			const response = await fetch(`/api/players/${playerData.id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ name: newName }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || "Грешка при обновяване на името");
			}

			// Обновяваме локалните данни
			setPlayerData((prev) => (prev ? { ...prev, name: newName } : null));
			setIsEditing(false);

			toast.success("Името е обновено", {
				description: `Името на играча беше променено на ${newName}`,
			});
		} catch (err) {
			console.error("Грешка при обновяване на името:", err);
			toast.error("Грешка при обновяване", {
				description:
					err instanceof Error
						? err.message
						: "Не можахме да обновим името на играча",
			});
		} finally {
			setIsSaving(false);
		}
	};

	const toggleRow = (id: string) => {
		setExpandedRows((prev) => ({
			...prev,
			[id]: !prev[id],
		}));
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="h-12 w-12 text-primary animate-spin" />
					<p className="text-lg">Зареждане на данните...</p>
				</div>
			</div>
		);
	}

	if (error || !playerData) {
		return (
			<div className="container py-8">
				<div className="flex flex-col items-center gap-4 text-center max-w-md mx-auto">
					<h1 className="text-2xl font-bold text-destructive">Грешка</h1>
					<p>{error || "Не можахме да намерим този играч"}</p>
					<Button asChild>
						<Link href="/">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Назад към началната страница
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="container py-8 max-w-6xl mx-auto px-4">
			<div className="flex flex-col space-y-8">
				{/* Заглавна част с име на играча */}
				<div className="flex justify-center items-center">
					<Button variant="outline" asChild className="mb-4">
						<Link href="/">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Назад
						</Link>
					</Button>
				</div>

				<Card className="mx-auto w-full">
					<CardHeader className="pb-3">
						<div className="flex flex-col sm:flex-row justify-between items-center gap-4">
							{isEditing ? (
								<div className="flex items-center gap-2 w-full">
									<Input
										value={newName}
										onChange={(e) => setNewName(e.target.value)}
										className="max-w-sm"
										placeholder="Име на играча"
									/>
									<Button
										onClick={handleSaveName}
										disabled={isSaving || !newName.trim()}
										size="sm"
									>
										{isSaving ? (
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										) : (
											<Save className="h-4 w-4 mr-2" />
										)}
										Запази
									</Button>
									<Button
										onClick={() => {
											setIsEditing(false);
											setNewName(playerData.name);
										}}
										variant="outline"
										size="sm"
									>
										Отказ
									</Button>
								</div>
							) : (
								<>
									<div className="text-center sm:text-left">
										<CardTitle className="text-2xl sm:text-3xl">
											{playerData.name}
										</CardTitle>
										<CardDescription>
											Данни от {playerData.stats.length} дни
										</CardDescription>
									</div>
									<Button
										onClick={() => setIsEditing(true)}
										variant="outline"
										size="sm"
									>
										<Edit className="h-4 w-4 mr-2" />
										Промени името
									</Button>
								</>
							)}
						</div>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-8">
							<Card className="bg-muted/50">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm flex items-center justify-center sm:justify-start">
										<Sword className="h-4 w-4 mr-2 text-[var(--color-strength)]" />
										Сила
									</CardTitle>
								</CardHeader>
								<CardContent className="text-center sm:text-left">
									<div className="text-xl sm:text-2xl font-bold">
										{playerData.totalStats.strength.toLocaleString()}
									</div>
								</CardContent>
							</Card>

							<Card className="bg-muted/50">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm flex items-center justify-center sm:justify-start">
										<Brain className="h-4 w-4 mr-2 text-[var(--color-intelligence)]" />
										Интелект
									</CardTitle>
								</CardHeader>
								<CardContent className="text-center sm:text-left">
									<div className="text-xl sm:text-2xl font-bold">
										{playerData.totalStats.intelligence.toLocaleString()}
									</div>
								</CardContent>
							</Card>

							<Card className="bg-muted/50">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm flex items-center justify-center sm:justify-start">
										<Heart className="h-4 w-4 mr-2 text-[var(--color-sex)]" />
										Секс
									</CardTitle>
								</CardHeader>
								<CardContent className="text-center sm:text-left">
									<div className="text-xl sm:text-2xl font-bold">
										{playerData.totalStats.sex.toLocaleString()}
									</div>
								</CardContent>
							</Card>

							<Card className="bg-muted/50">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm flex items-center justify-center sm:justify-start">
										<Trophy className="h-4 w-4 mr-2 text-[var(--color-victories)]" />
										Победи
									</CardTitle>
								</CardHeader>
								<CardContent className="text-center sm:text-left">
									<div className="text-xl sm:text-2xl font-bold">
										{playerData.totalStats.victories.toLocaleString()}
									</div>
								</CardContent>
							</Card>

							<Card className="bg-muted/50">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm flex items-center justify-center sm:justify-start">
										<Star className="h-4 w-4 mr-2 text-[var(--color-experience)]" />
										Опит
									</CardTitle>
								</CardHeader>
								<CardContent className="text-center sm:text-left">
									<div className="text-xl sm:text-2xl font-bold">
										{playerData.totalStats.experience.toLocaleString()}
									</div>
								</CardContent>
							</Card>
							<Card className="bg-muted/50">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm flex items-center justify-center sm:justify-start">
										<Star className="h-4 w-4 mr-2 text-[var(--color-experience)]" />
										КАРТА НОМЕР
									</CardTitle>
								</CardHeader>
								<CardContent className="text-center sm:text-left">
									<div className="text-xl sm:text-2xl font-bold">
										{playerData.profile_id}
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Таблица с всички статистики по дни */}
						<div className="mt-8">
							<h3 className="text-lg font-semibold mb-4 text-center">
								История на показателите
							</h3>

							{/* Мобилен и таблетен изглед */}
							<div className="md:block">
								<div className="bg-muted/50 px-4 py-3 border-b border-gray-300 grid grid-cols-12 gap-2">
									<div className="col-span-5 text-xs font-medium text-gray-500 uppercase">
										Дата
									</div>
									<div className="col-span-7 text-xs font-medium text-gray-500 uppercase text-right">
										Общ прогрес
									</div>
								</div>
								{playerData.stats.map((stat) => (
									<div key={stat.id} className="border-b border-border">
										<div
											className={`px-4 py-3 grid grid-cols-12 gap-2 items-center cursor-pointer hover:bg-muted/20`}
											onClick={() => toggleRow(stat.id)}
										>
											<div className="col-span-5 text-sm flex items-center">
												<Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
												{new Intl.DateTimeFormat("bg-BG").format(
													new Date(stat.date),
												)}
											</div>
											<div className="col-span-6 text-sm text-right">
												{(
													(stat.strength || 0) +
													(stat.intelligence || 0) +
													(stat.sex || 0)
												).toLocaleString()}
											</div>
											<div className="col-span-1 flex justify-end">
												{expandedRows[stat.id] ? (
													<ChevronUp size={16} />
												) : (
													<ChevronDown size={16} />
												)}
											</div>
										</div>

										{expandedRows[stat.id] && (
											<div className="bg-muted/10 px-4 py-3 grid grid-cols-2 gap-4 text-sm">
												<div className="col-span-1">
													<p className="font-medium text-muted-foreground">
														Сила:
													</p>
													<p>{stat.strength?.toLocaleString() || "0"}</p>
												</div>
												<div className="col-span-1">
													<p className="font-medium text-muted-foreground">
														Интелект:
													</p>
													<p>{stat.intelligence?.toLocaleString() || "0"}</p>
												</div>
												<div className="col-span-1">
													<p className="font-medium text-muted-foreground">
														Секс:
													</p>
													<p>{stat.sex?.toLocaleString() || "0"}</p>
												</div>
												<div className="col-span-1">
													<p className="font-medium text-muted-foreground">
														Победи:
													</p>
													<p>{stat.victories?.toLocaleString() || "0"}</p>
												</div>
												<div className="col-span-1">
													<p className="font-medium text-muted-foreground">
														Опит:
													</p>
													<p>{stat.experience?.toLocaleString() || "0"}</p>
												</div>
												<div className="col-span-1">
													<p className="font-medium text-muted-foreground">
														Вид на деня:
													</p>
													<p>{stat.day_type || "-"}</p>
												</div>
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
