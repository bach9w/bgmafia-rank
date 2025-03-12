"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Player } from "@/types/Player";
import { LoaderCircle } from "lucide-react";
import PlayerDataConfirmation from "./PlayerDataConfirmation";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

// Тип на показателя
export type StatType =
	| "strength"
	| "intelligence"
	| "sex"
	| "victories"
	| "experience";

// Режими на запис - изнесени в API логиката
export type SaveMode = "add" | "overwrite";

export default function RankingsUploader() {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [extractedPlayers, setExtractedPlayers] = useState<Player[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
	const [selectedStat, setSelectedStat] = useState<StatType>("strength");
	const [selectedDate, setSelectedDate] = useState<string>(
		new Date().toISOString().split("T")[0],
	); // Формат: YYYY-MM-DD

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setSelectedFile(file);
			setError(null);
		}
	};

	const handleStatChange = (value: string) => {
		setSelectedStat(value as StatType);
	};

	const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSelectedDate(event.target.value);
	};

	const handleUpload = async () => {
		if (!selectedFile) {
			setError("Моля, изберете файл с класацията");
			return;
		}

		try {
			setIsUploading(true);
			setError(null);

			// Създаваме FormData за качване на файла
			const formData = new FormData();
			formData.append("file", selectedFile);
			formData.append("statType", selectedStat);

			// Изпращаме файла към нашия API endpoint
			const response = await fetch("/api/rankings/extract", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				let errorMessage = "Грешка при обработка на изображението";
				try {
					const errorData = await response.json();
					errorMessage = errorData.message || errorMessage;
				} catch (error) {
					// Ако отговорът не е валиден JSON, използваме текстовия отговор или стандартното съобщение
					console.error("Грешка при парсиране на JSON отговор:", error);
					try {
						const errorText = await response.text();
						errorMessage = errorText || errorMessage;
					} catch (textError) {
						console.error(
							"Не можа да се прочете отговора като текст:",
							textError,
						);
					}
				}
				throw new Error(errorMessage);
			}

			let data;
			try {
				data = await response.json();
			} catch (error) {
				console.error("Грешка при парсиране на JSON:", error);
				throw new Error("Получени са невалидни данни от сървъра");
			}

			setExtractedPlayers(data.players || []);

			// Отваряме модалния прозорец за потвърждение
			setIsConfirmationOpen(true);
		} catch (err) {
			console.error("Грешка при качване:", err);
			setError(
				err instanceof Error ? err.message : "Възникна грешка при качването",
			);
		} finally {
			setIsUploading(false);
		}
	};

	const handleConfirm = async (confirmedPlayers: Player[]) => {
		try {
			setIsProcessing(true);

			// Запазваме потвърдените данни в базата данни
			const response = await fetch("/api/rankings/save", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					players: confirmedPlayers,
					statType: selectedStat,
					date: selectedDate,
				}),
			});

			if (!response.ok) {
				let errorMessage = "Грешка при запазване на данните";
				try {
					const errorData = await response.json();
					errorMessage = errorData.message || errorMessage;
				} catch (error) {
					// Ако отговорът не е валиден JSON, използваме текстовия отговор или стандартното съобщение
					console.error("Грешка при парсиране на JSON отговор:", error);
					try {
						const errorText = await response.text();
						errorMessage = errorText || errorMessage;
					} catch (textError) {
						console.error(
							"Не можа да се прочете отговора като текст:",
							textError,
						);
					}
				}
				throw new Error(errorMessage);
			}

			// След успешно запазване, нулираме състоянието
			setSelectedFile(null);
			setExtractedPlayers([]);
			setIsConfirmationOpen(false);

			// Тук можем да добавим допълнителна логика за показване на съобщение за успех
		} catch (err) {
			console.error("Грешка при запазване:", err);
			setError(
				err instanceof Error ? err.message : "Възникна грешка при запазването",
			);
			throw err; // Препрехвърляме грешката, за да я хване модалният прозорец
		} finally {
			setIsProcessing(false);
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
		<>
			<Card className="w-full max-w-2xl mx-auto">
				<CardHeader>
					<CardTitle>Качване на класация</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-2">
							<label htmlFor="stat-type" className="text-sm font-medium">
								Изберете тип показател
							</label>
							<Select value={selectedStat} onValueChange={handleStatChange}>
								<SelectTrigger id="stat-type" className="w-full">
									<SelectValue placeholder="Изберете показател" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="strength">Сила</SelectItem>
									<SelectItem value="intelligence">Интелект</SelectItem>
									<SelectItem value="sex">Секс</SelectItem>
									<SelectItem value="victories">Победи</SelectItem>
									<SelectItem value="experience">Опит</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<label htmlFor="ranking-date" className="text-sm font-medium">
								Дата на класацията
							</label>
							<div className="flex flex-col gap-1">
								<Input
									id="ranking-date"
									type="date"
									value={selectedDate}
									onChange={handleDateChange}
									min="2000-01-01"
									className="w-full"
								/>
								<p className="text-sm text-gray-500">
									Избрана дата: {formatDateForDisplay(selectedDate)}
								</p>
							</div>
						</div>

						<div className="flex flex-col gap-2">
							<label htmlFor="file-upload" className="text-sm font-medium">
								Изберете изображение с класацията
							</label>
							<Input
								id="file-upload"
								type="file"
								accept="image/*"
								onChange={handleFileChange}
								disabled={isUploading || isProcessing}
							/>
							{selectedFile && (
								<p className="text-sm text-gray-500">
									Избран файл: {selectedFile.name}
								</p>
							)}
						</div>

						{error && <p className="text-sm text-red-500">{error}</p>}

						<Button
							onClick={handleUpload}
							disabled={!selectedFile || isUploading || isProcessing}
							className="w-full"
						>
							{isUploading ? (
								<>
									<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
									Качване...
								</>
							) : (
								`Качи и анализирай (${getStatTypeLabel(selectedStat)})`
							)}
						</Button>
					</div>
				</CardContent>
			</Card>

			<PlayerDataConfirmation
				isOpen={isConfirmationOpen}
				onClose={() => setIsConfirmationOpen(false)}
				players={extractedPlayers}
				onConfirm={handleConfirm}
				statType={selectedStat}
				selectedDate={selectedDate}
			/>
		</>
	);
}
