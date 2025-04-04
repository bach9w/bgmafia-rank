import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ScrapeResult {
	name: string;
	pages: {
		pageNumber: number;
		content: string;
	}[];
}

interface ScrapeResults {
	[key: string]: ScrapeResult;
}

export function ScrapeButton() {
	const [isLoading, setIsLoading] = useState(false);
	const [results, setResults] = useState<ScrapeResults | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleScrape = async () => {
		try {
			setIsLoading(true);
			setError(null);

			const response = await fetch("/api/scrape", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || "Грешка при извличане на данните");
			}

			setResults(data.data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Неочаквана грешка");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-4">
			<Button
				onClick={handleScrape}
				disabled={isLoading}
				className="w-full md:w-auto"
			>
				{isLoading ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Извличане на данни...
					</>
				) : (
					"Извличане на данни от BGMafia"
				)}
			</Button>

			{error && (
				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
					{error}
				</div>
			)}

			{results && (
				<div className="space-y-8">
					{Object.entries(results).map(([key, category]) => (
						<div key={key} className="bg-white shadow rounded-lg p-6">
							<h2 className="text-2xl font-bold mb-4">{category.name}</h2>
							{category.pages.map((page) => (
								<div key={page.pageNumber} className="mb-6">
									<h3 className="text-lg font-semibold mb-2">
										Страница {page.pageNumber}
									</h3>
									<div
										className="overflow-x-auto"
										dangerouslySetInnerHTML={{ __html: page.content }}
									/>
								</div>
							))}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
