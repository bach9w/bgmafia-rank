"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Player } from "@/types/Player";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { LoaderCircle, ExternalLink } from "lucide-react";
import { StatType } from "./RankingsUploader";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface PlayerDataConfirmationProps {
	isOpen: boolean;
	onClose: () => void;
	players: Player[];
	onConfirm: (players: Player[]) => Promise<void>;
	statType: StatType;
	selectedDate?: string;
	isWeekly?: boolean;
	weekEndDate?: string;
}

export default function PlayerDataConfirmation({
	isOpen,
	onClose,
	players,
	onConfirm,
	statType,
	selectedDate = new Date().toISOString().split("T")[0],
	isWeekly = false,
	weekEndDate,
}: PlayerDataConfirmationProps) {
	const [editedPlayers, setEditedPlayers] = useState<Player[]>([]);
	const [isSaving, setIsSaving] = useState(false);
	const [isCheckingPlayers, setIsCheckingPlayers] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Рестартираме стейта при промяна на входните данни
	useEffect(() => {
		setEditedPlayers(players);
		console.log("Получени играчи в модала:", players);
	}, [players]);

	// Проверка дали играчите съществуват в базата данни - оптимизирана версия
	useEffect(() => {
		const checkPlayersExistence = async () => {
			if (!editedPlayers.length || !isOpen) return;

			try {
				setIsCheckingPlayers(true);

				// Извличаме имената на играчите
				const playerNames = editedPlayers.map((player) => player.name);

				// Проверка дали вече имаме информацията за съществуването
				// Ако някой от играчите вече има exists свойство, пропускаме проверката
				if (editedPlayers.some((player) => player.exists !== undefined)) {
					console.log(
						"Пропускане на повторна проверка - играчите вече са проверени",
					);
					setIsCheckingPlayers(false);
					return;
				}

				console.log(`Проверка на ${playerNames.length} играчи`);

				// Правим заявка към API
				const response = await fetch("/api/players/check", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ playerNames }),
				});

				if (!response.ok) {
					throw new Error("Грешка при проверка на играчите");
				}

				const data = await response.json();

				// Обновяваме списъка с играчи с информация дали съществуват
				const updatedPlayers = editedPlayers.map((player) => {
					const matchedPlayer = data.players.find(
						(p: { name: string; exists: boolean }) =>
							p.name.toLowerCase() === player.name.toLowerCase(),
					);

					return {
						...player,
						exists: matchedPlayer ? matchedPlayer.exists : false,
					};
				});

				setEditedPlayers(updatedPlayers);

				// Показваме съобщение за броя съществуващи играчи
				const existingCount = updatedPlayers.filter((p) => p.exists).length;
				const newCount = updatedPlayers.length - existingCount;

				toast.info(`Проверка на играчите`, {
					description: `${existingCount} съществуващи играчи, ${newCount} нови играчи`,
					duration: 5000,
				});
			} catch (err) {
				console.error("Грешка при проверка на играчите:", err);
				toast.error("Грешка при проверка", {
					description: "Не можахме да проверим дали играчите съществуват",
				});
			} finally {
				setIsCheckingPlayers(false);
			}
		};

		checkPlayersExistence();
	}, [isOpen, players]); // Премахваме editedPlayers от зависимостите, за да избегнем цикличност

	const handlePlayerChange = (
		index: number,
		field: keyof Player,
		value: string | number,
	) => {
		const updatedPlayers = [...editedPlayers];
		updatedPlayers[index] = {
			...updatedPlayers[index],
			[field]: value,
		};
		setEditedPlayers(updatedPlayers);
	};

	const handleConfirm = async () => {
		try {
			setIsSaving(true);
			setError(null);
			await onConfirm(editedPlayers);
			onClose();
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Възникна грешка при запазването на данните",
			);
		} finally {
			setIsSaving(false);
		}
	};

	// Функция за превод на типа на показателя
	const getStatTypeLabel = (type: StatType): string => {
		const labels: Record<StatType, string> = {
			strength: "Сила",
			intelligence: "Интелект",
			sex: "Секс",
			victories: "Победи",
			experience: "Опит",
		};
		return labels[type];
	};

	// Функция за форматиране на дата за показване
	const formatDateForDisplay = (dateStr: string): string => {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat("bg-BG", {
			day: "numeric",
			month: "long",
			year: "numeric",
		}).format(date);
	};

	// Функция за определяне на класа на рамката в зависимост от съществуването на играча
	const getBorderClass = (player: Player): string => {
		if (player.exists === undefined) return "";
		return player.exists
			? "border-green-500 border-2"
			: "border-red-500 border-2";
	};

	// Функция за изтриване на играч от списъка
	const handleDeletePlayer = (index: number) => {
		const updatedPlayers = [...editedPlayers];
		updatedPlayers.splice(index, 1);
		setEditedPlayers(updatedPlayers);
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isWeekly ? (
							<>
								Потвърждение на данните за седмична класация -{" "}
								{getStatTypeLabel(statType)} -{" "}
								{formatDateForDisplay(selectedDate)} до{" "}
								{formatDateForDisplay(weekEndDate || selectedDate)}
							</>
						) : (
							<>
								Потвърждение на данните за {getStatTypeLabel(statType)} -{" "}
								{formatDateForDisplay(selectedDate)}
							</>
						)}
					</DialogTitle>
				</DialogHeader>

				{isCheckingPlayers && (
					<div className="flex items-center justify-center py-4 text-blue-600">
						<LoaderCircle className="animate-spin mr-2" />
						<span>Проверка на играчите...</span>
					</div>
				)}

				{editedPlayers.length === 0 ? (
					<div className="py-6 text-center text-gray-500">
						Не са открити данни за играчи
					</div>
				) : (
					<div className="py-4">
						<div className="mb-4 text-sm flex items-center gap-4">
							<div className="flex items-center">
								<div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
								<span>Съществуващ играч</span>
							</div>
							<div className="flex items-center">
								<div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
								<span>Нов играч</span>
							</div>

							<div className="flex items-center ml-auto">
								<div className="text-sm text-gray-500">
									{editedPlayers.length} играчи общо
								</div>
							</div>
						</div>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-12">№</TableHead>
									<TableHead className="w-16">Ранг</TableHead>
									<TableHead>Име</TableHead>
									<TableHead className="w-20">ID</TableHead>
									<TableHead>{getStatTypeLabel(statType)}</TableHead>
									<TableHead className="w-20">Действия</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{editedPlayers.map((player, index) => (
									<TableRow key={index} className={getBorderClass(player)}>
										<TableCell>{index + 1}</TableCell>
										<TableCell>{player.rank || "-"}</TableCell>
										<TableCell>
											<Input
												value={player.name}
												onChange={(e) =>
													handlePlayerChange(index, "name", e.target.value)
												}
												className="w-full"
											/>
										</TableCell>
										<TableCell>
											{player.profileId ? (
												<div className="flex items-center gap-1">
													<Badge variant="outline" className="text-xs">
														{player.profileId}
													</Badge>
													{player.profileUrl && (
														<a
															href={`https://bgmafia.com${player.profileUrl}`}
															target="_blank"
															rel="noopener noreferrer"
															className="text-blue-600 hover:text-blue-800"
														>
															<ExternalLink className="h-3 w-3" />
														</a>
													)}
												</div>
											) : (
												<span className="text-gray-400">няма ID</span>
											)}
										</TableCell>
										<TableCell>
											<Input
												type="number"
												value={(player[statType] as number) || 0}
												onChange={(e) =>
													handlePlayerChange(
														index,
														statType,
														parseInt(e.target.value) || 0,
													)
												}
												className="w-full"
											/>
										</TableCell>
										<TableCell>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleDeletePlayer(index)}
												className="hover:bg-red-100 hover:text-red-600 p-1 h-7"
											>
												Изтрий
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}

				{error && <p className="text-sm text-red-500 mt-2">{error}</p>}

				<DialogFooter className="mt-4">
					<Button variant="outline" onClick={onClose} disabled={isSaving}>
						Отказ
					</Button>
					<Button
						onClick={handleConfirm}
						disabled={isSaving || editedPlayers.length === 0}
					>
						{isSaving ? (
							<>
								<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
								Запазване...
							</>
						) : (
							"Запази данните"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
