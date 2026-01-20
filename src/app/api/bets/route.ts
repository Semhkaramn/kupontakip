import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { couponId, matchId, betType, betValue, newMatch } = body;

    if (!couponId || !betType || !betValue) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let finalMatchId = matchId;

    // Eğer yeni maç bilgisi geldiyse, önce maçı oluştur
    if (newMatch && newMatch.homeTeam && newMatch.awayTeam) {
      const match = await prisma.match.create({
        data: {
          homeTeam: newMatch.homeTeam,
          awayTeam: newMatch.awayTeam,
        },
      });
      finalMatchId = match.id;
    }

    if (!finalMatchId) {
      return NextResponse.json({ error: "Match ID or new match data is required" }, { status: 400 });
    }

    // Aynı bahis var mı kontrol et
    const existingBet = await prisma.bet.findUnique({
      where: {
        couponId_matchId_betType_betValue: {
          couponId,
          matchId: finalMatchId,
          betType,
          betValue,
        },
      },
    });

    if (existingBet) {
      return NextResponse.json({ error: "Bu bahis zaten kuponda mevcut", exists: true }, { status: 400 });
    }

    const bet = await prisma.bet.create({
      data: {
        couponId,
        matchId: finalMatchId,
        betType,
        betValue,
      },
      include: {
        match: true,
      },
    });

    return NextResponse.json(bet);
  } catch (error) {
    console.error("Error creating bet:", error);
    return NextResponse.json({ error: "Failed to create bet" }, { status: 500 });
  }
}
