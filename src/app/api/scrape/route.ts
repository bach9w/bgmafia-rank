import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { Player } from "@/types/Player";
import { StatType } from "@/components/RankingsUploader";
import type { Element } from "domhandler";
import { supabase } from "@/lib/supabase";

interface Category {
	name: string;
	statType: StatType;
	pages: {
		url: string;
		referer: string | null;
	}[];
}

interface Categories {
	[key: string]: Category;
}

const categories: Categories = {
	experience: {
		name: "Опит",
		statType: "experience",
		pages: [
			{
				url: "https://bgmafia.com/top10/daily/experience/1?z=pN1",
				referer: null,
			},
			{
				url: "https://bgmafia.com/top10/daily/experience/2?z=PyC",
				referer: "https://bgmafia.com/top10/daily/experience/1?z=pN1",
			},
			{
				url: "https://bgmafia.com/top10/daily/experience/3?z=8Ff",
				referer: "https://bgmafia.com/top10/daily/experience/2?z=PyC",
			},
		],
	},
	fight_wins: {
		name: "Победи",
		statType: "victories",
		pages: [
			{
				url: "https://bgmafia.com/top10/daily/fight_wins?z=wJB",
				referer: null,
			},
			{
				url: "https://bgmafia.com/top10/daily/fight_wins/2?z=wJB",
				referer: "https://bgmafia.com/top10/daily/fight_wins?z=wJB",
			},
			{
				url: "https://bgmafia.com/top10/daily/fight_wins/3?z=wJB",
				referer: "https://bgmafia.com/top10/daily/fight_wins/2?z=wJB",
			},
		],
	},
	strength: {
		name: "Сила",
		statType: "strength",
		pages: [
			{ url: "https://bgmafia.com/top10/daily/strength?z=wEt", referer: null },
			{
				url: "https://bgmafia.com/top10/daily/strength/2?z=wEt",
				referer: "https://bgmafia.com/top10/daily/strength?z=wEt",
			},
			{
				url: "https://bgmafia.com/top10/daily/strength/3?z=wEt",
				referer: "https://bgmafia.com/top10/daily/strength/2?z=wEt",
			},
		],
	},
	intelect: {
		name: "Интелект",
		statType: "intelligence",
		pages: [
			{ url: "https://bgmafia.com/top10/daily/intelect?z=9B2", referer: null },
			{
				url: "https://bgmafia.com/top10/daily/intelect/2?z=9B2",
				referer: "https://bgmafia.com/top10/daily/intelect?z=9B2",
			},
			{
				url: "https://bgmafia.com/top10/daily/intelect/3?z=9B2",
				referer: "https://bgmafia.com/top10/daily/intelect/2?z=9B2",
			},
		],
	},
	sexapeal: {
		name: "Сексапил",
		statType: "sex",
		pages: [
			{ url: "https://bgmafia.com/top10/daily/sexapeal?z=B96", referer: null },
			{
				url: "https://bgmafia.com/top10/daily/sexapeal/2?z=B96",
				referer: "https://bgmafia.com/top10/daily/sexapeal?z=B96",
			},
			{
				url: "https://bgmafia.com/top10/daily/sexapeal/3?z=B96",
				referer: "https://bgmafia.com/top10/daily/sexapeal/2?z=B96",
			},
		],
	},
};

interface Headers {
	[key: string]: string;
}

const baseHeaders = {
	accept:
		"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
	"accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
	"cache-control": "max-age=0",
	cookie:
		"machine_id=61230140; __utmz=29123503.1741378123.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); lc=1742333984; npc[min_level]=0; npc[max_level]=25; cf_clearance=_Eub.AjOUx75bQfXinqgkLW4jx5TsxibKAIG3lXjkyc-1743361217-1.2.1.1-qbNiK1ZTA6.21arKuWCmbRbmy4nqqCdfyirFS3pmQ097DX7NoLOiPnMCbgtImIGmtrGuKnPGQmtCZalPD55FCHbX._4AZ2z.EAp6EkmK.75DktgX14BmHFCH5Y6n5KkONKP9hdQaRk7JFCBahv7VKmg7fnbkq1YHTT5vD3V1CLB20IMQHDXasnguyIehxITnu6yOZMj1lcUpXOvBd69yIElGwmXJ8naaHrNN0l361GcjRJrN6MBGlvjrChaH_18k2VqaXeqPjgWddrTSn46.sERv3wepmADDaTV6Z.7_Dp9vcAnEUNugqfwtc.DQSSvMvtHwgDtp6iKorJSa9vvJuCIXVbtcp.QbgeR7hP0RIKcZ6SIVqrd9GrN1m.w5ZZhpAEq9KkM4BLT_j3tUL_ICzyEuowliSOAOZGluBrAXjHM; terms_accepted=1; registered=1; auth=mH%2Bll7iTmWOgobB5X7NaG9w09kTzNsEVLn94k5lkoKGweV%2BzWo2bx6jf1c2mfqN%2FeJOZZaCXsHxq9g%3D%3D; __utma=29123503.1751747959.1741378123.1743485546.1743503736.21; __utmc=29123503; fight_finder[min_level]=14; __utmb=29123503.500.10.1743503736; fight_finder[online]=on; world_id=4; sess3=726362ac4d0ad4ef890d75fd2cfba823; login=1; clickcoords=1570711; my-application-browser-tab=",
	priority: "u=0, i",
	"sec-ch-ua":
		'"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
	"sec-ch-ua-arch": '"x86"',
	"sec-ch-ua-bitness": '"64"',
	"sec-ch-ua-full-version": '"131.0.6778.265"',
	"sec-ch-ua-full-version-list":
		'"Google Chrome";v="131.0.6778.265", "Chromium";v="131.0.6778.265", "Not_A Brand";v="24.0.0.0"',
	"sec-ch-ua-mobile": "?0",
	"sec-ch-ua-model": '""',
	"sec-ch-ua-platform": '"macOS"',
	"sec-ch-ua-platform-version": '"15.3.1"',
	"sec-fetch-dest": "document",
	"sec-fetch-mode": "navigate",
	"sec-fetch-user": "?1",
	"upgrade-insecure-requests": "1",
	"user-agent":
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

function extractPlayersFromTable(
	$: cheerio.CheerioAPI,
	table: cheerio.Cheerio<Element>,
	statType: StatType,
): Player[] {
	const players: Player[] = [];

	table.find("tr").each((index: number, row: Element) => {
		if (index === 0) return; // Пропускаме хедъра на таблицата

		const columns = $(row).find("td");
		if (columns.length >= 3) {
			const rank = parseInt($(columns[0]).text().trim(), 10);
			const name = $(columns[1]).text().trim();
			const value = parseInt($(columns[2]).text().trim().replace(/,/g, ""), 10);

			if (!isNaN(rank) && name && !isNaN(value)) {
				const player: Player = {
					name,
					rank,
					strength: 0,
					gang: "",
				};

				// Добавяме стойността към правилния показател
				switch (statType) {
					case "strength":
						player.strength = value;
						break;
					case "intelligence":
						player.intelligence = value;
						break;
					case "sex":
						player.sex = value;
						break;
					case "victories":
						player.victories = value;
						break;
					case "experience":
						player.experience = value;
						break;
				}

				players.push(player);
			}
		}
	});

	return players;
}

export async function POST() {
	try {
		const today = new Date().toISOString().split("T")[0];
		const allResults = [];

		for (const category of Object.values(categories)) {
			const categoryPlayers: Player[] = [];

			for (const page of category.pages) {
				const headers: Headers = { ...baseHeaders };
				if (page.referer) {
					headers["referer"] = page.referer;
					headers["sec-fetch-site"] = "same-origin";
				} else {
					headers["sec-fetch-site"] = "none";
				}

				const response = await fetch(page.url, {
					headers,
					credentials: "include",
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const html = await response.text();
				const $ = cheerio.load(html);
				const table = $("table.default");

				if (table.length > 0) {
					const pagePlayers = extractPlayersFromTable(
						$,
						table,
						category.statType,
					);
					categoryPlayers.push(...pagePlayers);
				}
			}

			// Запазваме данните за всяка категория
			if (categoryPlayers.length > 0) {
				try {
					console.log(
						`Saving ${categoryPlayers.length} players for ${category.name}...`,
					);

					// Обработваме всеки играч
					for (const player of categoryPlayers) {
						// Проверяваме дали играчът съществува
						const { data: existingPlayers, error: findError } = await supabase
							.from("players")
							.select("id")
							.eq("name", player.name);

						if (findError) {
							console.error(`Error finding player ${player.name}:`, findError);
							continue;
						}

						let playerId;

						if (existingPlayers && existingPlayers.length > 0) {
							// Играчът съществува
							playerId = existingPlayers[0].id;
						} else {
							// Създаваме нов играч
							const { data: newPlayer, error: createError } = await supabase
								.from("players")
								.insert({ name: player.name })
								.select()
								.single();

							if (createError) {
								console.error(
									`Error creating player ${player.name}:`,
									createError,
								);
								continue;
							}

							playerId = newPlayer.id;
						}

						// Проверяваме за съществуваща статистика за тази дата
						const { data: existingStats, error: statsError } = await supabase
							.from("daily_stats")
							.select("*")
							.eq("player_id", playerId)
							.eq("date", today);

						if (statsError) {
							console.error(
								`Error checking stats for ${player.name}:`,
								statsError,
							);
							continue;
						}

						const statsData = {
							player_id: playerId,
							date: today,
							strength: 0,
							intelligence: 0,
							sex: 0,
							victories: 0,
							experience: 0,
							[category.statType]: player[category.statType] || 0,
						};

						let result;
						if (existingStats && existingStats.length > 0) {
							// Актуализираме съществуващата статистика
							result = await supabase
								.from("daily_stats")
								.update({ [category.statType]: player[category.statType] || 0 })
								.eq("id", existingStats[0].id);
						} else {
							// Създаваме нова статистика
							result = await supabase.from("daily_stats").insert(statsData);
						}

						if (result.error) {
							console.error(
								`Error saving stats for ${player.name}:`,
								result.error,
							);
						} else {
							console.log(`Successfully saved stats for ${player.name}`);
						}
					}

					allResults.push({
						category: category.name,
						statType: category.statType,
						playersCount: categoryPlayers.length,
						success: true,
					});
				} catch (error) {
					console.error(`Error saving ${category.name}:`, error);
					throw error;
				}
			}
		}

		return NextResponse.json({
			success: true,
			results: allResults,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Грешка при скрапване:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Неизвестна грешка",
			},
			{ status: 500 },
		);
	}
}
