"use client";

import { useState, useEffect, useCallback } from "react";
import type { Match, Coupon, Bet, BetResult, CouponWithStatus } from "@/lib/types";
import { betTypeNames, betTypeOptions } from "@/lib/types";
import { evaluateBet, formatBetValue } from "@/lib/betEvaluator";

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLostCoupons, setShowLostCoupons] = useState(false);

  // Modal states
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showBetModal, setShowBetModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Form states
  const [couponName, setCouponName] = useState("");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [selectedBetType, setSelectedBetType] = useState("");
  const [selectedBetValue, setSelectedBetValue] = useState("");
  const [useNewMatch, setUseNewMatch] = useState(false);
  const [newMatchHome, setNewMatchHome] = useState("");
  const [newMatchAway, setNewMatchAway] = useState("");

  // Load data
  const loadData = useCallback(async () => {
    try {
      const [matchesRes, couponsRes] = await Promise.all([
        fetch("/api/matches"),
        fetch("/api/coupons"),
      ]);
      const matchesData = await matchesRes.json();
      const couponsData = await couponsRes.json();
      setMatches(Array.isArray(matchesData) ? matchesData : []);
      setCoupons(Array.isArray(couponsData) ? couponsData : []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Evaluate coupon status
  const evaluateCouponStatus = (coupon: Coupon): CouponWithStatus => {
    if (!coupon.bets || coupon.bets.length === 0) {
      return { ...coupon, status: "pending", wonCount: 0, totalCount: 0 };
    }

    let wonCount = 0;
    let lostCount = 0;

    for (const bet of coupon.bets) {
      const match = matches.find((m) => m.id === bet.matchId) || (bet as Bet & { match?: Match }).match;
      if (!match) continue;

      const result = evaluateBet(bet, match);
      if (result === "won") wonCount++;
      else if (result === "lost") lostCount++;
    }

    const totalCount = coupon.bets.length;
    let status: BetResult = "pending";

    if (lostCount > 0) {
      status = "lost";
    } else if (wonCount === totalCount && totalCount > 0) {
      status = "won";
    }

    return { ...coupon, status, wonCount, totalCount };
  };

  // Sort coupons
  const sortedCoupons = coupons
    .map(evaluateCouponStatus)
    .sort((a, b) => {
      const statusOrder = { won: 0, pending: 1, lost: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return b.wonCount - a.wonCount;
    });

  // Add coupon
  const handleAddCoupon = async () => {
    if (!couponName.trim()) {
      alert("Lütfen kupon adı girin");
      return;
    }

    try {
      await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: couponName }),
      });
      setCouponName("");
      setShowCouponModal(false);
      loadData();
    } catch (error) {
      console.error("Error adding coupon:", error);
    }
  };

  // Delete coupon
  const handleDeleteCoupon = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bu kuponu silmek istediğinize emin misiniz?")) return;

    try {
      await fetch(`/api/coupons/${id}`, { method: "DELETE" });
      loadData();
    } catch (error) {
      console.error("Error deleting coupon:", error);
    }
  };

  // Add match
  const handleAddMatch = async () => {
    if (!homeTeam.trim() || !awayTeam.trim()) {
      alert("Lütfen her iki takım adını da girin");
      return;
    }

    try {
      await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeTeam, awayTeam }),
      });
      setHomeTeam("");
      setAwayTeam("");
      setShowMatchModal(false);
      loadData();
    } catch (error) {
      console.error("Error adding match:", error);
    }
  };

  // Delete match
  const handleDeleteMatch = async (id: string) => {
    if (!confirm("Bu maçı silmek istediğinize emin misiniz? Maça bağlı tüm bahisler de silinecektir.")) return;

    try {
      await fetch(`/api/matches/${id}`, { method: "DELETE" });
      loadData();
    } catch (error) {
      console.error("Error deleting match:", error);
    }
  };

  // Update score
  const handleUpdateScore = async (matchId: string, field: string, value: number) => {
    const newValue = Math.max(0, value);

    // Optimistic update
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId ? { ...m, [field]: newValue } : m
      )
    );

    try {
      await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: newValue }),
      });
    } catch (error) {
      console.error("Error updating score:", error);
      loadData();
    }
  };

  // Add bet
  const handleAddBet = async () => {
    if (!selectedBetType || !selectedBetValue) {
      alert("Lütfen bahis türü ve değeri seçin");
      return;
    }

    if (useNewMatch) {
      if (!newMatchHome.trim() || !newMatchAway.trim()) {
        alert("Lütfen yeni maç için takım adlarını girin");
        return;
      }
    } else if (!selectedMatchId) {
      alert("Lütfen maç seçin veya yeni maç oluşturun");
      return;
    }

    try {
      const body: Record<string, unknown> = {
        couponId: selectedCouponId,
        betType: selectedBetType,
        betValue: selectedBetValue,
      };

      if (useNewMatch) {
        body.newMatch = { homeTeam: newMatchHome, awayTeam: newMatchAway };
      } else {
        body.matchId = selectedMatchId;
      }

      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.exists) {
        alert("Bu bahis zaten kuponda mevcut");
        return;
      }

      resetBetForm();
      setShowBetModal(false);
      loadData();
    } catch (error) {
      console.error("Error adding bet:", error);
    }
  };

  // Remove bet
  const handleRemoveBet = async (betId: string) => {
    if (!confirm("Bu bahisi kaldırmak istediğinize emin misiniz?")) return;

    try {
      await fetch(`/api/bets/${betId}`, { method: "DELETE" });
      loadData();
    } catch (error) {
      console.error("Error removing bet:", error);
    }
  };

  const resetBetForm = () => {
    setSelectedMatchId("");
    setSelectedBetType("");
    setSelectedBetValue("");
    setUseNewMatch(false);
    setNewMatchHome("");
    setNewMatchAway("");
  };

  const openBetModal = (couponId: string) => {
    setSelectedCouponId(couponId);
    resetBetForm();
    setShowDetailModal(false);
    setShowBetModal(true);
  };

  const openCouponDetail = (couponId: string) => {
    setSelectedCouponId(couponId);
    setShowDetailModal(true);
  };

  const selectedCoupon = coupons.find((c) => c.id === selectedCouponId);
  const selectedCouponWithStatus = selectedCoupon ? evaluateCouponStatus(selectedCoupon) : null;

  if (loading) {
    return (
      <div className="container">
        <div className="loading" style={{ width: "100%", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Left Panel - Coupons */}
      <div className="left-panel">
        <div className="panel-header">
          <h1>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Kuponlarım
          </h1>
          <div className="header-actions">
            <label className="toggle-lost">
              <input
                type="checkbox"
                checked={showLostCoupons}
                onChange={(e) => setShowLostCoupons(e.target.checked)}
              />
              <span>Yatan kuponları göster</span>
            </label>
            <button className="btn btn-primary" onClick={() => setShowCouponModal(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Yeni Kupon
            </button>
          </div>
        </div>

        <div className="coupons-grid">
          {sortedCoupons.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <p>Henüz kupon eklenmedi</p>
            </div>
          ) : (
            sortedCoupons.map((coupon) => {
              const isHidden = coupon.status === "lost" && !showLostCoupons;
              const statusText =
                coupon.status === "won" ? "Kazandı" :
                coupon.status === "lost" ? "Kaybetti" : "Devam Ediyor";

              return (
                <div
                  key={coupon.id}
                  className={`coupon-card status-${coupon.status} ${isHidden ? "hidden" : ""}`}
                  onClick={() => openCouponDetail(coupon.id)}
                >
                  <div className="coupon-header">
                    <span className="coupon-name">{coupon.name}</span>
                    <button
                      className="coupon-delete"
                      onClick={(e) => handleDeleteCoupon(coupon.id, e)}
                      title="Kuponu Sil"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="coupon-stats">
                    <span className={`coupon-progress ${coupon.status}`}>
                      {coupon.wonCount} / {coupon.totalCount}
                    </span>
                    <div className={`coupon-status ${coupon.status}`}>
                      <span className={`status-dot ${coupon.status}`} />
                      {statusText}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel - Matches */}
      <div className="right-panel">
        <div className="panel-header">
          <h2>Maç Kontrol Paneli</h2>
          <button className="btn btn-secondary" onClick={() => setShowMatchModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Maç Ekle
          </button>
        </div>

        <div className="matches-list">
          {matches.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <p>Henüz maç eklenmedi</p>
            </div>
          ) : (
            matches.map((match) => {
              const homeTotal = match.home1h + match.home2h;
              const awayTotal = match.away1h + match.away2h;

              return (
                <div key={match.id} className="match-card">
                  <div className="match-header">
                    <div className="match-teams">
                      {match.homeTeam}
                      <span className="match-vs">vs</span>
                      {match.awayTeam}
                    </div>
                    <button
                      className="match-delete"
                      onClick={() => handleDeleteMatch(match.id)}
                      title="Maçı Sil"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                  <div className="match-score-grid">
                    <div className="score-section">
                      <div className="score-label">İlk Yarı</div>
                      <div className="score-row">
                        <span className="score-team">{match.homeTeam.substring(0, 8)}</span>
                        <div className="score-controls">
                          <button
                            className="score-btn minus"
                            onClick={() => handleUpdateScore(match.id, "home1h", match.home1h - 1)}
                          >
                            -
                          </button>
                          <span className="score-value">{match.home1h}</span>
                          <button
                            className="score-btn plus"
                            onClick={() => handleUpdateScore(match.id, "home1h", match.home1h + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="score-row">
                        <span className="score-team">{match.awayTeam.substring(0, 8)}</span>
                        <div className="score-controls">
                          <button
                            className="score-btn minus"
                            onClick={() => handleUpdateScore(match.id, "away1h", match.away1h - 1)}
                          >
                            -
                          </button>
                          <span className="score-value">{match.away1h}</span>
                          <button
                            className="score-btn plus"
                            onClick={() => handleUpdateScore(match.id, "away1h", match.away1h + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="score-section">
                      <div className="score-label">İkinci Yarı</div>
                      <div className="score-row">
                        <span className="score-team">{match.homeTeam.substring(0, 8)}</span>
                        <div className="score-controls">
                          <button
                            className="score-btn minus"
                            onClick={() => handleUpdateScore(match.id, "home2h", match.home2h - 1)}
                          >
                            -
                          </button>
                          <span className="score-value">{match.home2h}</span>
                          <button
                            className="score-btn plus"
                            onClick={() => handleUpdateScore(match.id, "home2h", match.home2h + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="score-row">
                        <span className="score-team">{match.awayTeam.substring(0, 8)}</span>
                        <div className="score-controls">
                          <button
                            className="score-btn minus"
                            onClick={() => handleUpdateScore(match.id, "away2h", match.away2h - 1)}
                          >
                            -
                          </button>
                          <span className="score-value">{match.away2h}</span>
                          <button
                            className="score-btn plus"
                            onClick={() => handleUpdateScore(match.id, "away2h", match.away2h + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="match-total">
                    <span className="match-total-score">{homeTotal}</span>
                    <span className="match-total-vs">-</span>
                    <span className="match-total-score">{awayTotal}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Coupon Modal */}
      {showCouponModal && (
        <div className="modal-overlay" onClick={() => setShowCouponModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Yeni Kupon Oluştur</h3>
              <button className="modal-close" onClick={() => setShowCouponModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Kupon Adı</label>
                <input
                  type="text"
                  value={couponName}
                  onChange={(e) => setCouponName(e.target.value)}
                  placeholder="Örn: Akşam Kuponu"
                  onKeyDown={(e) => e.key === "Enter" && handleAddCoupon()}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCouponModal(false)}>
                İptal
              </button>
              <button className="btn btn-primary" onClick={handleAddCoupon}>
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Match Modal */}
      {showMatchModal && (
        <div className="modal-overlay" onClick={() => setShowMatchModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Yeni Maç Ekle</h3>
              <button className="modal-close" onClick={() => setShowMatchModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Ev Sahibi Takım</label>
                <input
                  type="text"
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  placeholder="Örn: Galatasaray"
                />
              </div>
              <div className="form-group">
                <label>Deplasman Takımı</label>
                <input
                  type="text"
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  placeholder="Örn: Fenerbahçe"
                  onKeyDown={(e) => e.key === "Enter" && handleAddMatch()}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowMatchModal(false)}>
                İptal
              </button>
              <button className="btn btn-primary" onClick={handleAddMatch}>
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Bet Modal */}
      {showBetModal && (
        <div className="modal-overlay" onClick={() => setShowBetModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Kupona Bahis Ekle</h3>
              <button className="modal-close" onClick={() => setShowBetModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              {/* Tabs for match selection */}
              <div className="tabs">
                <button
                  className={`tab ${!useNewMatch ? "active" : ""}`}
                  onClick={() => setUseNewMatch(false)}
                >
                  Mevcut Maç Seç
                </button>
                <button
                  className={`tab ${useNewMatch ? "active" : ""}`}
                  onClick={() => setUseNewMatch(true)}
                >
                  Yeni Maç Ekle
                </button>
              </div>

              {!useNewMatch ? (
                <div className="form-group">
                  <label>Maç Seçin</label>
                  <select
                    value={selectedMatchId}
                    onChange={(e) => setSelectedMatchId(e.target.value)}
                  >
                    <option value="">-- Maç Seçin --</option>
                    {matches.map((match) => (
                      <option key={match.id} value={match.id}>
                        {match.homeTeam} vs {match.awayTeam}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Ev Sahibi Takım</label>
                    <input
                      type="text"
                      value={newMatchHome}
                      onChange={(e) => setNewMatchHome(e.target.value)}
                      placeholder="Örn: Galatasaray"
                    />
                  </div>
                  <div className="form-group">
                    <label>Deplasman Takımı</label>
                    <input
                      type="text"
                      value={newMatchAway}
                      onChange={(e) => setNewMatchAway(e.target.value)}
                      placeholder="Örn: Fenerbahçe"
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Bahis Türü</label>
                <select
                  value={selectedBetType}
                  onChange={(e) => {
                    setSelectedBetType(e.target.value);
                    setSelectedBetValue("");
                  }}
                >
                  <option value="">-- Bahis Türü Seçin --</option>
                  <optgroup label="Maç Sonucu">
                    <option value="ms">Maç Sonucu (1/X/2)</option>
                    <option value="cs">Çifte Şans</option>
                    <option value="hms">Handikaplı Maç Sonucu</option>
                  </optgroup>
                  <optgroup label="İlk Yarı">
                    <option value="iy_ms">İlk Yarı Sonucu</option>
                    <option value="iy_ust">İlk Yarı Üst</option>
                    <option value="iy_alt">İlk Yarı Alt</option>
                    <option value="iy_kg_var">İlk Yarı KG Var</option>
                    <option value="iy_kg_yok">İlk Yarı KG Yok</option>
                  </optgroup>
                  <optgroup label="İkinci Yarı">
                    <option value="2y_ust">İkinci Yarı Üst</option>
                    <option value="2y_alt">İkinci Yarı Alt</option>
                  </optgroup>
                  <optgroup label="Toplam Gol">
                    <option value="tg_ust">Toplam Gol Üst</option>
                    <option value="tg_alt">Toplam Gol Alt</option>
                    <option value="tek_cift">Tek/Çift</option>
                  </optgroup>
                  <optgroup label="Karşılıklı Gol">
                    <option value="kg_var">Karşılıklı Gol Var</option>
                    <option value="kg_yok">Karşılıklı Gol Yok</option>
                  </optgroup>
                  <optgroup label="Takım Golleri">
                    <option value="ev_gol_var">Ev Sahibi Gol Atar</option>
                    <option value="ev_gol_yok">Ev Sahibi Gol Atmaz</option>
                    <option value="dep_gol_var">Deplasman Gol Atar</option>
                    <option value="dep_gol_yok">Deplasman Gol Atmaz</option>
                    <option value="ev_tg_ust">Ev Sahibi Gol Üst</option>
                    <option value="ev_tg_alt">Ev Sahibi Gol Alt</option>
                    <option value="dep_tg_ust">Deplasman Gol Üst</option>
                    <option value="dep_tg_alt">Deplasman Gol Alt</option>
                  </optgroup>
                  <optgroup label="Kombine">
                    <option value="iy_ms_combined">İY/MS</option>
                  </optgroup>
                </select>
              </div>

              <div className="form-group">
                <label>Bahis Değeri</label>
                <select
                  value={selectedBetValue}
                  onChange={(e) => setSelectedBetValue(e.target.value)}
                  disabled={!selectedBetType}
                >
                  <option value="">
                    {selectedBetType ? "-- Değer Seçin --" : "-- Önce bahis türü seçin --"}
                  </option>
                  {selectedBetType &&
                    betTypeOptions[selectedBetType]?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.text}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowBetModal(false)}>
                İptal
              </button>
              <button className="btn btn-primary" onClick={handleAddBet}>
                Bahis Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Detail Modal */}
      {showDetailModal && selectedCouponWithStatus && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedCouponWithStatus.name}</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              {!selectedCouponWithStatus.bets || selectedCouponWithStatus.bets.length === 0 ? (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  <p>Bu kupona henüz bahis eklenmedi</p>
                </div>
              ) : (
                <div className="coupon-detail-bets">
                  {selectedCouponWithStatus.bets.map((bet) => {
                    const match = matches.find((m) => m.id === bet.matchId) || (bet as Bet & { match?: Match }).match;
                    if (!match) return null;

                    const result = evaluateBet(bet, match);
                    const resultText =
                      result === "won" ? "Geldi" :
                      result === "lost" ? "Yattı" : "Devam";
                    const homeTotal = match.home1h + match.home2h;
                    const awayTotal = match.away1h + match.away2h;

                    return (
                      <div key={bet.id} className="bet-item">
                        <div className="bet-info">
                          <div className="bet-match">
                            {match.homeTeam} {homeTotal} - {awayTotal} {match.awayTeam}
                          </div>
                          <div className="bet-type">
                            {betTypeNames[bet.betType] || bet.betType}: {formatBetValue(bet.betType, bet.betValue)}
                          </div>
                        </div>
                        <div className="bet-status">
                          <span className={`bet-status-badge ${result}`}>{resultText}</span>
                          <button
                            className="bet-remove"
                            onClick={() => handleRemoveBet(bet.id)}
                            title="Bahisi Kaldır"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                Kapat
              </button>
              <button className="btn btn-primary" onClick={() => openBetModal(selectedCouponWithStatus.id)}>
                Bahis Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
