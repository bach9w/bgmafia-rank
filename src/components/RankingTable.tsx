import { PlayerRanking } from "@/types/database.types";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface RankingTableProps {
	rankings: PlayerRanking[];
}

export const RankingTable = ({ rankings }: RankingTableProps) => {
	const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

	const toggleRow = (playerId: string) => {
		setExpandedRows((prev) => ({
			...prev,
			[playerId]: !prev[playerId],
		}));
	};

	return (
		<div className="overflow-x-auto">
			{/* Мобилен изглед - само за малки екрани */}
			<div className="md:hidden">
				<div className="bg-gray-50 px-4 py-3 border-b border-gray-300 grid grid-cols-12 gap-2">
					<div className="col-span-2 text-xs font-medium text-gray-500 uppercase">
						Ранг
					</div>
					<div className="col-span-7 text-xs font-medium text-gray-500 uppercase">
						Име
					</div>
					<div className="col-span-3 text-xs font-medium text-gray-500 uppercase">
						Резултат
					</div>
				</div>
				{rankings.map((player, index) => (
					<div key={player.id} className="border-b border-gray-200">
						<div
							className={`px-4 py-3 grid grid-cols-12 gap-2 items-center cursor-pointer ${
								index % 2 === 0 ? "bg-white" : "bg-gray-50"
							}`}
							onClick={() => toggleRow(player.id)}
						>
							<div className="col-span-2 text-sm font-medium text-gray-900">
								{index + 1}
							</div>
							<div className="col-span-7 text-sm text-gray-900 flex items-center">
								{player.name}
								<span className="ml-auto">
									{expandedRows[player.id] ? (
										<ChevronUp size={16} />
									) : (
										<ChevronDown size={16} />
									)}
								</span>
							</div>
							<div className="col-span-3 text-sm font-medium text-gray-900">
								{player.total_score.toLocaleString()}
							</div>
						</div>

						{expandedRows[player.id] && (
							<div className="bg-gray-50 px-4 py-3 grid grid-cols-2 gap-4 text-sm">
								<div className="col-span-1">
									<p className="font-medium text-gray-500">Опит:</p>
									<p className="text-gray-900">{player.experience}</p>
								</div>
								<div className="col-span-1">
									<p className="font-medium text-gray-500">Победи:</p>
									<p className="text-gray-900">{player.victories}</p>
								</div>
								<div className="col-span-1">
									<p className="font-medium text-gray-500">Сила:</p>
									<p className="text-gray-900">
										{player.strength.toLocaleString()}
									</p>
								</div>
								<div className="col-span-1">
									<p className="font-medium text-gray-500">Интелект:</p>
									<p className="text-gray-900">
										{player.intelligence.toLocaleString()}
									</p>
								</div>
								<div className="col-span-1">
									<p className="font-medium text-gray-500">Секс:</p>
									<p className="text-gray-900">{player.sex.toLocaleString()}</p>
								</div>
							</div>
						)}
					</div>
				))}
			</div>

			{/* Десктоп изглед - видим само на средни и големи екрани */}
			<table className="min-w-full bg-white border border-gray-300 shadow-sm rounded-lg hidden md:table">
				<thead className="bg-gray-50">
					<tr>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Ранг
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Име
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Опит
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Победи
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Сила
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Интелект
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Секс
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Общ резултат
						</th>
					</tr>
				</thead>
				<tbody className="bg-white divide-y divide-gray-200">
					{rankings.map((player, index) => (
						<tr
							key={player.id}
							className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
						>
							<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
								{index + 1}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
								{player.name}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{player.experience}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{player.victories}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{player.strength.toLocaleString()}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{player.intelligence.toLocaleString()}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{player.sex.toLocaleString()}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
								{player.total_score.toLocaleString()}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};
