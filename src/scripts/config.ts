import dotenv from "dotenv";
import path from "path";

// Зареждаме .env.local файла
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

interface Config {
	supabaseUrl?: string;
	supabaseKey?: string;
	openaiApiKey?: string;
}

export const config: Config = {
	supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
	supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
	openaiApiKey: process.env.OPENAI_API_KEY,
};

if (!config.supabaseUrl || !config.supabaseKey) {
	throw new Error(
		"Missing Supabase configuration. Please check your environment variables.",
	);
}
