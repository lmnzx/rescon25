import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from "react";

type User = {
	username: string;
	avatar_url: string;
} | null;

type AuthContextType = {
	user: User;
	isLoading: boolean;
	login: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const checkLoginStatus = async () => {
			try {
				const response = await fetch("/api/auth/status", {
					credentials: "include",
				});

				if (response.ok) {
					const userData = await response.json();
					setUser(userData);
				}
			} catch (error) {
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};

		checkLoginStatus();
	}, []);

	const login = () => {
		window.location.href = "/api/login";
	};

	return (
		<AuthContext.Provider value={{ user, isLoading, login }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
