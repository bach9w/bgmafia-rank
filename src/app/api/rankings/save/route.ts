import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Player } from "@/types/Player";
import { StatType } from "@/components/RankingsUploader";

// Режими на запис на данни
type SaveMode = "add" | "overwrite";

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

		const { players, statType, date, day_type } = body as {
			players: Player[];
			statType: StatType;
			date?: string; // Датата е опционален параметър
			day_type?: string; // Вида на деня е опционален параметър
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

		// Масив за съхранение на резултати от операциите
		const results = [];

		// Дата за запис на статистика - използваме подадената или текуща
		const currentDate = date || new Date().toISOString().split("T")[0]; // Формат: YYYY-MM-DD

		console.log(`Запазване на данни за дата: ${currentDate}`);

		// Обработване на всеки играч
		for (const player of players) {
			try {
				// Първо проверяваме дали играчът съществува
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

				let playerId;

				if (existingPlayers && existingPlayers.length > 0) {
					// Играчът съществува, използваме неговото ID
					playerId = existingPlayers[0].id;
					console.log(
						`Намерен съществуващ играч ${player.name} с ID: ${playerId}`,
					);
				} else {
					// Играчът не съществува, създаваме нов
					const { data: newPlayer, error: createError } = await supabase
						.from("players")
						.insert({ name: player.name })
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

				// Проверяваме дали играчът има запис за избраната дата
				const { data: existingStats, error: checkError } = await supabase
					.from("daily_stats")
					.select("*")
					.eq("player_id", playerId)
					.eq("date", currentDate);

				if (checkError) {
					console.error(
						`Грешка при проверка за съществуващи статистики за ${player.name}:`,
						checkError,
					);

					results.push({
						name: player.name,
						success: false,
						error: checkError.message,
					});

					continue;
				}

				// Подготвяме данните според типа показател
				const statsData: Record<string, number | string> = {
					player_id: playerId,
				};

				// Задаваме стойност на избрания показател
				statsData[statType] = (player[statType] as number) || 0;

				let operationResult;
				let updatedValue = statsData[statType] as number;
				let oldValue = 0;

				if (existingStats && existingStats.length > 0) {
					// Актуализираме съществуващия запис
					const statsId = existingStats[0].id;
					// Запазваме текущата стойност за логовете
					oldValue = existingStats[0][statType] || 0;

					// Определяме дали ще презаписваме или сумираме
					// Проверяваме най-високата стойност в базата за този играч и показател
					const { data: historicalStats, error: historyError } = await supabase
						.from("daily_stats")
						.select(statType)
						.eq("player_id", playerId)
						.order(statType, { ascending: false })
						.limit(1);

					if (historyError) {
						console.error(
							`Грешка при извличане на историческите данни за ${player.name}:`,
							historyError,
						);
					}

					const highestValue =
						historicalStats && historicalStats.length > 0
							? Number(
									historicalStats[0][
										statType as keyof (typeof historicalStats)[0]
									],
							  ) || 0
							: 0;

					// Автоматично определяме режима на запис
					let mode: SaveMode = "overwrite";

					// Ако новата стойност е по-ниска от най-високата историческа,
					// вероятно е от друг тип класация или частична класация - презаписваме
					if (updatedValue < highestValue) {
						mode = "overwrite";
						console.log(
							`Автоматично избран режим "Презаписване" за ${player.name} (нова стойност ${updatedValue} е по-ниска от историческия максимум ${highestValue})`,
						);
					}
					// Ако новата стойност е същата като текущата, вероятно е от същата класация - сумираме
					else if (updatedValue === oldValue) {
						mode = "add";
						console.log(
							`Автоматично избран режим "Сумиране" за ${player.name} (новата стойност ${updatedValue} съвпада с текущата ${oldValue})`,
						);
					}
					// Ако новата стойност е по-висока от текущата, но е различна, решаваме на база на разликата
					else {
						// Ако разликата е малка (до 10%), вероятно е различен запис на същата класация - презаписваме
						const difference =
							Math.abs(updatedValue - oldValue) /
							Math.max(updatedValue, oldValue);

						if (difference < 0.1) {
							mode = "overwrite";
							console.log(
								`Автоматично избран режим "Презаписване" за ${player.name} (малка разлика между ${updatedValue} и ${oldValue})`,
							);
						} else {
							// Ако разликата е голяма (над 10%), вероятно е от друга класация - сумираме
							mode = "add";
							console.log(
								`Автоматично избран режим "Сумиране" за ${player.name} (голяма разлика между ${updatedValue} и ${oldValue})`,
							);
						}
					}

					// Прилагаме избрания режим
					if (mode === "add") {
						// Сумираме стойностите
						updatedValue = oldValue + updatedValue;
					}
					// Иначе просто презаписваме (режим "overwrite")

					// Актуализираме само избрания показател и вида на деня, ако е предоставен
					const updateData: Record<string, number | string> = {
						[statType]: updatedValue,
					};
					if (day_type !== undefined) {
						updateData.day_type = day_type;
					}

					operationResult = await supabase
						.from("daily_stats")
						.update(updateData)
						.eq("id", statsId);

					console.log(
						`Актуализиране на съществуващ запис за ${player.name}, id: ${statsId}. Стара стойност: ${oldValue}, нова стойност: ${updatedValue} (режим: ${mode})`,
					);
				} else {
					// Създаваме нов запис с нулеви стойности за останалите показатели
					const fullStatsData = {
						player_id: playerId,
						strength: 0,
						intelligence: 0,
						sex: 0,
						victories: 0,
						experience: 0,
						date: currentDate, // Използваме избраната дата
						day_type: day_type, // Добавяме вида на деня, ако е предоставен
						...{ [statType]: statsData[statType] },
					};

					// Добавяне на нова дневна статистика
					operationResult = await supabase
						.from("daily_stats")
						.insert(fullStatsData);

					console.log(
						`Създаване на нов запис за ${player.name} за дата ${currentDate}`,
					);
				}

				if (operationResult.error) {
					console.error(
						`Грешка при обновяване на статистики за ${player.name}:`,
						operationResult.error,
					);

					results.push({
						name: player.name,
						success: false,
						error: operationResult.error.message,
					});

					continue;
				}

				results.push({
					name: player.name,
					success: true,
				});

				// Получаваме името на показателя за по-добър лог
				const statNames: Record<StatType, string> = {
					strength: "Сила",
					intelligence: "Интелект",
					sex: "Секс",
					victories: "Победи",
					experience: "Опит",
				};

				console.log(
					`✅ Успешно обновени данни за ${player.name} (${statNames[statType]}: ${updatedValue}) за дата ${currentDate}`,
				);
			} catch (error) {
				console.error(
					`❌ Грешка при обновяване на данните за ${player.name}:`,
					error,
				);

				results.push({
					name: player.name,
					success: false,
					error: error instanceof Error ? error.message : "Неизвестна грешка",
				});
			}
		}

		return NextResponse.json({
			message: "Операцията завърши",
			results,
		});
	} catch (error) {
		console.error("Неочаквана грешка при обработка на заявката:", error);
		return NextResponse.json(
			{
				message: "Възникна неочаквана грешка при обработка на заявката",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
