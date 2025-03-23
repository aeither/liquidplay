import { makeAssistantToolUI } from "@assistant-ui/react";

// biome-ignore lint/complexity/noBannedTypes: <explanation>
type ProtocolsBoostArgs = {};

type ProtocolsBoostResult = {
	protocols: Array<{
		protocol: string;
		multiplier: string;
	}>;
};

export const ProtocolsBoostToolUI = makeAssistantToolUI<
	ProtocolsBoostArgs,
	ProtocolsBoostResult
>({
	toolName: "getAllProtocolsTool",
	render: ({ status, result }) => {
		// Loading state
		if (status.type === "running") {
			return (
				<div className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-4 max-w-full">
					<div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
					{[...Array(5)].map((_, i) => (
						<div
							key={i}
							className="flex items-center justify-between mb-3 py-2 border-b border-gray-100 dark:border-gray-700"
						>
							<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
							<div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
						</div>
					))}
				</div>
			);
		}

		// Result state
		if (status.type === "complete" && result) {
			const { protocols } = result;

			if (protocols.length === 0) {
				return (
					<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
						<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
							Protocol Boosts
						</h3>
						<p className="text-gray-500 dark:text-gray-400">
							No protocol boosts found in the database.
						</p>
					</div>
				);
			}

			return (
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 max-w-md">
					<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
						Protocol Boosts
					</h3>

					<div className="space-y-3">
						{protocols.map((protocol) => {
							// Convert multiplier to a readable format
							const multiplierValue = Number.parseFloat(protocol.multiplier);
							const multiplierDisplay = (multiplierValue * 100 - 100).toFixed(
								0,
							);
							const isPositive = multiplierValue > 1;

							return (
								<div
									key={protocol.protocol}
									className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
								>
									<div className="font-medium text-gray-900 dark:text-white capitalize">
										{protocol.protocol}
									</div>
									<div
										className={`text-sm font-bold px-2 py-1 rounded ${
											isPositive
												? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
												: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
										}`}
									>
										{isPositive ? "+" : ""}
										{multiplierDisplay}%
									</div>
								</div>
							);
						})}
					</div>
				</div>
			);
		}

		// Error state
		if (status.type === "incomplete") {
			return (
				<div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4">
					<div className="flex">
						<div className="flex-shrink-0">
							{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
							<svg
								className="h-5 w-5 text-red-500"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fillRule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
						<div className="ml-3">
							<p className="text-sm text-red-700 dark:text-red-200">
								Failed to load protocol boosts: {status.reason}
							</p>
						</div>
					</div>
				</div>
			);
		}

		// Initial state
		return (
			<div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
				<p className="text-sm text-gray-500 dark:text-gray-400">
					Loading protocol boosts...
				</p>
			</div>
		);
	},
});
