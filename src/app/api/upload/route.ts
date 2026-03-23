import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
	}

	const formData = await request.formData();
	const file = formData.get("file") as File | null;

	if (!file) {
		return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
	}

	if (!ALLOWED_TYPES.includes(file.type)) {
		return NextResponse.json(
			{ error: "Format non supporte (JPEG, PNG, WebP uniquement)" },
			{ status: 400 },
		);
	}

	if (file.size > MAX_SIZE) {
		return NextResponse.json({ error: "Fichier trop volumineux (5 Mo max)" }, { status: 400 });
	}

	try {
		// Dynamic import to avoid build errors when @vercel/blob is not configured
		const { put } = await import("@vercel/blob");
		const blob = await put(`reviews/${session.user.id}/${Date.now()}-${file.name}`, file, {
			access: "public",
		});

		return NextResponse.json({ url: blob.url });
	} catch {
		return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
	}
}
