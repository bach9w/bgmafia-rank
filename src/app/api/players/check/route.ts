import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
	try {
		// Парсване на тялото на заявката
		let body;
		try {
			body = await request.json();
		} catch (jsonError) {
			console.error("Грешка при парсване на JSON заявката:", jsonError);
			return NextResponse.json(
				{ message: "Невалидно тяло на заявката. Очаква се JSON формат." },
				{ status: 400 },
			);
		}

		const { playerNames } = body as { playerNames: string[] };

		if (
			!playerNames ||
			!Array.isArray(playerNames) ||
			playerNames.length === 0
		) {
			return NextResponse.json(
				{ message: "Невалидни имена на играчи" },
				{ status: 400 },
			);
		}

		// Извличане на всички играчи от базата данни наведнъж
		const { data: existingPlayers, error } = await supabase
			.from("players")
			.select("name")
			.in("name", playerNames);

		if (error) {
			console.error("Грешка при извличане на играчи:", error);
			return NextResponse.json(
				{ message: "Грешка при проверка на играчи: " + error.message },
				{ status: 500 },
			);
		}

		// Създаване на Set за по-бързо търсене
		const existingPlayerNames = new Set(
			existingPlayers?.map((player) => player.name.toLowerCase()) || [],
		);

		// Проверка на всяко име и добавяне на флаг exists
		const results = playerNames.map((name) => ({
			name,
			exists: existingPlayerNames.has(name.toLowerCase()),
		}));

		return NextResponse.json({ players: results });
	} catch (err) {
		console.error("Неочаквана грешка:", err);
		return NextResponse.json(
			{ message: "Възникна неочаквана грешка при проверката на играчи" },
			{ status: 500 },
		);
	}
}
