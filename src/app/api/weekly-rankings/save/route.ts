import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Player } from "@/types/Player";
import { StatType } from "@/components/RankingsUploader";

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

		const { players, statType, week_start_date, week_end_date } = body as {
			players: Player[];
			statType: StatType;
			week_start_date: string; // начална дата на седмицата (понеделник)
			week_end_date: string; // крайна дата на седмицата (неделя)
		};

		if (!players || !Array.isArray(players) || players.length === 0) {
			return NextResponse.json(
				{ message: "Невалидни данни за играчи" },
				{ status: 400 },
			);
		}

		if (!statType) {
			return NextResponse.json(
				{ message: "Не е посочен тип на показателя" },
				{ status: 400 },
			);
		}

		if (!week_start_date || !week_end_date) {
			return NextResponse.json(
				{ message: "Не са посочени началната и крайната дата на седмицата" },
				{ status: 400 },
			);
		}

		// Масив за съхранение на резултати от операциите
		const results = [];

		console.log(
			`Запазване на седмична класация за период: ${week_start_date} - ${week_end_date}`,
		);

		// Обработване на всеки играч
		for (const player of players) {
			try {
				// Първо проверяваме дали играчът съществува
				// Използваме profileId като основен идентификатор, ако е наличен
				let existingPlayerId;

				if (player.profileId) {
					// Търсим по profileId
					const { data: playersByProfileId, error: profileIdError } =
						await supabase
							.from("players")
							.select("id")
							.eq("profile_id", player.profileId);

					if (profileIdError) {
						console.error(
							`Грешка при търсене на играч по profile_id ${player.profileId}:`,
							profileIdError,
						);
					} else if (playersByProfileId && playersByProfileId.length > 0) {
						existingPlayerId = playersByProfileId[0].id;
						console.log(
							`Намерен съществуващ играч с profile_id ${player.profileId}, ID: ${existingPlayerId}`,
						);
					}
				}

				// Ако не намерим по profileId, търсим по име
				if (!existingPlayerId) {
					const { data: existingPlayers, error: findError } = await supabase
						.from("players")
						.select("id")
						.eq("name", player.name);

					if (findError) {
						console.error(
							`Грешка при търсене на играч ${player.name}:`,
							findError,
						);

						results.push({
							name: player.name,
							success: false,
							error: findError.message,
						});

						continue;
					}

					if (existingPlayers && existingPlayers.length > 0) {
						// Играчът съществува, използваме неговото ID
						existingPlayerId = existingPlayers[0].id;
						console.log(
							`Намерен съществуващ играч ${player.name} с ID: ${existingPlayerId}`,
						);
					}
				}

				let playerId;

				if (existingPlayerId) {
					// Играчът съществува, използваме неговото ID
					playerId = existingPlayerId;

					// Актуализираме profile_id ако е наличен и не е записан
					if (player.profileId) {
						const { data: existingProfile, error: profileError } =
							await supabase
								.from("players")
								.select("profile_id")
								.eq("id", playerId)
								.single();

						if (
							!profileError &&
							(!existingProfile.profile_id ||
								existingProfile.profile_id !== player.profileId)
						) {
							// Актуализираме profile_id на играча
							await supabase
								.from("players")
								.update({ profile_id: player.profileId })
								.eq("id", playerId);

							console.log(
								`Актуализиран profile_id на играч ${player.name} от ${
									existingProfile.profile_id || "няма"
								} на ${player.profileId}`,
							);
						}
					}
				} else {
					// Играчът не съществува, създаваме нов
					const playerData = {
						name: player.name,
						profile_id: player.profileId,
					};

					const { data: newPlayer, error: createError } = await supabase
						.from("players")
						.insert(playerData)
						.select()
						.single();

					if (createError) {
						console.error(
							`Грешка при създаване на играч ${player.name}:`,
							createError,
						);

						results.push({
							name: player.name,
							success: false,
							error: createError.message,
						});

						continue;
					}

					playerId = newPlayer.id;
					console.log(`Създаден нов играч ${player.name} с ID: ${playerId}`);
				}

				// Проверяваме дали играчът има запис за избраната седмица
				const { data: existingStats, error: checkError } = await supabase
					.from("weekly_rankings")
					.select("*")
					.eq("player_id", playerId)
					.eq("week_start_date", week_start_date)
					.eq("week_end_date", week_end_date);

				if (checkError) {
					console.error(
						`Грешка при проверка за съществуващи седмични статистики за ${player.name}:`,
						checkError,
					);

					results.push({
						name: player.name,
						success: false,
						error: checkError.message,
					});

					continue;
				}

				// Извличаме предишните стойности на показатели от края на предходната седмица
				// за да изчислим седмичния прираст
				const previousWeekEnd = new Date(week_start_date);
				previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);
				const previousWeekEndStr = previousWeekEnd.toISOString().split("T")[0];

				// Намираме последните данни за играча преди началото на текущата седмица
				const { data: previousStats, error: prevStatsError } = await supabase
					.from("daily_stats")
					.select("*")
					.eq("player_id", playerId)
					.lte("date", previousWeekEndStr)
					.order("date", { ascending: false })
					.limit(1);

				if (prevStatsError) {
					console.error(
						`Грешка при извличане на предходни статистики за ${player.name}:`,
						prevStatsError,
					);
				}

				// Абсолютни стойности - текущите от класацията
				const absoluteValue = (player[statType] as number) || 0;

				// Изчисляваме прираста, ако имаме предходни данни
				let gainValue = absoluteValue;
				if (
					previousStats &&
					previousStats.length > 0 &&
					previousStats[0][statType]
				) {
					gainValue = absoluteValue - (previousStats[0][statType] || 0);
					// Ако прирастът е отрицателен (което не би трябвало да се случва), приемаме 0
					if (gainValue < 0) gainValue = 0;
				}

				// Подготвяме данните за записване
				const statsData: Record<string, string | number | null> = {
					player_id: playerId,
					week_start_date: week_start_date,
					week_end_date: week_end_date,
					rank_position: player.rank || null,
				};

				// Задаваме абсолютна стойност на избрания показател
				statsData[statType] = absoluteValue;

				// Задаваме стойност на прираста за избрания показател
				statsData[`${statType}_gain`] = gainValue;

				let operationResult;

				if (existingStats && existingStats.length > 0) {
					// Актуализираме съществуващия запис
					const statsId = existingStats[0].id;

					// Записваме само полето, което е променено
					const { error: updateError } = await supabase
						.from("weekly_rankings")
						.update(statsData)
						.eq("id", statsId);

					if (updateError) {
						console.error(
							`Грешка при актуализиране на седмичните статистики за ${player.name}:`,
							updateError,
						);

						results.push({
							name: player.name,
							success: false,
							error: updateError.message,
						});

						continue;
					}

					operationResult = {
						name: player.name,
						success: true,
						operation: "update",
						value: absoluteValue,
						gain: gainValue,
					};

					console.log(
						`Актуализирани седмични статистики за ${player.name}: ${statType}=${absoluteValue}, ${statType}_gain=${gainValue}`,
					);
				} else {
					// Създаваме нов запис
					const { error: insertError } = await supabase
						.from("weekly_rankings")
						.insert(statsData);

					if (insertError) {
						console.error(
							`Грешка при вмъкване на седмични статистики за ${player.name}:`,
							insertError,
						);

						results.push({
							name: player.name,
							success: false,
							error: insertError.message,
						});

						continue;
					}

					operationResult = {
						name: player.name,
						success: true,
						operation: "insert",
						value: absoluteValue,
						gain: gainValue,
					};

					console.log(
						`Добавени седмични статистики за ${player.name}: ${statType}=${absoluteValue}, ${statType}_gain=${gainValue}`,
					);
				}

				results.push(operationResult);
			} catch (playerError) {
				console.error(
					`Грешка при обработка на играч ${player.name}:`,
					playerError,
				);

				results.push({
					name: player.name,
					success: false,
					error:
						playerError instanceof Error
							? playerError.message
							: "Неизвестна грешка при обработка на играча",
				});
			}
		}

		// Връщаме резултатите от операциите
		return NextResponse.json({
			success: true,
			message: `Обработени ${players.length} играчи`,
			results,
		});
	} catch (error) {
		console.error("Грешка при обработка на заявката:", error);

		return NextResponse.json(
			{
				success: false,
				message:
					error instanceof Error
						? error.message
						: "Възникна неочаквана грешка при обработка на заявката",
			},
			{ status: 500 },
		);
	}
}
