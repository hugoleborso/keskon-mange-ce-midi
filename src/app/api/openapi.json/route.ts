import { NextResponse } from "next/server";
import { generateOpenAPISpec } from "@/lib/openapi-spec";

export async function GET() {
	const spec = generateOpenAPISpec();
	return NextResponse.json(spec);
}
