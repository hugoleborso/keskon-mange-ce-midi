import { SubmitButton } from "@/components/ui/submit-button";
import * as m from "@/paraglide/messages.js";
import { signIn } from "@/server/auth";

export default function LoginPage() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
			<h1 className="text-4xl font-bold">{m.app_title()}</h1>
			<p className="text-lg text-muted-foreground">{m.login_subtitle()}</p>
			<form
				action={async () => {
					"use server";
					await signIn("google", { redirectTo: "/" });
				}}
			>
				<SubmitButton className="rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
					{m.login_with_google()}
				</SubmitButton>
			</form>
		</main>
	);
}
