import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        bets: {
          include: {
            match: true,
          },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json(coupon);
  } catch (error) {
    console.error("Error fetching coupon:", error);
    return NextResponse.json({ error: "Failed to fetch coupon" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
