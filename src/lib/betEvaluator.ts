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

  // Yarı durumları
  const isFirstHalfFinished = match.firstHalfFinished;
  const isMatchFinished = match.secondHalfFinished;

  switch (betType) {
    // ==================== MAÇ SONUCU BAHİSLERİ ====================
    // Bu bahisler sadece maç bitince (secondHalfFinished) kesinleşir
    case "ms":
      if (betValue === "1") {
        if (homeTotal > awayTotal) {
          return isMatchFinished ? "won" : "pending";
        }
        // Maç bitmeden kaybetmiş sayılmaz - skor değişebilir
        if (isMatchFinished) return "lost";
        return "pending";
      }
      if (betValue === "X") {
        if (homeTotal === awayTotal) {
          return isMatchFinished ? "won" : "pending";
        }
        // Skor eşit değilse ama maç bitmediyse hala şans var
        if (isMatchFinished) return "lost";
        return "pending";
      }
      if (betValue === "2") {
        if (awayTotal > homeTotal) {
          return isMatchFinished ? "won" : "pending";
        }
        // Maç bitmeden kaybetmiş sayılmaz
        if (isMatchFinished) return "lost";
        return "pending";
      }
      break;

    // ==================== İLK YARI BAHİSLERİ ====================
    // Bu bahisler sadece ilk yarı bitince (firstHalfFinished) kesinleşir
    case "iy_ms":
      if (betValue === "1") {
        if (home1h > away1h) {
          return isFirstHalfFinished ? "won" : "pending";
        }
        if (isFirstHalfFinished) return "lost";
        return "pending";
      }
      if (betValue === "X") {
        if (home1h === away1h) {
          return isFirstHalfFinished ? "won" : "pending";
        }
        if (isFirstHalfFinished) return "lost";
        return "pending";
      }
      if (betValue === "2") {
        if (away1h > home1h) {
          return isFirstHalfFinished ? "won" : "pending";
        }
        if (isFirstHalfFinished) return "lost";
        return "pending";
      }
      break;

    // ÜST bahisleri: Koşul sağlandığında ANINDA kazanır (gol azalmaz!)
    case "iy_ust": {
      const limit = parseFloat(betValue);
      // Limit aşıldıysa ANINDA kazandı - yarı bitmesini beklemeye gerek yok
      if (total1h > limit) {
        return "won";
      }
      // İlk yarı bittiyse ve limit aşılmadıysa kaybetti
      if (isFirstHalfFinished) return "lost";
      return "pending";
    }

    // ALT bahisleri: Limit'e ulaşıldığında ANINDA kaybeder
    case "iy_alt": {
      const limit = parseFloat(betValue);
      // Limit'e ulaştıysa ANINDA kaybetti
      if (total1h >= limit) return "lost";
      // İlk yarı bittiyse ve limit aşılmadıysa kazandı
      if (isFirstHalfFinished) return "won";
      return "pending";
    }

    // KG VAR: Her iki takım da gol atarsa ANINDA kazanır
    case "iy_kg_var":
      if (home1h > 0 && away1h > 0) {
        return "won";
      }
      if (isFirstHalfFinished) return "lost";
      return "pending";

    // KG YOK: Bir takım gol atınca hala şans var, her iki takım da atarsa kaybeder
    case "iy_kg_yok":
      if (home1h > 0 && away1h > 0) return "lost";
      if (isFirstHalfFinished) return "won";
      return "pending";

    // ==================== İKİNCİ YARI BAHİSLERİ ====================
    case "2y_ust": {
      const limit = parseFloat(betValue);
      // Limit aşıldıysa ANINDA kazandı
      if (total2h > limit) {
        return "won";
      }
      if (isMatchFinished) return "lost";
      return "pending";
    }

    case "2y_alt": {
      const limit = parseFloat(betValue);
      // Limit'e ulaştıysa ANINDA kaybetti
      if (total2h >= limit) return "lost";
      if (isMatchFinished) return "won";
      return "pending";
    }

    // ==================== TOPLAM GOL BAHİSLERİ ====================
    case "tg_ust": {
      const limit = parseFloat(betValue);
      // Limit aşıldıysa ANINDA kazandı - gol sayısı azalmaz!
      if (totalGoals > limit) {
        return "won";
      }
      if (isMatchFinished) return "lost";
      return "pending";
    }

    case "tg_alt": {
      const limit = parseFloat(betValue);
      // Limit'e ulaştıysa ANINDA kaybetti
      if (totalGoals >= limit) return "lost";
      if (isMatchFinished) return "won";
      return "pending";
    }

    case "tek_cift":
      if (betValue === "tek") {
        if (totalGoals % 2 === 1) {
          return isMatchFinished ? "won" : "pending";
        }
        if (isMatchFinished) return "lost";
        return "pending";
      }
      if (betValue === "cift") {
        if (totalGoals % 2 === 0) {
          return isMatchFinished ? "won" : "pending";
        }
        if (isMatchFinished) return "lost";
        return "pending";
      }
      break;

    // ==================== KARŞILIKLI GOL BAHİSLERİ ====================
    case "kg_var":
      // Her iki takım da gol attıysa ANINDA kazandı
      if (homeTotal > 0 && awayTotal > 0) {
        return "won";
      }
      if (isMatchFinished) return "lost";
      return "pending";

    case "kg_yok":
      // Her iki takım da gol attıysa ANINDA kaybetti
      if (homeTotal > 0 && awayTotal > 0) return "lost";
      if (isMatchFinished) return "won";
      return "pending";

    // ==================== TAKIM GOL BAHİSLERİ ====================
    case "ev_gol_var":
      // Ev sahibi gol attıysa ANINDA kazandı
      if (homeTotal > 0) {
        return "won";
      }
      if (isMatchFinished) return "lost";
      return "pending";

    case "ev_gol_yok":
      // Ev sahibi gol attıysa ANINDA kaybetti
      if (homeTotal > 0) return "lost";
      if (isMatchFinished) return "won";
      return "pending";

    case "dep_gol_var":
      // Deplasman gol attıysa ANINDA kazandı
      if (awayTotal > 0) {
        return "won";
      }
      if (isMatchFinished) return "lost";
      return "pending";

    case "dep_gol_yok":
      // Deplasman gol attıysa ANINDA kaybetti
      if (awayTotal > 0) return "lost";
      if (isMatchFinished) return "won";
      return "pending";

    case "ev_tg_ust": {
      const limit = parseFloat(betValue);
      // Limit aşıldıysa ANINDA kazandı
      if (homeTotal > limit) {
        return "won";
      }
      if (isMatchFinished) return "lost";
      return "pending";
    }

    case "ev_tg_alt": {
      const limit = parseFloat(betValue);
      // Limit'e ulaştıysa ANINDA kaybetti
      if (homeTotal >= limit) return "lost";
      if (isMatchFinished) return "won";
      return "pending";
    }

    case "dep_tg_ust": {
      const limit = parseFloat(betValue);
      // Limit aşıldıysa ANINDA kazandı
      if (awayTotal > limit) {
        return "won";
      }
      if (isMatchFinished) return "lost";
      return "pending";
    }

    case "dep_tg_alt": {
      const limit = parseFloat(betValue);
      // Limit'e ulaştıysa ANINDA kaybetti
      if (awayTotal >= limit) return "lost";
      if (isMatchFinished) return "won";
      return "pending";
    }

    // ==================== ÇİFTE ŞANS BAHİSLERİ ====================
    case "cs":
      if (betValue === "1X") {
        // Ev sahibi kazanır veya beraberlik
        if (homeTotal >= awayTotal) {
          return isMatchFinished ? "won" : "pending";
        }
        // Deplasman öndeyse bile maç bitmeden kaybetmiş sayılmaz
        if (isMatchFinished) return "lost";
        return "pending";
      }
      if (betValue === "12") {
        // Ev sahibi veya deplasman kazanır (beraberlik hariç)
        if (homeTotal !== awayTotal) {
          return isMatchFinished ? "won" : "pending";
        }
        if (isMatchFinished) return "lost";
        return "pending";
      }
      if (betValue === "X2") {
        // Beraberlik veya deplasman kazanır
        if (awayTotal >= homeTotal) {
          return isMatchFinished ? "won" : "pending";
        }
        // Ev sahibi öndeyse bile maç bitmeden kaybetmiş sayılmaz
        if (isMatchFinished) return "lost";
        return "pending";
      }
      break;

    // ==================== HANDİKAPLI MAÇ SONUCU ====================
    case "hms": {
      const parts = betValue.split(":");
      const selection = parts[0];
      const handicap = parseFloat(parts[1]);
      const adjustedHome = homeTotal + handicap;

      if (selection === "1") {
        if (adjustedHome > awayTotal) {
          return isMatchFinished ? "won" : "pending";
        }
        // Maç bitmeden kaybetmiş sayılmaz
        if (isMatchFinished) return "lost";
        return "pending";
      }
      if (selection === "X") {
        if (adjustedHome === awayTotal) {
          return isMatchFinished ? "won" : "pending";
        }
        if (isMatchFinished) return "lost";
        return "pending";
      }
      if (selection === "2") {
        if (awayTotal > adjustedHome) {
          return isMatchFinished ? "won" : "pending";
        }
        // Maç bitmeden kaybetmiş sayılmaz
        if (isMatchFinished) return "lost";
        return "pending";
      }
      break;
    }

    // ==================== İY/MS KOMBİNE ====================
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

      // İlk yarı bitti ve İY uyuşmuyorsa kaybetti
      if (isFirstHalfFinished && iyActual !== iyResult) return "lost";

      // Her ikisi de uyuşuyorsa ve maç bittiyse kazandı
      if (iyActual === iyResult && msActual === msResult) {
        return isMatchFinished ? "won" : "pending";
      }

      // Maç bittiyse ama uyuşmuyorsa kaybetti
      if (isMatchFinished) return "lost";

      return "pending";
    }
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
