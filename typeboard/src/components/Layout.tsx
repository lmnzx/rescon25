import { Outlet, NavLink } from "react-router-dom";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Layout() {
	const { user, isLoading, login } = useAuth();

	return (
		<div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
			<header className="border-b border-zinc-800">
				<div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
					<div>
						{isLoading ? (
							<div className="h-9 w-36 bg-zinc-800 animate-pulse rounded-md"></div>
						) : user ? (
							<div className="flex items-center space-x-2">
								<Avatar className="h-6 w-6">
									<AvatarImage src={user.avatar_url} alt={user.username} />
									<AvatarFallback>
										{user.username.substring(0, 2).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<span className="font-medium">{user.username}</span>
							</div>
						) : (
							<Button
								size="sm"
								className="gap-2 bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border-emerald-600/20 hover:border-emerald-500/30 hover:bg-gradient-to-r hover:from-emerald-600/20 hover:to-teal-600/20 transition-all"
								onClick={login}
							>
								<Github size={16} />
								<span>Login with GitHub</span>
							</Button>
						)}
					</div>

					<nav className="flex items-center gap-6 font-medium">
						<NavLink
							to="/"
							className={({ isActive }) =>
								`transition-colors hover:text-emerald-400 ${isActive ? "text-emerald-400" : "text-zinc-400"}`
							}
							end
						>
							Test
						</NavLink>
						<NavLink
							to="/leaderboard"
							className={({ isActive }) =>
								`transition-colors hover:text-emerald-400 ${isActive ? "text-emerald-400" : "text-zinc-400"}`
							}
						>
							Leaderboard
						</NavLink>
					</nav>

					<div className="w-[140px]"></div>
				</div>
			</header>

			<main className="flex-1 flex flex-col">
				<Outlet />
			</main>
		</div>
	);
}
