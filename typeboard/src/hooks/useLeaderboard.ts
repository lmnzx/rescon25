import { useState, useEffect, useRef } from "react";

export type LeaderboardEntry = {
	login: string;
	max_wpm: number;
	accuracy: number;
};

export type LeaderboardEntryWithId = LeaderboardEntry & {
	id: string;
	position: number;
	previousPosition?: number;
	isNew?: boolean;
	hasChanged?: boolean;
};

export function useLeaderboard() {
	const [leaderboard, setLeaderboard] = useState<LeaderboardEntryWithId[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const previousDataRef = useRef<Map<string, LeaderboardEntryWithId>>(
		new Map(),
	);

	const fetchLeaderboard = async () => {
		try {
			const response = await fetch("/api/leaderboard");

			if (!response.ok) {
				throw new Error(`Failed to fetch leaderboard: ${response.status}`);
			}

			const data: LeaderboardEntry[] = await response.json();

			const prevEntries = new Map<string, LeaderboardEntryWithId>();
			leaderboard.forEach((entry) => {
				prevEntries.set(entry.login, { ...entry });
			});

			const processedData = data
				.map((entry, index) => {
					const id = entry.login;
					const prevEntry = prevEntries.get(id);
					const isNew = !prevEntry;

					const hasChanged =
						prevEntry &&
						(prevEntry.max_wpm !== entry.max_wpm ||
							prevEntry.accuracy !== entry.accuracy);

					return {
						...entry,
						id,
						position: index + 1,
						previousPosition: prevEntry?.position,
						isNew,
						hasChanged,
					};
				})
				.sort((a, b) => b.max_wpm - a.max_wpm);

			const newEntriesMap = new Map<string, LeaderboardEntryWithId>();
			processedData.forEach((entry) => {
				newEntriesMap.set(entry.login, entry);
			});
			previousDataRef.current = newEntriesMap;

			setLeaderboard(processedData);
			setIsLoading(false);
			setError(null);
		} catch (err) {
			console.error("Error fetching leaderboard:", err);
			setError(
				err instanceof Error ? err.message : "Failed to fetch leaderboard",
			);
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchLeaderboard();

		const intervalId = setInterval(() => {
			fetchLeaderboard();
		}, 30000); // 30 seconds

		return () => clearInterval(intervalId);
	}, []);

	return { leaderboard, isLoading, error, refetch: fetchLeaderboard };
}
