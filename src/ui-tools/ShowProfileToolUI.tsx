import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { makeAssistantToolUI } from "@assistant-ui/react";
import Link from "next/link";

type ShowProfileArgs = {
	query: string;
};

type ShowProfileResult = {
	title: string;
	description: string;
	url: string;
};

export const ShowProfileToolUI = makeAssistantToolUI<
	ShowProfileArgs,
	ShowProfileResult
>({
	toolName: "showProfileTool",
	render: ({ args, status, result, argsText, toolCallId, toolName }) => {
		console.log("argsText", argsText);
		console.log("status", status);
		console.log("result", result);
		console.log("toolName", toolName);
		// Loading state
		if (status.type === "running") {
			return (
				<div className="flex items-center space-x-2 p-2">
					<div className="animate-pulse h-10 w-10 rounded-full bg-gray-200" />
					<div className="space-y-2 flex-1">
						<div className="animate-pulse h-4 w-3/4 bg-gray-200 rounded" />
						<div className="animate-pulse h-3 w-1/2 bg-gray-200 rounded" />
					</div>
				</div>
			);
		}

		// Result state
		if (status.type === "complete" && result) {
			const { title, description, url } = result;
			// Extract first letter for avatar fallback
			const fallbackInitial = title.charAt(0).toUpperCase();

			return (
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 max-w-md">
					<div className="flex items-start space-x-4">
						<Avatar className="h-12 w-12">
							<AvatarFallback className="bg-blue-100 text-blue-800">
								{fallbackInitial}
							</AvatarFallback>
						</Avatar>

						<div className="flex-1 min-w-0">
							<h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
								{title}
							</h3>
							<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
								{description}
							</p>
							<Link
								href={url}
								className="text-blue-600 hover:underline text-sm mt-2 inline-block"
								target="_blank"
								rel="noopener noreferrer"
							>
								View Profile
							</Link>
						</div>
					</div>
				</div>
			);
		}

		// Initial or error state
		return (
			<div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
				<p className="text-sm text-gray-500 dark:text-gray-400">
					{status.type === "incomplete"
						? `Error fetching profile: ${status.reason}`
						: `Searching for profile: ${args.query}...`}
				</p>
			</div>
		);
	},
});
