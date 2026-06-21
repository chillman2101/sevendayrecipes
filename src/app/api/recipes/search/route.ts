import { NextResponse } from "next/server";
import { searchRecipesByTags } from "@/lib/recipes";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tagsParam = searchParams.get("tags") ?? "";
  const matchMode = (searchParams.get("matchMode") as "all" | "partial") ?? "partial";
  const tags = tagsParam.split(",").map((t) => t.trim()).filter(Boolean);

  if (tags.length === 0) {
    return NextResponse.json({ recipes: [] });
  }

  const recipes = searchRecipesByTags(tags, matchMode, 0.5, 50);
  return NextResponse.json({ recipes });
}
