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

		const { date } = body as { date: string };

		if (!date) {
			return NextResponse.json(
				{ message: "Не е предоставена дата за проверка" },
				{ status: 400 },
			);
		}

		// Извличане на агрегирани данни за посочената дата
		const { data: statsData, error: statsError } = await supabase
			.from("daily_stats")
			.select(
				`
        date,
        day_type,
        player_id,
        strength,
        intelligence,
        sex,
        victories,
        experience
      `,
			)
			.eq("date", date);

		if (statsError) {
			console.error("Грешка при извличане на данни за датата:", statsError);
			return NextResponse.json(
				{ message: "Грешка при проверка на датата: " + statsError.message },
				{ status: 500 },
			);
		}

		// Анализираме данните
		const result = {
			date,
			hasData: statsData && statsData.length > 0,
			playersCount: statsData ? statsData.length : 0,
			day_type:
				statsData && statsData.length > 0
					? statsData[0].day_type || null
					: null,
			stats: {
				strength: statsData?.some((record) => record.strength > 0) || false,
				intelligence:
					statsData?.some((record) => record.intelligence > 0) || false,
				sex: statsData?.some((record) => record.sex > 0) || false,
				victories: statsData?.some((record) => record.victories > 0) || false,
				experience: statsData?.some((record) => record.experience > 0) || false,
			},
		};

		return NextResponse.json(result);
	} catch (err) {
		console.error("Неочаквана грешка:", err);
		return NextResponse.json(
			{ message: "Възникна неочаквана грешка при проверката на датата" },
			{ status: 500 },
		);
	}
}
