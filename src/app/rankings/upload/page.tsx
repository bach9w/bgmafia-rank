import RankingsUploader from "@/components/RankingsUploader";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
	title: "Качване на класация | BGMafia",
	description: "Качване и анализ на класация на играчи в BGMafia",
};

export default function RankingsUploadPage() {
	return (
		<div className="container py-8 flex flex-col gap-4 justify-center items-center">
			<h1 className="text-2xl font-bold mb-6">Качване на класация</h1>
			<p className="mb-6 text-gray-600">
				Качете изображение с класацията на играчите, за да извлечете автоматично
				данните и да ги запазите в базата данни. Системата ще разпознае имената
				и силата на играчите.
			</p>
			<RankingsUploader />
			<Link href="/">
				<Button variant="outline">Назад</Button>
			</Link>
		</div>
	);
}
