export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  home1h: number;
  away1h: number;
  home2h: number;
  away2h: number;
  firstHalfFinished: boolean;
  secondHalfFinished: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Coupon {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  bets: Bet[];
}

export interface Bet {
  id: string;
  betType: string;
  betValue: string;
  couponId: string;
  matchId: string;
  match?: Match;
}

export type BetResult = "won" | "lost" | "pending";

export interface CouponWithStatus extends Coupon {
  status: BetResult;
  wonCount: number;
  totalCount: number;
}

export const betTypeNames: Record<string, string> = {
  ms: "Maç Sonucu",
  iy_ms: "İlk Yarı Sonucu",
  cs: "Çifte Şans",
  hms: "Handikaplı MS",
  tg_ust: "Toplam Gol Üst",
  tg_alt: "Toplam Gol Alt",
  iy_ust: "İY Üst",
  iy_alt: "İY Alt",
  "2y_ust": "2Y Üst",
  "2y_alt": "2Y Alt",
  kg_var: "KG Var",
  kg_yok: "KG Yok",
  iy_kg_var: "İY KG Var",
  iy_kg_yok: "İY KG Yok",
  ev_gol_var: "Ev Sahibi Gol Atar",
  ev_gol_yok: "Ev Sahibi Gol Atmaz",
  dep_gol_var: "Deplasman Gol Atar",
  dep_gol_yok: "Deplasman Gol Atmaz",
  ev_tg_ust: "Ev Sahibi Gol Üst",
  ev_tg_alt: "Ev Sahibi Gol Alt",
  dep_tg_ust: "Deplasman Gol Üst",
  dep_tg_alt: "Deplasman Gol Alt",
  iy_ms_combined: "İY/MS",
  tek_cift: "Tek/Çift",
};

export const betTypeOptions: Record<string, { value: string; text: string }[]> = {
  ms: [
    { value: "1", text: "Ev Sahibi Kazanır (1)" },
    { value: "X", text: "Beraberlik (X)" },
    { value: "2", text: "Deplasman Kazanır (2)" },
  ],
  iy_ms: [
    { value: "1", text: "Ev Sahibi Kazanır (1)" },
    { value: "X", text: "Beraberlik (X)" },
    { value: "2", text: "Deplasman Kazanır (2)" },
  ],
  cs: [
    { value: "1X", text: "1X (Ev Sahibi veya Beraberlik)" },
    { value: "12", text: "12 (Ev Sahibi veya Deplasman)" },
    { value: "X2", text: "X2 (Beraberlik veya Deplasman)" },
  ],
  hms: [
    { value: "1:-1", text: "Ev Sahibi (-1)" },
    { value: "1:-2", text: "Ev Sahibi (-2)" },
    { value: "1:+1", text: "Ev Sahibi (+1)" },
    { value: "1:+2", text: "Ev Sahibi (+2)" },
    { value: "X:-1", text: "Beraberlik (Ev -1)" },
    { value: "X:+1", text: "Beraberlik (Ev +1)" },
    { value: "2:-1", text: "Deplasman (Ev -1)" },
    { value: "2:-2", text: "Deplasman (Ev -2)" },
    { value: "2:+1", text: "Deplasman (Ev +1)" },
    { value: "2:+2", text: "Deplasman (Ev +2)" },
  ],
  tg_ust: [
    { value: "0.5", text: "0.5" },
    { value: "1.5", text: "1.5" },
    { value: "2.5", text: "2.5" },
    { value: "3.5", text: "3.5" },
    { value: "4.5", text: "4.5" },
    { value: "5.5", text: "5.5" },
  ],
  tg_alt: [
    { value: "0.5", text: "0.5" },
    { value: "1.5", text: "1.5" },
    { value: "2.5", text: "2.5" },
    { value: "3.5", text: "3.5" },
    { value: "4.5", text: "4.5" },
    { value: "5.5", text: "5.5" },
  ],
  iy_ust: [
    { value: "0.5", text: "0.5" },
    { value: "1.5", text: "1.5" },
    { value: "2.5", text: "2.5" },
  ],
  iy_alt: [
    { value: "0.5", text: "0.5" },
    { value: "1.5", text: "1.5" },
    { value: "2.5", text: "2.5" },
  ],
  "2y_ust": [
    { value: "0.5", text: "0.5" },
    { value: "1.5", text: "1.5" },
    { value: "2.5", text: "2.5" },
  ],
  "2y_alt": [
    { value: "0.5", text: "0.5" },
    { value: "1.5", text: "1.5" },
    { value: "2.5", text: "2.5" },
  ],
  kg_var: [{ value: "var", text: "Karşılıklı Gol Var" }],
  kg_yok: [{ value: "yok", text: "Karşılıklı Gol Yok" }],
  iy_kg_var: [{ value: "var", text: "İlk Yarı KG Var" }],
  iy_kg_yok: [{ value: "yok", text: "İlk Yarı KG Yok" }],
  ev_gol_var: [{ value: "var", text: "Ev Sahibi Gol Atar" }],
  ev_gol_yok: [{ value: "yok", text: "Ev Sahibi Gol Atmaz" }],
  dep_gol_var: [{ value: "var", text: "Deplasman Gol Atar" }],
  dep_gol_yok: [{ value: "yok", text: "Deplasman Gol Atmaz" }],
  ev_tg_ust: [
    { value: "0.5", text: "0.5" },
    { value: "1.5", text: "1.5" },
    { value: "2.5", text: "2.5" },
  ],
  ev_tg_alt: [
    { value: "0.5", text: "0.5" },
    { value: "1.5", text: "1.5" },
    { value: "2.5", text: "2.5" },
  ],
  dep_tg_ust: [
    { value: "0.5", text: "0.5" },
    { value: "1.5", text: "1.5" },
    { value: "2.5", text: "2.5" },
  ],
  dep_tg_alt: [
    { value: "0.5", text: "0.5" },
    { value: "1.5", text: "1.5" },
    { value: "2.5", text: "2.5" },
  ],
  iy_ms_combined: [
    { value: "1/1", text: "1/1" },
    { value: "1/X", text: "1/X" },
    { value: "1/2", text: "1/2" },
    { value: "X/1", text: "X/1" },
    { value: "X/X", text: "X/X" },
    { value: "X/2", text: "X/2" },
    { value: "2/1", text: "2/1" },
    { value: "2/X", text: "2/X" },
    { value: "2/2", text: "2/2" },
  ],
  tek_cift: [
    { value: "tek", text: "Tek" },
    { value: "cift", text: "Çift" },
  ],
};
