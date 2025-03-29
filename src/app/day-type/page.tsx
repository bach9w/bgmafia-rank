"use client";

import { DayTypeForm } from "@/components/DayTypeForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DayTypePage() {
	return (
		<main className="min-h-screen bg-black">
			<div className="max-w-7xl mx-auto py-10 px-4">
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-3xl font-bold text-white">
						Въвеждане на вид на деня
					</h1>
					<Link href="/">
						<Button variant="outline">Назад към класацията</Button>
					</Link>
				</div>

				<div className="bg-white p-6 rounded-lg shadow">
					<DayTypeForm />
				</div>
			</div>
		</main>
	);
}
