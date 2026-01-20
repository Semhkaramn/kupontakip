import type { Match, Bet, BetResult } from "./types";

export function evaluateBet(bet: Bet, match: Match): BetResult {
  const home1h = match.home1h;
  const away1h = match.away1h;
  const home2h = match.home2h;
  const away2h = match.away2h;

  const homeTotal = home1h + home2h;
  const awayTotal = away1h + away2h;
  const totalGoals = homeTotal + awayTotal;
  const total1h = home1h + away1h;
  const total2h = home2h + away2h;

  const betType = bet.betType;
  const betValue = bet.betValue;

  switch (betType) {
    case "ms":
      if (betValue === "1") {
        if (homeTotal > awayTotal) return "won";
        if (homeTotal < awayTotal) return "lost";
        return "pending";
      }
      if (betValue === "X") {
        if (homeTotal === awayTotal && totalGoals > 0) return "won";
        return "pending";
      }
      if (betValue === "2") {
        if (awayTotal > homeTotal) return "won";
        if (awayTotal < homeTotal) return "lost";
        return "pending";
      }
      break;

    case "iy_ms":
      if (betValue === "1") {
        if (home1h > away1h) return "won";
        if (home1h < away1h) return "lost";
        return "pending";
      }
      if (betValue === "X") {
        if (home1h === away1h && total1h > 0) return "won";
        return "pending";
      }
      if (betValue === "2") {
        if (away1h > home1h) return "won";
        if (away1h < home1h) return "lost";
        return "pending";
      }
      break;

    case "tg_ust": {
      const limit = parseFloat(betValue);
      if (totalGoals > limit) return "won";
      return "pending";
    }

    case "tg_alt": {
      const limit = parseFloat(betValue);
      if (totalGoals < limit) return "won";
      if (totalGoals > limit) return "lost";
      return "pending";
    }

    case "iy_ust": {
      const limit = parseFloat(betValue);
      if (total1h > limit) return "won";
      return "pending";
    }

    case "iy_alt": {
      const limit = parseFloat(betValue);
      if (total1h < limit) return "won";
      if (total1h > limit) return "lost";
      return "pending";
    }

    case "2y_ust": {
      const limit = parseFloat(betValue);
      if (total2h > limit) return "won";
      return "pending";
    }

    case "2y_alt": {
      const limit = parseFloat(betValue);
      if (total2h < limit) return "won";
      if (total2h > limit) return "lost";
      return "pending";
    }

    case "kg_var":
      if (homeTotal > 0 && awayTotal > 0) return "won";
      return "pending";

    case "kg_yok":
      if (homeTotal > 0 && awayTotal > 0) return "lost";
      if (homeTotal === 0 || awayTotal === 0) return "won";
      return "pending";

    case "iy_kg_var":
      if (home1h > 0 && away1h > 0) return "won";
      return "pending";

    case "iy_kg_yok":
      if (home1h > 0 && away1h > 0) return "lost";
      if (home1h === 0 || away1h === 0) return "won";
      return "pending";

    case "ev_gol_var":
      if (homeTotal > 0) return "won";
      return "pending";

    case "ev_gol_yok":
      if (homeTotal > 0) return "lost";
      return "pending";

    case "dep_gol_var":
      if (awayTotal > 0) return "won";
      return "pending";

    case "dep_gol_yok":
      if (awayTotal > 0) return "lost";
      return "pending";

    case "cs":
      if (betValue === "1X") {
        if (homeTotal >= awayTotal) return "won";
        if (homeTotal < awayTotal) return "lost";
      }
      if (betValue === "12") {
        if (homeTotal !== awayTotal) return "won";
        return "pending";
      }
      if (betValue === "X2") {
        if (awayTotal >= homeTotal) return "won";
        if (awayTotal < homeTotal) return "lost";
      }
      break;

    case "hms": {
      const parts = betValue.split(":");
      const selection = parts[0];
      const handicap = parseFloat(parts[1]);
      const adjustedHome = homeTotal + handicap;

      if (selection === "1") {
        if (adjustedHome > awayTotal) return "won";
        if (adjustedHome < awayTotal) return "lost";
        return "pending";
      }
      if (selection === "X") {
        if (adjustedHome === awayTotal) return "won";
        return "pending";
      }
      if (selection === "2") {
        if (awayTotal > adjustedHome) return "won";
        if (awayTotal < adjustedHome) return "lost";
        return "pending";
      }
      break;
    }

    case "ev_tg_ust": {
      const limit = parseFloat(betValue);
      if (homeTotal > limit) return "won";
      return "pending";
    }

    case "ev_tg_alt": {
      const limit = parseFloat(betValue);
      if (homeTotal < limit) return "won";
      if (homeTotal > limit) return "lost";
      return "pending";
    }

    case "dep_tg_ust": {
      const limit = parseFloat(betValue);
      if (awayTotal > limit) return "won";
      return "pending";
    }

    case "dep_tg_alt": {
      const limit = parseFloat(betValue);
      if (awayTotal < limit) return "won";
      if (awayTotal > limit) return "lost";
      return "pending";
    }

    case "iy_ms_combined": {
      const parts = betValue.split("/");
      const iyResult = parts[0];
      const msResult = parts[1];

      let iyActual = "";
      if (home1h > away1h) iyActual = "1";
      else if (home1h < away1h) iyActual = "2";
      else iyActual = "X";

      let msActual = "";
      if (homeTotal > awayTotal) msActual = "1";
      else if (homeTotal < awayTotal) msActual = "2";
      else msActual = "X";

      if (iyActual === iyResult && msActual === msResult) return "won";
      // Eğer İY veya MS farklıysa ve değişme ihtimali yoksa lost
      if (iyActual !== iyResult) return "lost";
      return "pending";
    }

    case "tek_cift":
      if (betValue === "tek") {
        if (totalGoals % 2 === 1) return "won";
        return "pending";
      }
      if (totalGoals % 2 === 0 && totalGoals > 0) return "won";
      return "pending";
  }

  return "pending";
}

export function formatBetValue(betType: string, betValue: string): string {
  switch (betType) {
    case "ms":
    case "iy_ms":
      return betValue === "1" ? "Ev Sahibi" : betValue === "X" ? "Beraberlik" : "Deplasman";
    case "cs":
      return betValue;
    case "hms": {
      const parts = betValue.split(":");
      const sel = parts[0] === "1" ? "Ev Sahibi" : parts[0] === "X" ? "Beraberlik" : "Deplasman";
      return `${sel} (${parts[1]})`;
    }
    case "tek_cift":
      return betValue === "tek" ? "Tek" : "Çift";
    case "iy_ms_combined":
      return betValue;
    default:
      return betValue;
  }
}
