import { supabase } from "../lib/supabase";

import fs from "fs";
import OpenAI from "openai";
import { config } from "./config";

interface PlayerRankData {
	name: string;
	strength: number;
	gang: string;
}

async function extractDataFromImage(
	imagePath: string,
): Promise<PlayerRankData[]> {
	if (!config.openaiApiKey) {
		throw new Error("OpenAI API key is not configured");
	}

	const openai = new OpenAI({
		apiKey: config.openaiApiKey,
	});

	try {
		// Четем изображението като base64
		const imageBuffer = fs.readFileSync(imagePath);
		const base64Image = imageBuffer.toString("base64");

		const response = await openai.chat.completions.create({
			model: "gpt-4o",
			messages: [
				{
					role: "user",
					content: [
						{
							type: "text",
							text: "Моля, извлечи списъка с играчи от това изображение. За всеки ред ми дай името на играча и числото за сила. Отговори само с извлечените данни, без допълнителен текст.",
						},
						{
							type: "image_url",
							image_url: {
								url: `data:image/png;base64,${base64Image}`,
							},
						},
					],
				},
			],
			max_tokens: 1000,
		});

		const text = response.choices[0]?.message?.content || "";
		console.log("Извлечен текст:", text);

		const lines = text.split("\n").filter((line: string) => line.trim());
		const players: PlayerRankData[] = [];

		for (const line of lines) {
			// Пропускаме празни редове
			if (!line.trim()) continue;

			// Разделяме реда на части (номер, име, сила)
			const parts = line.trim().split(/\s+/);

			// Търсим всички последователни числови части, които формират силата на играча
			const numericParts: number[] = [];
			let nameEndIndex = 0;

			for (let i = 0; i < parts.length; i++) {
				const part = parts[i];
				// Ако имаме номер в началото, пропускаме го (например "1.")
				if (i === 0 && part.match(/^\d+\.$/)) {
					continue;
				}

				// Проверяваме дали частта е число
				if (part.match(/^\d+$/)) {
					numericParts.push(parseInt(part));
					if (nameEndIndex === 0 && i > 0) {
						nameEndIndex = i;
					}
				}
			}

			// Ако имаме открити числа
			if (numericParts.length > 0) {
				// Формираме пълното число като конкатенираме всички части
				const strengthStr = numericParts.join("");
				const strength = parseInt(strengthStr);

				// Извличаме името
				let name = "";
				if (nameEndIndex > 0) {
					// Вземаме всички части преди първото число
					let nameParts = parts.slice(0, nameEndIndex);
					// Премахваме номера в началото, ако има такъв
					if (nameParts[0]?.match(/^\d+\.$/)) {
						nameParts = nameParts.slice(1);
					}
					name = nameParts.join(" ").trim();
				} else {
					// Ако не можем да определим края на името, опитваме друг подход
					const match = line.match(/(\d+\.\s+)?([^0-9]+)(\d+)/);
					if (match && match[2]) {
						name = match[2].trim();
					}
				}

				// Премахваме специални символи от името
				name = name.replace(/[„"«.\\]/g, "").trim();

				if (name && !isNaN(strength)) {
					console.log("Извлечени данни:", {
						name,
						strength,
						gang: "",
					});

					players.push({
						name,
						strength,
						gang: "",
					});
				}
			}
		}

		return players;
	} catch (error) {
		console.error("Грешка при извличане на данни от изображението:", error);
		throw error;
	}
}

async function updateDatabase(players: PlayerRankData[]): Promise<void> {
	for (const player of players) {
		try {
			console.log(`Обработка на играч: ${player.name}`);

			// Създаване или намиране на играча
			const { data: playerData, error: playerError } = await supabase
				.from("players")
				.upsert({ name: player.name })
				.select()
				.single();

			if (playerError) {
				console.error(
					`Грешка при създаване/намиране на играч ${player.name}:`,
					playerError,
				);
				throw playerError;
			}

			// Добавяне на дневната статистика
			const { error: statsError } = await supabase.from("daily_stats").insert({
				player_id: playerData.id,
				strength: player.strength,
				experience: 0,
				victories: 0,
				intelligence: 0,
				sex: 0,
			});

			if (statsError) {
				console.error(
					`Грешка при добавяне на статистики за ${player.name}:`,
					statsError,
				);
				throw statsError;
			}

			console.log(
				`✅ Успешно обновени данни за ${player.name} (Сила: ${player.strength})`,
			);
		} catch (error) {
			console.error(
				`❌ Грешка при обновяване на данните за ${player.name}:`,
				error,
			);
		}
	}
}

export async function processRankingsImage(imagePath: string): Promise<void> {
	try {
		console.log("🔍 Започва обработка на изображението...");
		const players = await extractDataFromImage(imagePath);
		console.log(`📊 Извлечени ${players.length} играчи от изображението`);

		if (players.length === 0) {
			throw new Error("Не бяха открити данни за играчи в изображението");
		}

		console.log("💾 Започва обновяване на базата данни...");
		await updateDatabase(players);
		console.log("✨ Обработката завърши успешно!");
	} catch (error) {
		console.error("🔥 Грешка при обработката:", error);
		throw error;
	}
}
