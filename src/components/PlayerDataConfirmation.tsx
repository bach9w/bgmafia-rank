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
	const [error, setError] = useState<string | null>(null);

	// Рестартираме стейта при промяна на входните данни
	useEffect(() => {
		setEditedPlayers(players);
		console.log("Получени играчи в модала:", players);
	}, [players]);

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

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						Потвърждение на данните за {getStatTypeLabel(statType)} -{" "}
						{formatDateForDisplay(selectedDate)}
					</DialogTitle>
				</DialogHeader>

				{editedPlayers.length === 0 ? (
					<div className="py-6 text-center text-gray-500">
						Не са открити данни за играчи
					</div>
				) : (
					<div className="py-4">
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
									<TableRow key={index}>
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
