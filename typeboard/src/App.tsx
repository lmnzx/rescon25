import { Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import TypingTest from "@/components/TypingTest";
import Leaderboard from "@/components/Leaderboard";
import AuthCallback from "./components/AuthCallback";

export default function App() {
	return (
		<Routes>
			<Route path="/api/login/callback" element={<AuthCallback />} />
			<Route path="/" element={<Layout />}>
				<Route index element={<TypingTest />} />
				<Route path="leaderboard" element={<Leaderboard />} />
			</Route>
		</Routes>
	);
}
