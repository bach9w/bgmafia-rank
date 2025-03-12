import { PlayerRanking } from "@/types/database.types";

interface RankingTableProps {
	rankings: PlayerRanking[];
}

export const RankingTable = ({ rankings }: RankingTableProps) => {
	return (
		<div className="overflow-x-auto">
			<table className="min-w-full bg-white border border-gray-300 shadow-sm rounded-lg">
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
