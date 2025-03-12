import { supabase } from "../lib/supabase";

async function cleanDatabase() {
	try {
		console.log("Започвам изчистване на базата данни...");

		// Изтриваме данните, като следваме верига от зависимости

		console.log("Изтриване на daily_stats...");
		const { error: dailyStatsError } = await supabase
			.from("daily_stats")
			.delete()
			.neq("id", "00000000-0000-0000-0000-000000000000"); // Dummy условие, за да не получим грешка

		if (dailyStatsError) {
			console.error("Грешка при изтриване на daily_stats:", dailyStatsError);
			return;
		}

		// Прескачаме player_rankings, тъй като това е view, а не таблица
		console.log("Пропускане на player_rankings (това е view)");

		console.log("Изтриване на players...");
		const { error: playersError } = await supabase
			.from("players")
			.delete()
			.neq("id", "00000000-0000-0000-0000-000000000000");

		if (playersError) {
			console.error("Грешка при изтриване на players:", playersError);
			return;
		}

		console.log("✅ Базата данни е изчистена успешно!");
	} catch (error) {
		console.error("Възникна грешка при изчистване на базата данни:", error);
	}
}

// Изпълняваме функцията
cleanDatabase();
