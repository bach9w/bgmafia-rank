import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const dayTypeOptions = [
	"Ден на опита",
	"Ден на интелекта",
	"Ден на силата",
	"Ден на контрабандата",
	"Ден на фабриканта",
	"Ден на сексапила",
	"Ден на побой",
];

export const DayTypeForm = () => {
	const [dayType, setDayType] = useState<string>("Нормален ден");
	const [date, setDate] = useState<string>(
		new Date().toISOString().split("T")[0],
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);
		setSuccess(null);

		try {
			// Обновяваме всички записи за посочената дата
			const { error: updateError } = await supabase
				.from("daily_stats")
				.update({ day_type: dayType })
				.eq("date", date);

			if (updateError) {
				throw updateError;
			}

			const successMessage = `Успешно записан вид на деня (${dayType}) за дата ${date}`;
			setSuccess(successMessage);

			// Показваме toast съобщение за успех
			toast.success("Видът на деня е записан!", {
				description: successMessage,
			});
		} catch (err) {
			console.error("Грешка при записване на вида на деня:", err);
			const errorMessage =
				err instanceof Error
					? `Грешка: ${err.message}`
					: "Възникна неочаквана грешка при запазването";

			setError(errorMessage);

			// Показваме toast съобщение за грешка
			toast.error("Грешка при записване", {
				description: errorMessage,
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="space-y-4 max-w-lg mx-auto p-6 bg-white rounded-lg shadow"
		>
			<h2 className="text-xl font-semibold mb-4">Въведете вид на деня</h2>

			<div>
				<label
					htmlFor="date"
					className="block text-sm font-medium text-gray-700"
				>
					Дата
				</label>
				<input
					type="date"
					id="date"
					name="date"
					value={date}
					onChange={(e) => setDate(e.target.value)}
					className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					required
				/>
			</div>

			<div>
				<label
					htmlFor="dayType"
					className="block text-sm font-medium text-gray-700"
				>
					Вид на деня
				</label>
				<select
					id="dayType"
					name="dayType"
					value={dayType}
					onChange={(e) => setDayType(e.target.value)}
					className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					required
				>
					{dayTypeOptions.map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>
			</div>

			{error && (
				<div className="text-red-600 text-sm p-2 bg-red-50 rounded">
					{error}
				</div>
			)}

			{success && (
				<div className="text-green-600 text-sm p-2 bg-green-50 rounded">
					{success}
				</div>
			)}

			<Button type="submit" disabled={isLoading} className="w-full">
				{isLoading ? "Запазване..." : "Запази"}
			</Button>
		</form>
	);
};
