import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import LeaderboardEntry from "@/components/LeaderboardEntry";

export default function Leaderboard() {
	const { leaderboard, isLoading, error, refetch } = useLeaderboard();

	return (
		<div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-8">
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-2xl font-bold flex items-center gap-2">
					<Trophy className="text-yellow-500" />
					Global Leaderboard
					<span className="text-xs text-zinc-500 font-normal ml-2">
						Auto-refreshes every 30s
					</span>
				</h1>
			</div>

			<div className="bg-zinc-900 rounded-xl overflow-hidden">
				<div className="grid grid-cols-11 py-3 px-4 bg-zinc-800 text-zinc-400 text-sm font-medium">
					<div className="col-span-1">#</div>
					<div className="col-span-5">User</div>
					<div className="col-span-2 text-center">WPM</div>
					<div className="col-span-2 text-center">Accuracy</div>
				</div>

				{isLoading ? (
					Array.from({ length: 10 }).map((_, index) => (
						<div
							key={index}
							className="grid grid-cols-11 py-4 px-4 border-b border-zinc-800"
						>
							<div className="col-span-1">
								<div className="h-5 w-5 bg-zinc-800 rounded animate-pulse"></div>
							</div>
							<div className="col-span-5">
								<div className="h-5 w-32 bg-zinc-800 rounded animate-pulse"></div>
							</div>
							<div className="col-span-2 flex justify-center">
								<div className="h-5 w-12 bg-zinc-800 rounded animate-pulse"></div>
							</div>
							<div className="col-span-2 flex justify-center">
								<div className="h-5 w-12 bg-zinc-800 rounded animate-pulse"></div>
							</div>
							<div className="col-span-2 flex justify-center">
								<div className="h-5 w-8 bg-zinc-800 rounded animate-pulse"></div>
							</div>
						</div>
					))
				) : error ? (
					<div className="py-8 text-center text-red-400">
						<p>Failed to load leaderboard</p>
						<Button
							variant="outline"
							size="sm"
							className="mt-4"
							onClick={refetch}
						>
							Try Again
						</Button>
					</div>
				) : leaderboard.length === 0 ? (
					<div className="py-12 text-center text-zinc-500">
						<p>No leaderboard data available</p>
					</div>
				) : (
					<div className="transition-all duration-300">
						{leaderboard.map((entry, index) => (
							<LeaderboardEntry key={entry.id} entry={entry} index={index} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}
