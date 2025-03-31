"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Player } from "@/types/Player";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { StatType } from "./RankingsUploader";

interface HtmlTableImporterProps {
	onImport: (players: Player[]) => void;
	statType: StatType;
}

export default function HtmlTableImporter({
	onImport,
	statType,
}: HtmlTableImporterProps) {
	const [htmlInput, setHtmlInput] = useState<string>("");
	const [isProcessing, setIsProcessing] = useState(false);

	// Функция за извличане на данни от HTML таблицата
	const extractPlayersFromHtml = () => {
		setIsProcessing(true);

		try {
			// Създаваме временен DOM елемент, в който да парсираме HTML кода
			const parser = new DOMParser();
			const doc = parser.parseFromString(htmlInput, "text/html");

			// Намираме всички редове в таблицата (без заглавния ред)
			const rows = doc.querySelectorAll("tr");

			if (!rows || rows.length <= 1) {
				toast.error("Невалидна таблица", {
					description:
						"Не можахме да открием данни в таблицата. Моля, копирайте цялата HTML таблица.",
				});
				setIsProcessing(false);
				return;
			}

			const players: Player[] = [];

			// Обхождаме всички редове (прескачаме първия, който е заглавен)
			for (let i = 1; i < rows.length; i++) {
				const row = rows[i];
				const cells = row.querySelectorAll("td");

				if (cells.length >= 3) {
					// Първа клетка: Ранг (# номер)
					const rankText = cells[0].textContent?.trim() || "";
					const rank = parseInt(rankText.replace(".", ""));

					// Втора клетка: Име на играча и URL към профила
					const playerNameElement = cells[1].querySelector("a");
					const playerName = playerNameElement?.textContent?.trim() || "";
					const profileUrl = playerNameElement?.getAttribute("href") || "";
					const profileId = extractProfileIdFromUrl(profileUrl);

					// Трета клетка: Стойност на показателя
					const statValueText =
						cells[2].textContent?.trim().replace(/\s+/g, "") || "0";
					const statValue = parseInt(statValueText);

					// Четвърта клетка: Банда (опционално)
					const gangName =
						cells.length > 3 ? cells[3].textContent?.trim() || "" : "";

					if (playerName && !isNaN(rank) && !isNaN(statValue)) {
						const player: Player = {
							name: playerName,
							strength: 0, // Задаваме стойност само на съответния показател
							gang: gangName !== "-" ? gangName : "",
							rank: rank,
							profileUrl: profileUrl, // Добавяме URL към профила
							profileId: profileId, // Добавяме ID на профила
						};

						// Задаваме стойност на избрания показател
						player[statType] = statValue;

						players.push(player);
					}
				}
			}

			if (players.length === 0) {
				toast.error("Не са открити играчи", {
					description: "Не успяхме да извлечем данни за играчи от таблицата.",
				});
			} else {
				toast.success("Успешно импортиране", {
					description: `Извлечени са данни за ${players.length} играчи.`,
				});
				onImport(players);
				setHtmlInput(""); // Изчистваме полето
			}
		} catch (error) {
			console.error("Грешка при обработка на HTML:", error);
			toast.error("Грешка при обработка", {
				description: "Възникна грешка при обработката на HTML таблицата.",
			});
		} finally {
			setIsProcessing(false);
		}
	};

	// Функция за извличане на ID на играч от URL адреса
	const extractProfileIdFromUrl = (url: string): string | undefined => {
		// Regex за извличане на ID от URLs като "/map/214?z=Qc8"
		const match = url.match(/\/map\/(\d+)/);
		return match ? match[1] : undefined;
	};

	return (
		<div className="space-y-4">
			<div className="text-sm font-medium">
				Копирайте HTML таблицата с класацията от BGMafia
			</div>

			<Textarea
				value={htmlInput}
				onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
					setHtmlInput(e.target.value)
				}
				placeholder="Поставете HTML кода на таблицата тук..."
				className="h-40 font-mono text-xs"
				disabled={isProcessing}
			/>

			<Button
				onClick={extractPlayersFromHtml}
				disabled={!htmlInput.trim() || isProcessing}
				className="w-full"
			>
				{isProcessing ? (
					<>
						<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
						Обработка...
					</>
				) : (
					"Извлечи данни от таблицата"
				)}
			</Button>
		</div>
	);
}
