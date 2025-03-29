"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Player } from "@/types/Player";
import {
	LoaderCircle,
	AlertTriangle,
	InfoIcon,
	CheckCircle,
} from "lucide-react";
import PlayerDataConfirmation from "./PlayerDataConfirmation";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Тип на показателя
export type StatType =
	| "strength"
	| "intelligence"
	| "sex"
	| "victories"
	| "experience";

// Режими на запис - изнесени в API логиката
export type SaveMode = "add" | "overwrite";

// Опции за вид на деня
const dayTypeOptions = [
	"Нормален ден",
	"Ден на опита",
	"Ден на интелекта",
	"Ден на силата",
	"Ден на контрабандата",
	"Ден на фабриканта",
	"Ден на сексапила",
	"Ден на побой",
];

// Интерфейс за данни от проверката на датата
interface DateCheckResult {
	date: string;
	hasData: boolean;
	playersCount: number;
	day_type: string | null;
	stats: {
		strength: boolean;
		intelligence: boolean;
		sex: boolean;
		victories: boolean;
		experience: boolean;
	};
}

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
	const [selectedDayType, setSelectedDayType] = useState<string | null>(null);
	const [isCheckingDate, setIsCheckingDate] = useState(false);
	const [dateInfo, setDateInfo] = useState<DateCheckResult | null>(null);

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

	const handleDayTypeChange = (value: string) => {
		setSelectedDayType(value);
	};

	// Проверка на датата
	useEffect(() => {
		const checkDate = async () => {
			if (!selectedDate) return;

			try {
				setIsCheckingDate(true);

				const response = await fetch("/api/daily-stats/check-date", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ date: selectedDate }),
				});

				if (!response.ok) {
					throw new Error("Грешка при проверка на датата");
				}

				const data = await response.json();
				setDateInfo(data);

				// Ако има зададен вид на деня, автоматично го попълваме
				if (data.day_type && !selectedDayType) {
					setSelectedDayType(data.day_type);
					toast.info("Вид на деня", {
						description: `Автоматично попълнен вид на деня: ${data.day_type}`,
					});
				}
			} catch (err) {
				console.error("Грешка при проверка на датата:", err);
				setDateInfo(null);
			} finally {
				setIsCheckingDate(false);
			}
		};

		checkDate();
	}, [selectedDate]);

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
					day_type: selectedDayType || undefined, // Добавяме вида на деня
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

			// Показваме toast съобщение за успех
			toast.success("Класацията беше успешно качена!", {
				description: `Данните за ${
					confirmedPlayers.length
				} играчи бяха записани за дата ${formatDateForDisplay(selectedDate)}`,
			});

			// Опресняваме информацията за датата
			await checkDateInfo();
		} catch (err) {
			console.error("Грешка при запазване:", err);
			setError(
				err instanceof Error ? err.message : "Възникна грешка при запазването",
			);

			// Показваме toast съобщение за грешка
			toast.error("Грешка при качване на класацията", {
				description:
					err instanceof Error ? err.message : "Възникна неочаквана грешка",
			});

			throw err; // Препрехвърляме грешката, за да я хване модалният прозорец
		} finally {
			setIsProcessing(false);
		}
	};

	// Функция за проверка на информацията за датата
	const checkDateInfo = async () => {
		if (!selectedDate) return;

		try {
			setIsCheckingDate(true);

			const response = await fetch("/api/daily-stats/check-date", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ date: selectedDate }),
			});

			if (!response.ok) {
				throw new Error("Грешка при проверка на датата");
			}

			const data = await response.json();
			setDateInfo(data);
		} catch (err) {
			console.error("Грешка при опресняване на информацията за датата:", err);
		} finally {
			setIsCheckingDate(false);
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

	// Проверяваме дали избраният тип статистика вече съществува за тази дата
	const isStatAlreadyExists = () => {
		if (!dateInfo || !dateInfo.hasData) return false;
		return dateInfo.stats[selectedStat];
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
							{isStatAlreadyExists() && (
								<div className="flex items-center p-2 mt-1 bg-amber-50 text-amber-800 rounded-md text-sm">
									<AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
									<span>
										Внимание: Вече има данни за {getStatTypeLabel(selectedStat)}{" "}
										на тази дата!
									</span>
								</div>
							)}
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

							{isCheckingDate && (
								<div className="flex items-center p-2 bg-gray-50 text-gray-600 rounded-md text-sm">
									<LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
									<span>Проверка на данните за тази дата...</span>
								</div>
							)}

							{dateInfo && dateInfo.hasData && (
								<div className="flex items-center p-2 bg-blue-50 text-blue-800 rounded-md text-sm">
									<InfoIcon className="h-4 w-4 mr-2 flex-shrink-0" />
									<div>
										<p>
											За тази дата вече има {dateInfo.playersCount} играчи с
											данни.
										</p>
										<p className="mt-1">
											Показатели:{" "}
											{dateInfo.stats.strength && (
												<span className="inline-block px-1 mr-1 bg-gray-200 rounded">
													Сила
												</span>
											)}
											{dateInfo.stats.intelligence && (
												<span className="inline-block px-1 mr-1 bg-gray-200 rounded">
													Интелект
												</span>
											)}
											{dateInfo.stats.sex && (
												<span className="inline-block px-1 mr-1 bg-gray-200 rounded">
													Секс
												</span>
											)}
											{dateInfo.stats.victories && (
												<span className="inline-block px-1 mr-1 bg-gray-200 rounded">
													Победи
												</span>
											)}
											{dateInfo.stats.experience && (
												<span className="inline-block px-1 mr-1 bg-gray-200 rounded">
													Опит
												</span>
											)}
										</p>
									</div>
								</div>
							)}
						</div>

						<div className="flex flex-col gap-2">
							<label htmlFor="day-type" className="text-sm font-medium">
								Вид на деня (незадължително)
							</label>
							<Select
								value={selectedDayType || undefined}
								onValueChange={handleDayTypeChange}
							>
								<SelectTrigger id="day-type" className="w-full">
									<SelectValue placeholder="Изберете вид на деня" />
								</SelectTrigger>
								<SelectContent>
									{dayTypeOptions.map((option) => (
										<SelectItem key={option} value={option}>
											{option}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							{dateInfo && dateInfo.day_type && (
								<div
									className={`flex items-center p-2 mt-1 rounded-md text-sm ${
										selectedDayType === dateInfo.day_type
											? "bg-green-50 text-green-800"
											: "bg-amber-50 text-amber-800"
									}`}
								>
									{selectedDayType === dateInfo.day_type ? (
										<>
											<CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
											<span>
												Съвпада със зададения вид на деня: {dateInfo.day_type}
											</span>
										</>
									) : (
										<>
											<AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
											<span>
												Внимание: За тази дата вече е зададен вид:{" "}
												{dateInfo.day_type}
											</span>
										</>
									)}
								</div>
							)}
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
								className="w-full"
							/>
						</div>

						{error && (
							<div className="text-red-600 text-sm p-2 bg-red-50 rounded">
								{error}
							</div>
						)}

						<Button
							onClick={handleUpload}
							disabled={isUploading || !selectedFile || isProcessing}
							className="w-full"
						>
							{isUploading ? (
								<>
									<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
									Обработка...
								</>
							) : (
								"Обработи класацията"
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
