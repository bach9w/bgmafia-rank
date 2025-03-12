import path from "path";
import { processRankingsImage } from "./processRankingsV2";

async function main() {
	try {
		const imagePath = path.join(
			process.cwd(),
			"src",
			"scripts",
			"rankings.png",
		);
		await processRankingsImage(imagePath);
	} catch (error) {
		console.error("Грешка при импортирането:", error);
	}
}

main();
