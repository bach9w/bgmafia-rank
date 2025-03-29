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
import { LoaderCircle } from "lucide-react";
import { StatType } from "./RankingsUploader";
import { toast } from "sonner";

interface PlayerDataConfirmationProps {
	isOpen: boolean;
	onClose: () => void;
	players: Player[];
	onConfirm: (players: Player[]) => Promise<void>;
	statType: StatType;
	selectedDate?: string;
}

export default function PlayerDataConfirmation({
	isOpen,
	onClose,
	players,
	onConfirm,
	statType,
	selectedDate = new Date().toISOString().split("T")[0],
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

	// Проверка дали играчите съществуват в базата данни
	useEffect(() => {
		const checkPlayersExistence = async () => {
			if (!editedPlayers.length || !isOpen) return;

			try {
				setIsCheckingPlayers(true);

				// Извличаме имената на играчите
				const playerNames = editedPlayers.map((player) => player.name);

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
	}, [editedPlayers.length, isOpen]);

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

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						Потвърждение на данните за {getStatTypeLabel(statType)} -{" "}
						{formatDateForDisplay(selectedDate)}
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
						</div>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>№</TableHead>
									<TableHead>Име</TableHead>
									<TableHead>{getStatTypeLabel(statType)}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{editedPlayers.map((player, index) => (
									<TableRow key={index} className={getBorderClass(player)}>
										<TableCell>{index + 1}</TableCell>
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
