import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
// Премахваме ненужните импорти
// import { writeFile } from "fs/promises";
// import { join } from "path";
// import { v4 as uuidv4 } from "uuid";
import { Player } from "@/types/Player";
import { StatType, RankingPart } from "@/components/RankingsUploader";

// Инициализираме OpenAI клиента
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// Речник с преводи на показателите
const statTranslations: Record<StatType, string> = {
	strength: "сила",
	intelligence: "интелект",
	sex: "секс",
	victories: "победи",
	experience: "опит",
};

// Начален номер на играча според частта на класацията
const startingRankByPart: Record<RankingPart, number> = {
	"1": 1, // Първа част започва от номер 1
	"2": 31, // Втора част започва от номер 31
};

export async function POST(request: NextRequest) {
	try {
		// Проверяваме дали има API ключ
		if (!process.env.OPENAI_API_KEY) {
			return NextResponse.json(
				{ message: "OpenAI API ключът не е конфигуриран" },
				{ status: 500 },
			);
		}

		// Получаваме FormData от заявката
		const formData = await request.formData();
		const file = formData.get("file") as File;
		const statType = (formData.get("statType") as StatType) || "strength";
		const part = (formData.get("part") as RankingPart) || "1"; // Извличаме частта на класацията

		if (!file) {
			return NextResponse.json(
				{ message: "Не е предоставен файл" },
				{ status: 400 },
			);
		}

		// Проверяваме дали файлът е изображение
		if (!file.type.startsWith("image/")) {
			return NextResponse.json(
				{ message: "Файлът трябва да бъде изображение" },
				{ status: 400 },
			);
		}

		// Чете файла директно в памет без да го записва на диска
		const fileArrayBuffer = await file.arrayBuffer();
		const fileBuffer = Buffer.from(fileArrayBuffer);

		// Конвертираме файла в base64
		const base64Image = fileBuffer.toString("base64");

		// Извличаме типа на изображението за base64 кодирането
		const mimeType = file.type;

		// Определяме началния номер на играча в класацията според избраната част
		const startingRank = startingRankByPart[part];

		// Изпращаме заявка към OpenAI Vision API
		try {
			const response = await openai.chat.completions.create({
				model: "gpt-4o-mini",
				messages: [
					{
						role: "user",
						content: [
							{
								type: "text",
								text: `Моля, извлечи списъка с играчи от това изображение.Трябва да са 30 всеки път. Прегледай детайлно класацията. За всеки ред ми дай името на играча и числото за ${statTranslations[statType]}. 
							
									ВАЖНО: Отговори само с извлечените данни във формат "ИМЕ_НА_ИГРАЧ ЧИСЛО", без допълнителен текст. 
									Започвай винаги от първото име в класацията.
									
									НЕ слагай тирета, двоеточия или други символи между името и числата.
									НЕ добавяй никакви други символи или форматиране.
									
									Класацията започва от позиция ${startingRank}.
									
									Пример:
									ЯкаТупалка 440890530
									Basheff 425560925
									(а НЕ "1. ЯкаТупалка - 440890530" или подобни формати)`,
							},
							{
								type: "image_url",
								image_url: {
									url: `data:${mimeType};base64,${base64Image}`,
								},
							},
						],
					},
				],
				max_tokens: 1000,
			});

			// Извличаме текста от отговора
			const text = response.choices[0]?.message?.content || "";
			console.log("Извлечен текст:", text);

			// Обработваме текста, за да извлечем данните за играчите
			const players = extractPlayersFromText(text, statType, startingRank);

			return NextResponse.json({ players });
		} catch (openaiError) {
			console.error("Грешка при изпращане на заявка към OpenAI:", openaiError);
			return NextResponse.json(
				{
					message: "Грешка при анализ на изображението чрез OpenAI",
					details:
						openaiError instanceof Error
							? openaiError.message
							: String(openaiError),
				},
				{ status: 500 },
			);
		}
	} catch (error) {
		console.error("Грешка при извличане на данни:", error);

		const errorMessage =
			error instanceof Error
				? error.message
				: "Възникна грешка при обработката на изображението";

		return NextResponse.json({ message: errorMessage }, { status: 500 });
	}
}

// Функция за почистване на име от специални символи и номера
function cleanPlayerName(name: string): string {
	// Премахваме тирета, двоеточия и други специални символи в края на името
	name = name.replace(/[-:.]+\s*$/, "").trim();

	// Премахваме номера от класацията от началото на името (напр. "27 БафанаБафана" -> "БафанаБафана")
	name = name.replace(/^\d+\s+/, "");

	return name;
}

function extractPlayersFromText(
	text: string,
	statType: StatType,
	startingRank: number = 1,
): Player[] {
	const lines = text.split("\n").filter((line) => line.trim());
	const players: Player[] = [];
	let currentRank = startingRank;

	for (const line of lines) {
		// Пропускаме празни редове
		if (!line.trim()) continue;

		// Разделяме реда на части
		const parts = line.trim().split(/\s+/);

		// Търсим всички числови части
		const numericParts: string[] = [];
		let nameEndIndex = -1;

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			// Пропускаме номера в началото (1., 2., etc.)
			if (i === 0 && part.match(/^\d+\.?$/)) {
				continue;
			}

			// Проверяваме дали частта е число
			if (part.match(/^\d+$/)) {
				numericParts.push(part);
				if (nameEndIndex === -1 && i > 0) {
					nameEndIndex = i;
				}
			}
		}

		// Ако имаме намерени числа
		if (numericParts.length > 0 && nameEndIndex > 0) {
			// Съединяваме числата, за да получим стойността на показателя
			const statValue = parseInt(numericParts.join(""));

			// Извличаме името - всичко преди числата
			let nameParts = parts.slice(0, nameEndIndex);
			// Премахваме номера, ако е останал
			if (nameParts[0]?.match(/^\d+\.?$/)) {
				nameParts = nameParts.slice(1);
			}

			// Съединяваме частите на името и го почистваме
			const rawName = nameParts.join(" ").trim();
			const cleanedName = cleanPlayerName(rawName);

			if (cleanedName && !isNaN(statValue)) {
				const player: Player = {
					name: cleanedName,
					strength: 0,
					gang: "",
					rank: currentRank, // Записваме ранг на играча в класацията
				};

				// Задаваме стойност на избрания показател
				player[statType] = statValue;

				console.log("Извлечени данни:", {
					name: cleanedName,
					[statType]: statValue,
					rank: currentRank,
				});

				players.push(player);
				currentRank++; // Увеличаваме ранга за следващия играч
			}
		}
	}

	return players;
}
