import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { homeTeam, awayTeam } = body;

    if (!homeTeam || !awayTeam) {
      return NextResponse.json({ error: "Home and away team names are required" }, { status: 400 });
    }

    const match = await prisma.match.create({
      data: {
        homeTeam,
        awayTeam,
      },
    });

    return NextResponse.json(match);
  } catch (error) {
    console.error("Error creating match:", error);
    return NextResponse.json({ error: "Failed to create match" }, { status: 500 });
  }
}
