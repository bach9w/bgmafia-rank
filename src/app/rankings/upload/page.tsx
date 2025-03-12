import RankingsUploader from "@/components/RankingsUploader";

export const metadata = {
	title: "Качване на класация | BGMafia",
	description: "Качване и анализ на класация на играчи в BGMafia",
};

export default function RankingsUploadPage() {
	return (
		<div className="container py-8">
			<h1 className="text-2xl font-bold mb-6">Качване на класация</h1>
			<p className="mb-6 text-gray-600">
				Качете изображение с класацията на играчите, за да извлечете автоматично
				данните и да ги запазите в базата данни. Системата ще разпознае имената
				и силата на играчите.
			</p>
			<RankingsUploader />
		</div>
	);
}
