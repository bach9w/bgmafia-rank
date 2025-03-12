import { supabase } from "../lib/supabase";

async function addUniqueConstraint() {
	console.log("Добавяне на уникално ограничение към таблицата players...");

	try {
		// Използваме директна SQL заявка
		const { error } = await supabase.rpc("exec_sql", {
			query:
				"ALTER TABLE players ADD CONSTRAINT players_name_unique UNIQUE (name);",
		});

		if (error) {
			console.error("Грешка при добавяне на уникално ограничение:", error);

			// Ако не работи с RPC, можете да използвате Supabase SQL редактора
			console.log(
				"Моля, изпълнете следната SQL заявка в Supabase SQL редактора:",
			);
			console.log(
				"ALTER TABLE players ADD CONSTRAINT players_name_unique UNIQUE (name);",
			);

			return;
		}

		console.log("Успешно добавено уникално ограничение към таблицата players!");
	} catch (error) {
		console.error("Грешка при добавяне на уникално ограничение:", error);

		// Като алтернатива, можете да използвате Supabase SQL редактора
		console.log(
			"Моля, изпълнете следната SQL заявка в Supabase SQL редактора:",
		);
		console.log(
			"ALTER TABLE players ADD CONSTRAINT players_name_unique UNIQUE (name);",
		);
	}
}

// Изпълнение на функцията
addUniqueConstraint().catch((error) => {
	console.error("Грешка:", error);
});
