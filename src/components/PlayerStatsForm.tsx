import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface PlayerStats {
	name: string;
	experience: number;
	victories: number;
	strength: number;
	intelligence: number;
	sex: number;
}

const initialStats: PlayerStats = {
	name: "",
	experience: 0,
	victories: 0,
	strength: 0,
	intelligence: 0,
	sex: 0,
};

export const PlayerStatsForm = () => {
	const [stats, setStats] = useState<PlayerStats>(initialStats);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			console.log("Опит за създаване на играч:", stats.name);

			// First, create or find the player
			const { data: playerData, error: playerError } = await supabase
				.from("players")
				.upsert({ name: stats.name })
				.select()
				.single();

			if (playerError) {
				console.error("Грешка при създаване на играч:", playerError);
				throw playerError;
			}

			console.log("Играч създаден/намерен успешно:", playerData);

			// Then, add the daily stats
			const { error: statsError } = await supabase.from("daily_stats").insert({
				player_id: playerData.id,
				experience: stats.experience,
				victories: stats.victories,
				strength: stats.strength,
				intelligence: stats.intelligence,
				sex: stats.sex,
			});

			if (statsError) {
				console.error("Грешка при добавяне на статистики:", statsError);
				throw statsError;
			}

			console.log("Статистики добавени успешно");

			// Reset form
			setStats(initialStats);
		} catch (err) {
			console.error("Детайли за грешката:", err);
			setError(
				err instanceof Error
					? `Грешка: ${err.message}`
					: "Възникна неочаквана грешка при запазването",
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setStats((prev) => ({
			...prev,
			[name]: name === "name" ? value : parseInt(value) || 0,
		}));
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="space-y-4 max-w-lg mx-auto p-6 bg-white rounded-lg shadow"
		>
			<div>
				<label
					htmlFor="name"
					className="block text-sm font-medium text-gray-700"
				>
					Име
				</label>
				<input
					type="text"
					id="name"
					name="name"
					value={stats.name}
					onChange={handleChange}
					className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					required
				/>
			</div>

			{["experience", "victories", "strength", "intelligence", "sex"].map(
				(field) => (
					<div key={field}>
						<label
							htmlFor={field}
							className="block text-sm font-medium text-gray-700 capitalize"
						>
							{field === "experience"
								? "Опит"
								: field === "victories"
								? "Победи"
								: field === "strength"
								? "Сила"
								: field === "intelligence"
								? "Интелект"
								: "Секс"}
						</label>
						<input
							type="number"
							id={field}
							name={field}
							value={stats[field as keyof PlayerStats]}
							onChange={handleChange}
							min="0"
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
							required
						/>
					</div>
				),
			)}

			{error && (
				<div className="text-red-600 text-sm p-2 bg-red-50 rounded">
					{error}
				</div>
			)}

			<button
				type="submit"
				disabled={isLoading}
				className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
			>
				{isLoading ? "Запазване..." : "Запази"}
			</button>
		</form>
	);
};
