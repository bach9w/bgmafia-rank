import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
	try {
		// Извличаме id от URL-а
		const url = new URL(request.url);
		const parts = url.pathname.split("/");
		const playerId = parts[parts.length - 1];

		if (!playerId) {
			return NextResponse.json(
				{ message: "Липсва ID на играч" },
				{ status: 400 },
			);
		}

		// 1. Извличане на информацията за играча
		const { data: playerData, error: playerError } = await supabase
			.from("players")
			.select("*")
			.eq("id", playerId)
			.single();

		if (playerError) {
			return NextResponse.json(
				{
					message:
						"Грешка при извличане на данни за играч: " + playerError.message,
				},
				{ status: 500 },
			);
		}

		if (!playerData) {
			return NextResponse.json(
				{ message: "Не е намерен играч с това ID" },
				{ status: 404 },
			);
		}

		// 2. Извличане на всички статистики за играча
		const { data: statsData, error: statsError } = await supabase
			.from("daily_stats")
			.select("*")
			.eq("player_id", playerId)
			.order("date", { ascending: false });

		if (statsError) {
			return NextResponse.json(
				{
					message: "Грешка при извличане на статистики: " + statsError.message,
				},
				{ status: 500 },
			);
		}

		// 3. Изчисляване на обобщена статистика
		const totalStats = {
			strength: 0,
			intelligence: 0,
			sex: 0,
			victories: 0,
			experience: 0,
			total_score: 0,
		};

		statsData?.forEach((stat) => {
			totalStats.strength += Number(stat.strength || 0);
			totalStats.intelligence += Number(stat.intelligence || 0);
			totalStats.sex += Number(stat.sex || 0);
			totalStats.victories += Number(stat.victories || 0);
			totalStats.experience += Number(stat.experience || 0);
		});

		totalStats.total_score =
			totalStats.strength + totalStats.intelligence + totalStats.sex;

		// 4. Подготвяне на данни за последните 30 дни (за графики)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const recentActivity =
			statsData
				?.filter((stat) => new Date(stat.date) >= thirtyDaysAgo)
				.map((stat) => ({
					date: stat.date,
					strength: stat.strength,
					intelligence: stat.intelligence,
					sex: stat.sex,
					victories: stat.victories,
					experience: stat.experience,
				})) || [];

		return NextResponse.json({
			player: playerData,
			stats: statsData || [],
			totalStats,
			recentActivity,
		});
	} catch (err) {
		console.error("Неочаквана грешка:", err);
		return NextResponse.json(
			{
				message:
					"Възникна неочаквана грешка при извличането на данни за играча",
			},
			{ status: 500 },
		);
	}
}

// API за обновяване на данни за играч
export async function PATCH(request: NextRequest) {
	try {
		// Извличаме id от URL-а
		const url = new URL(request.url);
		const parts = url.pathname.split("/");
		const playerId = parts[parts.length - 1];

		if (!playerId) {
			return NextResponse.json(
				{ message: "Липсва ID на играч" },
				{ status: 400 },
			);
		}

		// Парсване на тялото на заявката
		let body;
		try {
			body = await request.json();
		} catch (jsonError) {
			console.error("Невалидно тяло на заявката:", jsonError);
			return NextResponse.json(
				{ message: "Невалидно тяло на заявката. Очаква се JSON формат." },
				{ status: 400 },
			);
		}

		const { name } = body as { name?: string };

		if (!name) {
			return NextResponse.json(
				{ message: "Липсва име за обновяване" },
				{ status: 400 },
			);
		}

		// Обновяване на името на играча
		const { data, error } = await supabase
			.from("players")
			.update({ name })
			.eq("id", playerId)
			.select()
			.single();

		if (error) {
			return NextResponse.json(
				{ message: "Грешка при обновяване на играча: " + error.message },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			player: data,
		});
	} catch (err) {
		console.error("Неочаквана грешка при обновяване:", err);
		return NextResponse.json(
			{ message: "Възникна неочаквана грешка при обновяването на играча" },
			{ status: 500 },
		);
	}
}
