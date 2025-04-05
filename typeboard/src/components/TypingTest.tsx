import type React from "react";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { generateText } from "../lib/text-generator";
import { RefreshCw } from "lucide-react";

export default function TypingTest() {
	const [_text, setText] = useState("");
	const [words, setWords] = useState<string[]>([]);
	const [typedText, setTypedText] = useState("");
	const [currentWordIndex, setCurrentWordIndex] = useState(0);
	const [currentCharIndex, setCurrentCharIndex] = useState(0);
	const [timer, setTimer] = useState(30);
	const [isActive, setIsActive] = useState(false);
	const [isFinished, setIsFinished] = useState(false);
	const [startTime, setStartTime] = useState(0);
	const [correctChars, setCorrectChars] = useState(0);
	const [totalChars, setTotalChars] = useState(0);
	const [wpm, setWpm] = useState(0);
	const [accuracy, setAccuracy] = useState(100);

	const hiddenInputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		resetTest();
	}, []);

	useEffect(() => {
		let interval: ReturnType<typeof setInterval> | null = null;

		if (isActive && timer > 0) {
			interval = setInterval(() => {
				setTimer((prevTimer) => prevTimer - 1);
			}, 1000);
		} else if (timer === 0 && isActive) {
			if (interval) clearInterval(interval);
			finishTest();
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	}, [isActive, timer]);

	useEffect(() => {
		if (isActive && !isFinished) {
			const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
			if (timeElapsed > 0) {
				const currentWpm = Math.round(correctChars / 5 / timeElapsed);
				setWpm(currentWpm);
			}
		}
	}, [isActive, correctChars, startTime, isFinished]);

	useEffect(() => {
		const focusInput = () => {
			if (hiddenInputRef.current && !isFinished) {
				hiddenInputRef.current.focus();
			}
		};

		if (containerRef.current) {
			containerRef.current.addEventListener("click", focusInput);
		}

		return () => {
			if (containerRef.current) {
				containerRef.current.removeEventListener("click", focusInput);
			}
		};
	}, [isFinished]);

	const startTest = useCallback(() => {
		if (!isActive && !isFinished) {
			setIsActive(true);
			setStartTime(Date.now());
		}
	}, [isActive, isFinished]);

	const finishTest = useCallback(() => {
		setIsActive(false);
		setIsFinished(true);

		const timeElapsed = (Date.now() - startTime) / 1000 / 60;
		const finalWpm = Math.round(
			correctChars / 5 / (timeElapsed > 0 ? timeElapsed : 0.01),
		);
		const finalAccuracy =
			totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;

		const sendData = async (wpm: number, accuracy: number) => {
			try {
				await fetch("/api/submit", {
					credentials: "include",
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ wpm, accuracy }),
				});
			} catch (error) {
				console.error(error);
			}
		};

		sendData(finalWpm, finalAccuracy);
		setWpm(finalWpm);
		setAccuracy(finalAccuracy);
	}, [startTime, correctChars, totalChars]);

	const resetTest = useCallback(() => {
		const newText = generateText();
		const newWords = newText.split(" ");

		setText(newText);
		setWords(newWords);
		setTypedText("");
		setCurrentWordIndex(0);
		setCurrentCharIndex(0);
		setTimer(30);
		setIsActive(false);
		setIsFinished(false);
		setStartTime(0);
		setCorrectChars(0);
		setTotalChars(0);
		setWpm(0);
		setAccuracy(100);

		if (hiddenInputRef.current) {
			hiddenInputRef.current.focus();
		}
	}, []);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (isFinished) return;

		if (!isActive) {
			startTest();
		}

		if (e.key === " ") {
			e.preventDefault();

			if (currentWordIndex < words.length - 1) {
				const currentWord = words[currentWordIndex];
				const typedWord = typedText.split(" ")[currentWordIndex] || "";

				let correctInWord = 0;
				for (
					let i = 0;
					i < Math.min(typedWord.length, currentWord.length);
					i++
				) {
					if (typedWord[i] === currentWord[i]) {
						correctInWord++;
					}
				}

				setCorrectChars((prev) => prev + correctInWord);
				setTotalChars((prev) => prev + currentWord.length);

				setTypedText((prev) => prev + " ");
				setCurrentWordIndex((prev) => prev + 1);
				setCurrentCharIndex(0);
			}
			return;
		}

		if (e.key === "Backspace") {
			if (typedText.length > 0) {
				if (currentCharIndex === 0 && currentWordIndex > 0) {
					const newTypedText = typedText.slice(0, -1); // Remove the space
					setTypedText(newTypedText);
					setCurrentWordIndex((prev) => prev - 1);
					const prevWord = words[currentWordIndex - 1];
					setCurrentCharIndex(prevWord.length);
				} else if (currentCharIndex > 0) {
					const newTypedText = typedText.slice(0, -1);
					setTypedText(newTypedText);
					setCurrentCharIndex((prev) => prev - 1);
				}
			}
			return;
		}

		if (e.key.length > 1) return;

		const currentWord = words[currentWordIndex];

		if (currentCharIndex < currentWord.length) {
			const newTypedText = typedText + e.key;
			setTypedText(newTypedText);
			setCurrentCharIndex((prev) => prev + 1);

			if (e.key === currentWord[currentCharIndex]) {
			}

			if (
				currentWordIndex === words.length - 1 &&
				currentCharIndex === currentWord.length - 1
			) {
				finishTest();
			}
		}
	};

	const renderWords = () => {
		return words.map((word, wordIndex) => {
			const isCurrentWord = wordIndex === currentWordIndex;

			const typedWords = typedText.split(" ");
			const typedWord = typedWords[wordIndex] || "";

			return (
				<div
					key={wordIndex}
					className={`inline-block mr-2 ${isCurrentWord ? "relative" : ""}`}
				>
					{word.split("").map((char, charIndex) => {
						let className = "text-zinc-500";

						if (wordIndex < typedWords.length) {
							if (wordIndex < currentWordIndex) {
								className =
									typedWord[charIndex] === char
										? "text-zinc-300"
										: "text-red-400";
							} else if (wordIndex === currentWordIndex) {
								if (charIndex < typedWord.length) {
									className =
										typedWord[charIndex] === char
											? "text-zinc-300"
											: "text-red-400";
								} else if (charIndex === typedWord.length && isCurrentWord) {
									className =
										"text-zinc-300 border-b-2 border-emerald-500 animate-pulse";
								} else {
									className = "text-zinc-500";
								}
							}
						}

						return (
							<span key={charIndex} className={className}>
								{char}
							</span>
						);
					})}
					{isCurrentWord && typedWord.length > word.length && (
						<span className="text-red-400">
							{typedWord
								.slice(word.length)
								.split("")
								.map((_, i) => (
									<span key={i}>•</span>
								))}
						</span>
					)}
				</div>
			);
		});
	};

	return (
		<div className="flex flex-col gap-8 max-w-4xl mx-auto w-full px-4 py-8">
			<div className="flex flex-wrap justify-between items-center gap-4">
				<div className="flex items-center gap-6">
					<div className="flex flex-col items-center">
						<div className="text-sm uppercase tracking-wider text-zinc-400 font-medium">
							wpm
						</div>
						<div className="text-2xl font-mono font-bold text-emerald-400">
							{wpm}
						</div>
					</div>
					<div className="flex flex-col items-center">
						<div className="text-sm uppercase tracking-wider text-zinc-400 font-medium">
							time
						</div>
						<div
							className={`text-2xl font-mono font-bold ${timer <= 5 ? "text-red-400" : "text-zinc-100"}`}
						>
							{timer}s
						</div>
					</div>
				</div>

				<Button
					onClick={resetTest}
					variant="ghost"
					size="icon"
					className="rounded-full h-10 w-10 transition-all hover:bg-zinc-800"
				>
					<RefreshCw className="h-5 w-5" />
					<span className="sr-only">Reset Test</span>
				</Button>
			</div>

			<div
				ref={containerRef}
				className="relative font-mono text-lg md:text-xl leading-relaxed p-8 rounded-xl bg-zinc-900 min-h-[200px] mb-4 cursor-text transition-all focus-within:ring-1 focus-within:ring-emerald-500/50"
				tabIndex={0}
			>
				<div className="max-w-3xl mx-auto whitespace-pre-wrap">
					{renderWords()}
				</div>

				<input
					ref={hiddenInputRef}
					type="text"
					className="absolute opacity-0 h-0 w-0"
					onKeyDown={handleKeyDown}
					autoFocus
					aria-label="Hidden typing input"
				/>

				{isFinished && (
					<div className="absolute inset-0 flex items-center justify-center bg-zinc-900/90 backdrop-blur-sm rounded-xl transition-all">
						<div className="bg-zinc-800 p-8 rounded-xl shadow-lg text-center max-w-md w-full">
							<h2 className="text-2xl font-bold mb-6">Test Complete!</h2>
							<div className="grid grid-cols-2 gap-6 mb-8">
								<div className="bg-zinc-700/50 p-4 rounded-lg">
									<div className="text-emerald-400 text-sm uppercase tracking-wider">
										WPM
									</div>
									<div className="text-4xl font-bold mt-1">{wpm}</div>
								</div>
								<div className="bg-zinc-700/50 p-4 rounded-lg">
									<div className="text-emerald-400 text-sm uppercase tracking-wider">
										Accuracy
									</div>
									<div className="text-4xl font-bold mt-1">{accuracy}%</div>
								</div>
							</div>
							<Button
								onClick={resetTest}
								className="w-full py-6 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
							>
								Try Again
							</Button>
						</div>
					</div>
				)}
			</div>

			<div className="text-center text-zinc-500 text-sm">
				press{" "}
				<kbd className="px-2 py-1 bg-zinc-800 rounded text-xs mx-1">space</kbd>{" "}
				to skip to next word{" "}
			</div>
		</div>
	);
}
