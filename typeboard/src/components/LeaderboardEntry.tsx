import { useEffect, useState } from "react";
import { Trophy, Medal, Award } from "lucide-react";
import type { LeaderboardEntryWithId } from "@/hooks/useLeaderboard";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface LeaderboardEntryProps {
	entry: LeaderboardEntryWithId;
	index: number;
}

export default function LeaderboardEntry({
	entry,
	index,
}: LeaderboardEntryProps) {
	const { user } = useAuth();
	const [highlight, setHighlight] = useState(false);
	const [animatePosition, setAnimatePosition] = useState(false);
	const isCurrentUser = user?.username === entry.login;

	useEffect(() => {
		if (entry.isNew || entry.hasChanged) {
			setHighlight(true);
			const timer = setTimeout(() => {
				setHighlight(false);
			}, 2000);
			return () => clearTimeout(timer);
		}
	}, [entry.isNew, entry.hasChanged, entry.max_wpm, entry.accuracy]);

	useEffect(() => {
		if (entry.previousPosition && entry.previousPosition !== entry.position) {
			setAnimatePosition(true);
			const timer = setTimeout(() => {
				setAnimatePosition(false);
			}, 2000);
			return () => clearTimeout(timer);
		}
	}, [entry.position, entry.previousPosition]);

	const positionChange =
		entry.previousPosition && entry.position < entry.previousPosition
			? "up"
			: entry.previousPosition && entry.position > entry.previousPosition
				? "down"
				: null;

	return (
		<div
			className={cn(
				"grid grid-cols-11 py-4 px-4 border-b border-zinc-800 transition-all duration-500",
				{
					"bg-teal-900/20": isCurrentUser,
					"hover:bg-zinc-800/50": !highlight,
					"bg-teal-500/10": highlight && !isCurrentUser,
					"bg-teal-500/20": highlight && isCurrentUser,
				},
			)}
		>
			<div className="col-span-1 flex items-center">
				{index === 0 ? (
					<Trophy className="text-yellow-500 h-5 w-5" />
				) : index === 1 ? (
					<Medal className="text-zinc-400 h-5 w-5" />
				) : index === 2 ? (
					<Award className="text-amber-700 h-5 w-5" />
				) : (
					<div className="relative">
						<span className="text-zinc-500">{index + 1}</span>
						{positionChange && (
							<span
								className={cn(
									"absolute -right-4 text-xs transition-opacity duration-1000",
									{
										"text-teal-400": positionChange === "up",
										"text-red-400": positionChange === "down",
										"opacity-100": animatePosition,
										"opacity-0": !animatePosition,
									},
								)}
							>
								{positionChange === "up" ? "↑" : "↓"}
							</span>
						)}
					</div>
				)}
			</div>

			<div className="col-span-5 font-medium flex items-center">
				{entry.login}
				{isCurrentUser && (
					<span className="ml-2 text-xs bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full">
						You
					</span>
				)}
			</div>

			<div
				className={cn(
					"col-span-2 text-center font-mono font-bold transition-colors duration-500",
					{
						"text-teal-400": !highlight,
						"text-teal-300 scale-110": highlight,
					},
				)}
			>
				{entry.max_wpm}
			</div>

			<div
				className={cn("col-span-2 text-center transition-colors duration-500", {
					"text-zinc-300": !highlight,
					"text-teal-300 scale-110": highlight,
				})}
			>
				{entry.accuracy}%
			</div>
		</div>
	);
}
