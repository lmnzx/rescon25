import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
	const navigate = useNavigate();

	useEffect(() => {
		navigate("/");
	}, [navigate]);

	return (
		<div className="flex items-center justify-center min-h-screen">
			<div className="text-center">
				<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
				<p className="mt-4 text-zinc-400">Completing login...</p>
			</div>
		</div>
	);
}
