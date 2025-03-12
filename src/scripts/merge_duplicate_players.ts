import { supabase } from "../lib/supabase";

async function mergeDuplicatePlayers() {
	console.log("Започване на процеса по обединяване на дублирани играчи...");

	// 1. Намиране на всички играчи
	const { data: allPlayers, error: playersError } = await supabase
		.from("players")
		.select("id, name");

	if (playersError) {
		console.error("Грешка при извличане на играчите:", playersError);
		return;
	}

	// 2. Групиране на играчите по име
	const playersByName: Record<string, string[]> = {};

	allPlayers?.forEach((player) => {
		const name = player.name;
		if (!playersByName[name]) {
			playersByName[name] = [];
		}
		playersByName[name].push(player.id);
	});

	// 3. Намиране на дублирани играчи (с повече от 1 ID)
	const duplicatePlayerNames = Object.keys(playersByName).filter(
		(name) => playersByName[name].length > 1,
	);

	console.log(
		`Намерени ${duplicatePlayerNames.length} играчи с дублирани записи.`,
	);

	// 4. Обработка на всеки дублиран играч
	for (const playerName of duplicatePlayerNames) {
		const playerIds = playersByName[playerName];

		console.log(
			`Обработка на дублиран играч: ${playerName} (${playerIds.length} записа)`,
		);

		// Запазваме първия ID като основен
		const primaryPlayerId = playerIds[0];
		const duplicatePlayerIds = playerIds.slice(1);

		console.log(`- Основен ID: ${primaryPlayerId}`);
		console.log(`- Дублирани ID-та: ${duplicatePlayerIds.join(", ")}`);

		// 5. Обновяване на статистиките за дублираните играчи
		for (const duplicateId of duplicatePlayerIds) {
			// Намиране на всички статистики за дублирания играч
			const { data: duplicateStats, error: statsError } = await supabase
				.from("daily_stats")
				.select("*")
				.eq("player_id", duplicateId);

			if (statsError) {
				console.error(
					`Грешка при извличане на статистики за ${playerName} (ID: ${duplicateId}):`,
					statsError,
				);
				continue;
			}

			if (!duplicateStats || duplicateStats.length === 0) {
				console.log(
					`- Няма статистики за дублирания играч с ID ${duplicateId}`,
				);
				continue;
			}

			console.log(
				`- Намерени ${duplicateStats.length} статистики за дублирания играч с ID ${duplicateId}`,
			);

			// Обработка на всяка статистика
			for (const stat of duplicateStats) {
				const { date, strength, intelligence, sex, victories, experience } =
					stat;

				// Проверка дали основният играч има статистика за тази дата
				const { data: primaryStats, error: primaryStatsError } = await supabase
					.from("daily_stats")
					.select("*")
					.eq("player_id", primaryPlayerId)
					.eq("date", date);

				if (primaryStatsError) {
					console.error(
						`Грешка при извличане на статистики за основния играч (ID: ${primaryPlayerId}) за дата ${date}:`,
						primaryStatsError,
					);
					continue;
				}

				if (primaryStats && primaryStats.length > 0) {
					// Обновяване на съществуващата статистика
					const primaryStat = primaryStats[0];
					const updatedValues = {
						strength: (primaryStat.strength || 0) + (strength || 0),
						intelligence: (primaryStat.intelligence || 0) + (intelligence || 0),
						sex: (primaryStat.sex || 0) + (sex || 0),
						victories: (primaryStat.victories || 0) + (victories || 0),
						experience: (primaryStat.experience || 0) + (experience || 0),
					};

					const { error: updateError } = await supabase
						.from("daily_stats")
						.update(updatedValues)
						.eq("id", primaryStat.id);

					if (updateError) {
						console.error(
							`Грешка при обновяване на статистики за ${playerName} (ID: ${primaryPlayerId}) за дата ${date}:`,
							updateError,
						);
					} else {
						console.log(`- Обновена статистика за дата ${date}`);
					}
				} else {
					// Създаване на нова статистика с променен player_id
					const newStat = {
						...stat,
						player_id: primaryPlayerId,
						id: undefined, // Премахваме ID, за да се генерира ново
					};

					delete newStat.id;

					const { error: insertError } = await supabase
						.from("daily_stats")
						.insert(newStat);

					if (insertError) {
						console.error(
							`Грешка при създаване на нова статистика за ${playerName} (ID: ${primaryPlayerId}) за дата ${date}:`,
							insertError,
						);
					} else {
						console.log(`- Създадена нова статистика за дата ${date}`);
					}
				}
			}

			// Изтриване на статистиките на дублирания играч
			const { error: deleteStatsError } = await supabase
				.from("daily_stats")
				.delete()
				.eq("player_id", duplicateId);

			if (deleteStatsError) {
				console.error(
					`Грешка при изтриване на статистики за дублирания играч ${playerName} (ID: ${duplicateId}):`,
					deleteStatsError,
				);
			} else {
				console.log(
					`- Изтрити статистики за дублирания играч с ID ${duplicateId}`,
				);
			}

			// Изтриване на дублирания играч
			const { error: deletePlayerError } = await supabase
				.from("players")
				.delete()
				.eq("id", duplicateId);

			if (deletePlayerError) {
				console.error(
					`Грешка при изтриване на дублирания играч ${playerName} (ID: ${duplicateId}):`,
					deletePlayerError,
				);
			} else {
				console.log(`- Изтрит дублиран играч с ID ${duplicateId}`);
			}
		}

		console.log(`Успешно обединени дублирани записи за играч ${playerName}`);
	}

	console.log("Процесът по обединяване на дублирани играчи завърши.");
}

// Изпълнение на функцията за обединяване на дублирани играчи
mergeDuplicatePlayers().catch((error) => {
	console.error("Грешка при обединяване на дублирани играчи:", error);
});
