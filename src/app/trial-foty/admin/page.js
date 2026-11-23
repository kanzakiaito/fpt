"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import DiscordMarkdown from "@/app/components/DiscordMarkdown";
import AdminUserMenu from "@/app/components/admin/AdminUserMenu";
import AdminLoginScreen from "@/app/components/admin/AdminLoginScreen";
import AdminUserManagement from "@/app/components/admin/AdminUserManagement";
import { useAdminSession } from "@/lib/useAdminSession";

function getOptimizedImageUrl(src, targetSize = 120) {
  if (!src || typeof src !== "string") return "";
  let s = src.trim();
  if (s.startsWith("http://")) s = s.replace("http://", "https://");
  if (s.includes("?authuser=")) s = s.split("?authuser=")[0];
  if (s.includes("googleusercontent.com") && s.includes("=")) {
    const base = s.split("=")[0];
    return `${base}=s${Math.min(Math.max(targetSize, 80), 600)}-c`;
  }
  return s;
}

function AdminPhotoPreview({ src, name, size = 36 }) {
  const [err, setErr] = useState(false);
  useEffect(() => {
    setErr(false);
  }, [src]);
  let clean = (src || "").trim().split("?authuser=")[0];
  if (clean.startsWith("http://")) {
    clean = clean.replace("http://", "https://");
  }
  if (clean.includes("googleusercontent.com") && clean.includes("=")) {
    clean = `${clean.split("=")[0]}=s${Math.min(Math.max(size * 2, 72), 300)}-c`;
  }
  if (!clean || err) {
    return <span style={{ fontSize: `${Math.round(size * 0.42)}px`, opacity: 0.6 }}>👤</span>;
  }
  return (
    <img
      key={clean}
      src={clean}
      alt={name || ""}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setErr(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}

export default function TrialAdminPage() {
  const [contestants, setContestants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("scoring"); // 'scoring' | 'contestants' | 'settings'
  const [toast, setToast] = useState(null); // { message, type }

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // ── Scoring Session States ──────────────────────────────────────────────────
  const [selectedContestantId, setSelectedContestantId] = useState("");
  const [activeContestant, setActiveContestant] = useState(null);
  const [activeScores, setActiveScores] = useState({
    "3sec": "",
    qa: "",
    jigsaw: "",
    attribute: "",
  });
  const [orderInput, setOrderInput] = useState("");
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [scoringNotice, setScoringNotice] = useState("");

  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const dropdownRef = useRef(null);

  // ── Contestants Tab States ──────────────────────────────────────────────────
  const [contestantSearch, setContestantSearch] = useState("");
  const [contestantFilter, setContestantFilter] = useState("all"); // 'all' | 'withPhoto' | 'noPhoto' | 'hasScores'
  const [quickPhotos, setQuickPhotos] = useState({});
  const [savingQuickPhotoId, setSavingQuickPhotoId] = useState(null);

  // Modal States
  const [showContestantModal, setShowContestantModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' | 'edit'
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    nickname: "",
    topic: "",
    image: "",
    order: "",
  });

  const [showResetModal, setShowResetModal] = useState(false);

  // ── Authentication States ───────────────────────────────────────────────────
  const {
    isAuthenticated,
    setIsAuthenticated,
    authChecking,
    user,
    token,
    noAccessInfo,
    handleLoginSuccess,
    handleLogout: handleAdminLogout,
  } = useAdminSession("trial_foty");
  const isMaintainer = user?.role === "maintainer";
  const [trialAdminPassConfig, setTrialAdminPassConfig] = useState("trial_admin_2026");
  const [savingPassConfig, setSavingPassConfig] = useState(false);

  // ── Poll Tab States ────────────────────────────────────────────────────────
  const [pollItems, setPollItems] = useState([]);
  const [savingPoll, setSavingPoll] = useState(false);
  const [pollNotice, setPollNotice] = useState("");
  const [votingOpen, setVotingOpen] = useState(true);
  const [togglingVoting, setTogglingVoting] = useState(false);
  const [showWarmupTable, setShowWarmupTable] = useState(true);
  const [togglingWarmupTable, setTogglingWarmupTable] = useState(false);
  const [showPollTable, setShowPollTable] = useState(true);
  const [togglingPollTable, setTogglingPollTable] = useState(false);
  const [showMainPollTable, setShowMainPollTable] = useState(true);
  const [togglingMainPollTable, setTogglingMainPollTable] = useState(false);
  const [hideTrialPollScores, setHideTrialPollScores] = useState(true);
  const [togglingHideScores, setTogglingHideScores] = useState(false);
  const [syncingGameScores, setSyncingGameScores] = useState(false);
  const [trialSubtitle, setTrialSubtitle] = useState(
    "ศึกประลองความรู้แฟนพันธุ์แท้ฉบับทดสอบ (Trial Edition) คำนวณแบบ Dense Ranking พร้อมระบบโควตาตัดตัว 5 อันดับแรก"
  );
  const [savingSubtitle, setSavingSubtitle] = useState(false);

  // Poll Candidate Profile & Video Modal States
  const [editingPollCandidate, setEditingPollCandidate] = useState(null);
  const [pollCandidateForm, setPollCandidateForm] = useState({
    id: "",
    name: "",
    nickname: "",
    topic: "",
    description: "",
    videoUrl: "",
    scores: { "3sec": "", qa: "", jigsaw: "", attribute: "" },
    whatIfScore: "",
    warmupSchedule: "",
  });
  const [savingCandidateDetails, setSavingCandidateDetails] = useState(false);

  // ── Trial Info & Staff Q&A States ─────────────────────────────────────────
  const [infoKeywords, setInfoKeywords] = useState([]);
  const [infoQaBoard, setInfoQaBoard] = useState([]);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [keywordAdminSearch, setKeywordAdminSearch] = useState("");
  const [savingKeywordId, setSavingKeywordId] = useState(null);
  const [savingAllKeywords, setSavingAllKeywords] = useState(false);

  // Staff Q&A Form States
  const [qaForm, setQaForm] = useState({
    id: null,
    contestantId: "",
    category: "คำถาม-คำตอบ",
    question: "",
    answer: "",
  });
  const [qaContestantSearch, setQaContestantSearch] = useState("");
  const [showQaDropdown, setShowQaDropdown] = useState(false);
  const [savingQa, setSavingQa] = useState(false);
  const [deletingQaId, setDeletingQaId] = useState(null);
  const [qaCategoryFilter, setQaCategoryFilter] = useState("all");
  const [qaAdminSearch, setQaAdminSearch] = useState("");

  const fetchTrialInfo = async (roster = contestants) => {
    try {
      setLoadingInfo(true);
      const res = await fetch("/api/trial-info", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const mergedKeywords = (json.keywords || []).map((k) => {
            let targetId = String(k.id);
            if (k.name?.trim() === "ณัฐกมล มานะดี") {
              targetId = "40";
            }
            const matched = (roster || []).find(
              (c) =>
                (c.id && String(c.id) === targetId) ||
                (c.name && k.name && c.name.trim() === k.name.trim())
            );
            return {
              ...k,
              id: targetId,
              image: matched?.image || k.image || "",
            };
          });
          setInfoKeywords(mergedKeywords);
          setInfoQaBoard(json.qaBoard || []);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch trial info:", e);
    } finally {
      setLoadingInfo(false);
    }
  };

  // Fetch contestants from API
  const fetchContestants = async () => {
    try {
      setLoading(true);
      const [resTrial, resPoll, resInfo] = await Promise.all([
        fetch(`/api/trial?t=${Date.now()}`, { cache: "no-store" }),
        fetch(`/api/trial-poll?admin=1&t=${Date.now()}`, { cache: "no-store" }),
        fetch(`/api/trial-info?t=${Date.now()}`, { cache: "no-store" }),
      ]);
      let roster = [];
      if (resTrial.ok) {
        const json = await resTrial.json();
        if (json.success && Array.isArray(json.data)) {
          roster = json.data;
          setContestants(roster);
        }
      }
      if (resPoll.ok) {
        const jsonPoll = await resPoll.json();
        if (jsonPoll.success && Array.isArray(jsonPoll.data)) {
          // Merge latest photos from roster so poll items always have photos
          const mergedPoll = jsonPoll.data.map((item) => {
            const matched = roster.find(
              (c) =>
                (c.id && item.id && String(c.id) === String(item.id)) ||
                (c.name && item.name && c.name.trim() === item.name.trim()) ||
                (c.nickname && item.nickname && c.nickname.trim() === item.nickname.trim())
            );
            return {
              ...item,
              image: (matched && matched.image) ? matched.image : (item.image || ""),
              warmupSchedule: item.warmupSchedule || matched?.warmupSchedule || "",
              description: item.description || matched?.description || "",
              videoUrl: item.videoUrl || matched?.videoUrl || "",
              scores: item.scores || matched?.scores || item.gameScores || null,
            };
          });
          setPollItems(mergedPoll);
        }
        if (jsonPoll.votingOpen !== undefined) {
          setVotingOpen(Boolean(jsonPoll.votingOpen));
        }
        if (jsonPoll.showWarmupTable !== undefined) {
          setShowWarmupTable(Boolean(jsonPoll.showWarmupTable));
        }
        if (jsonPoll.showTrialPollTable !== undefined) {
          setShowPollTable(Boolean(jsonPoll.showTrialPollTable));
        } else if (jsonPoll.showPollTable !== undefined) {
          setShowPollTable(Boolean(jsonPoll.showPollTable));
        }
        if (jsonPoll.hideTrialPollScoresDuringVote !== undefined) {
          setHideTrialPollScores(Boolean(jsonPoll.hideTrialPollScoresDuringVote));
        }
        if (jsonPoll.trialSubtitle) {
          setTrialSubtitle(jsonPoll.trialSubtitle);
        }
      }
      if (resInfo.ok) {
        const jsonInfo = await resInfo.json();
        if (jsonInfo.success) {
          const mergedKeywords = (jsonInfo.keywords || []).map((k) => {
            let targetId = String(k.id);
            if (k.name?.trim() === "ณัฐกมล มานะดี") {
              targetId = "40";
            }
            const matched = roster.find(
              (c) =>
                (c.id && String(c.id) === targetId) ||
                (c.name && k.name && c.name.trim() === k.name.trim())
            );
            return {
              ...k,
              id: targetId,
              image: matched?.image || k.image || "",
            };
          });
          setInfoKeywords(mergedKeywords);
          setInfoQaBoard(jsonInfo.qaBoard || []);
        }
      }
    } catch {
      showToast("ไม่สามารถโหลดข้อมูลผู้เข้าแข่งขันได้", "error");
    } finally {
      setLoading(false);
    }
  };

  // Poll handlers
  const handlePollFieldChange = (index, field, value) => {
    setPollItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleMovePoll = (index, delta) => {
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= pollItems.length) return;
    setPollItems((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated.map((item, idx) => ({ ...item, pollRank: idx + 1 }));
    });
  };

  const handleRankVoteChange = (index, rankKey, value) => {
    const num = Math.max(0, parseInt(value) || 0);
    setPollItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      const currentRanks = {
        "1": 0,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        ...(item.rankVotes || {}),
      };
      currentRanks[rankKey] = num;
      item.rankVotes = currentRanks;

      // Auto calculate total points (อันดับ 1=10, 2=7, 3=5, 4=3, 5=2, แชมป์=15)
      const champ = Number(item.championVotes) || 0;
      const calcVotes =
        (Number(currentRanks["1"]) || 0) * 10 +
        (Number(currentRanks["2"]) || 0) * 7 +
        (Number(currentRanks["3"]) || 0) * 5 +
        (Number(currentRanks["4"]) || 0) * 3 +
        (Number(currentRanks["5"]) || 0) * 2 +
        champ * 15;

      item.votes = calcVotes;
      updated[index] = item;
      return updated;
    });
  };

  const handleChampionVoteChange = (index, value) => {
    const num = Math.max(0, parseInt(value) || 0);
    setPollItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      item.championVotes = num;

      const currentRanks = item.rankVotes || {};
      const calcVotes =
        (Number(currentRanks["1"]) || 0) * 10 +
        (Number(currentRanks["2"]) || 0) * 7 +
        (Number(currentRanks["3"]) || 0) * 5 +
        (Number(currentRanks["4"]) || 0) * 3 +
        (Number(currentRanks["5"]) || 0) * 2 +
        num * 15;

      item.votes = calcVotes;
      updated[index] = item;
      return updated;
    });
  };

  const handleAddPollItem = () => {
    const newRank = pollItems.length + 1;
    setPollItems((prev) => [
      ...prev,
      {
        pollRank: newRank,
        id: String(Date.now()),
        name: "ผู้เข้าแข่งขันใหม่",
        nickname: "",
        topic: "-",
        percent: "0.00%",
        votes: 0,
        image: "",
      },
    ]);
  };

  const handleDeletePollItem = (index) => {
    const item = pollItems[index];
    if (!window.confirm(`ต้องการลบ "${item.nickname || item.name}" ออกจากตารางโพลล์ใช่หรือไม่?`)) {
      return;
    }
    setPollItems((prev) => {
      const filtered = prev.filter((_, idx) => idx !== index);
      return filtered.map((it, idx) => ({ ...it, pollRank: idx + 1 }));
    });
  };

  const handleAutoCalculatePercent = () => {
    const totalVotes = pollItems.reduce((sum, it) => sum + (Number(it.votes) || 0), 0);
    const totalWhatIf = pollItems.reduce((sum, it) => sum + (Number(it.whatIfScore) || 0), 0);

    if (totalVotes === 0 && totalWhatIf === 0) {
      showToast("ยังไม่มีคะแนนโหวตหรือคะแนนรอบอุ่นเครื่องในระบบ", "info");
      return;
    }

    setPollItems((prev) => {
      const computed = prev.map((item) => {
        const v = Number(item.votes) || 0;
        const w = Math.min(100, Math.max(0, Number(item.whatIfScore) || 0));

        // 30% จากคะแนนรอบอุ่นเครื่อง What If (w / totalWhatIf * 30%)
        const whatIfShare30 = totalWhatIf > 0 ? (w / totalWhatIf) * 30 : 0;
        // 70% จากคะแนนโหวตมหาชน (v / totalVotes * 70%)
        const voteShare70 = totalVotes > 0 ? (v / totalVotes) * 70 : 0;
        // บวกกันโต้งๆ เลย ไม่ต้องปรับเพิ่ม (เช่น นนท์ได้ 11.72% ก็ใช้ 11.72% เลย)
        const finalPct = whatIfShare30 + voteShare70;

        const totalScore = Number(finalPct.toFixed(2));
        return {
          ...item,
          whatIfScore: w,
          votes: v,
          totalScore,
          percent: `${finalPct.toFixed(2)}%`,
        };
      });

      // Sort by percent descending
      computed.sort((a, b) => parseFloat(b.percent) - parseFloat(a.percent));
      return computed.map((item, idx) => ({ ...item, pollRank: idx + 1 }));
    });

    showToast("คำนวณ % โพลล์ (โหวต 70% + What If 30%) และจัดอันดับเรียบร้อยแล้ว");
  };

  const handleAutoSortByVotes = () => {
    setPollItems((prev) => {
      const sorted = [...prev].sort((a, b) => {
        const pB = parseFloat(b.percent) || Number(b.totalScore) || 0;
        const pA = parseFloat(a.percent) || Number(a.totalScore) || 0;
        if (pB !== pA) return pB - pA;
        const vB = Number(b.votes) || 0;
        const vA = Number(a.votes) || 0;
        if (vB !== vA) return vB - vA;
        return (Number(b.whatIfScore) || 0) - (Number(a.whatIfScore) || 0);
      });
      return sorted.map((item, idx) => ({ ...item, pollRank: idx + 1 }));
    });
    showToast("จัดเรียงอันดับโพลล์ตามคะแนนโพลล์ % รวม (มากไปน้อย) แล้ว");
  };

  const handleSaveAllPoll = async () => {
    setSavingPoll(true);
    setPollNotice("");
    try {
      // Ensure photos from contestants are attached to poll items
      const itemsToSave = pollItems.map((item) => {
        const matched = contestants.find(
          (c) =>
            (c.id && item.id && String(c.id) === String(item.id)) ||
            (c.name && item.name && c.name.trim() === item.name.trim()) ||
            (c.nickname && item.nickname && c.nickname.trim() === item.nickname.trim())
        );
        return {
          ...item,
          image: item.image || matched?.image || "",
        };
      });

      const res = await fetch("/api/trial-poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_all", items: itemsToSave }),
      });
      const data = await res.json();
      if (data.success) {
        setPollNotice("✅ บันทึกตารางอันดับโพลล์เรียบร้อยแล้ว!");
        showToast("บันทึกตารางอันดับโพลล์เรียบร้อยแล้ว");
        if (Array.isArray(data.data)) {
          setPollItems(data.data);
        }
      } else {
        setPollNotice("❌ บันทึกไม่สำเร็จ: " + (data.error || ""));
      }
    } catch (err) {
      setPollNotice("❌ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSavingPoll(false);
    }
  };

  const handleSyncPhotosToPoll = () => {
    let syncCount = 0;
    setPollItems((prev) => {
      return prev.map((item) => {
        const matched = contestants.find(
          (c) =>
            (c.id && item.id && String(c.id) === String(item.id)) ||
            (c.name && item.name && c.name.trim() === item.name.trim()) ||
            (c.nickname && item.nickname && c.nickname.trim() === item.nickname.trim())
        );
        if (matched?.image && matched.image !== item.image) {
          syncCount++;
          return { ...item, image: matched.image };
        }
        return item;
      });
    });
    showToast(`ดึงรูปภาพจากรายชื่อผู้เข้าแข่งขันเรียบร้อยแล้ว (พบรูปใหม่ ${syncCount} คน)`, "success");
  };

  const handleOpenEditCandidate = (item) => {
    setEditingPollCandidate(item);
    setPollCandidateForm({
      id: item.id || "",
      name: item.name || "",
      nickname: item.nickname || "",
      topic: item.topic || "",
      description: item.description || "",
      videoUrl: item.videoUrl || "",
      scores: {
        "3sec": item.scores?.["3sec"] !== null && item.scores?.["3sec"] !== undefined ? item.scores["3sec"] : (item.gameScores?.["3sec"] ?? ""),
        qa: item.scores?.qa !== null && item.scores?.qa !== undefined ? item.scores.qa : (item.gameScores?.qa ?? ""),
        jigsaw: item.scores?.jigsaw !== null && item.scores?.jigsaw !== undefined ? item.scores.jigsaw : (item.gameScores?.jigsaw ?? ""),
        attribute: item.scores?.attribute !== null && item.scores?.attribute !== undefined ? item.scores.attribute : (item.gameScores?.attribute ?? ""),
      },
      whatIfScore: item.whatIfScore !== null && item.whatIfScore !== undefined ? item.whatIfScore : (item.gameTotalScore ?? ""),
      warmupSchedule: item.warmupSchedule || "",
    });
  };

  const handleScoreChange = (category, value) => {
    setPollCandidateForm((prev) => {
      const newScores = { ...prev.scores, [category]: value };
      const s3 = Number(newScores["3sec"]) || 0;
      const sq = Number(newScores.qa) || 0;
      const sj = Number(newScores.jigsaw) || 0;
      const sa = Number(newScores.attribute) || 0;
      const calcTotal = s3 + sq + sj + sa;
      return {
        ...prev,
        scores: newScores,
        whatIfScore: calcTotal,
      };
    });
  };

  const handleSaveCandidateDetails = async () => {
    if (!editingPollCandidate) return;
    setSavingCandidateDetails(true);
    try {
      const payload = {
        action: "save_candidate_details",
        id: pollCandidateForm.id,
        name: pollCandidateForm.name,
        nickname: pollCandidateForm.nickname,
        topic: pollCandidateForm.topic,
        description: pollCandidateForm.description,
        videoUrl: pollCandidateForm.videoUrl,
        scores: {
          "3sec": pollCandidateForm.scores["3sec"] !== "" ? Number(pollCandidateForm.scores["3sec"]) : null,
          qa: pollCandidateForm.scores.qa !== "" ? Number(pollCandidateForm.scores.qa) : null,
          jigsaw: pollCandidateForm.scores.jigsaw !== "" ? Number(pollCandidateForm.scores.jigsaw) : null,
          attribute: pollCandidateForm.scores.attribute !== "" ? Number(pollCandidateForm.scores.attribute) : null,
        },
        whatIfScore: Number(pollCandidateForm.whatIfScore) || 0,
        warmupSchedule: pollCandidateForm.warmupSchedule,
      };
      const res = await fetch("/api/trial-poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast("บันทึกข้อมูลและคลิปเรียบร้อยแล้ว");
        setPollItems((prev) =>
          prev.map((item) => {
            if (
              (payload.id && String(item.id) === String(payload.id)) ||
              (payload.name && item.name === payload.name)
            ) {
              return {
                ...item,
                description: payload.description,
                videoUrl: payload.videoUrl,
                scores: payload.scores,
                whatIfScore: payload.whatIfScore,
                warmupSchedule: payload.warmupSchedule,
              };
            }
            return item;
          })
        );
        setEditingPollCandidate(null);
      } else {
        alert("เกิดข้อผิดพลาด: " + (data.error || "ไม่สามารถบันทึกได้"));
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setSavingCandidateDetails(false);
    }
  };

  const handleResetPoll = async () => {
    if (!window.confirm("ต้องการรีเซ็ตตารางอันดับโพลล์กลับเป็นค่าเริ่มต้น 40 คนใช่หรือไม่?")) {
      return;
    }
    setSavingPoll(true);
    try {
      const res = await fetch("/api/trial-poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = await res.json();
      if (data.success) {
        setPollNotice("✅ รีเซ็ตตารางอันดับโพลล์เป็นค่าเริ่มต้นเรียบร้อยแล้ว!");
        showToast("รีเซ็ตผลโพลล์เป็นค่าเริ่มต้นแล้ว");
        if (Array.isArray(data.data)) {
          setPollItems(data.data);
        }
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการรีเซ็ตผลโพลล์");
    } finally {
      setSavingPoll(false);
    }
  };

  // ── Keywords & Q&A Board Handlers ──────────────────────────────────────────
  const handleKeywordChange = (id, newKeyword) => {
    setInfoKeywords((prev) =>
      prev.map((item) => (String(item.id) === String(id) ? { ...item, keyword: newKeyword } : item))
    );
  };

  const handleSaveKeyword = async (id, keyword) => {
    try {
      setSavingKeywordId(id);
      const res = await fetch("/api/trial-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_keyword", id, keyword }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("บันทึกคำใบ้สำเร็จ", "success");
      } else {
        showToast(data.error || "เกิดข้อผิดพลาดในการบันทึกคำใบ้", "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
    } finally {
      setSavingKeywordId(null);
    }
  };

  const handleSaveAllKeywords = async () => {
    try {
      setSavingAllKeywords(true);
      const res = await fetch("/api/trial-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_keywords", keywords: infoKeywords }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("บันทึกคำใบ้ของผู้เข้าแข่งขันทั้งหมดเรียบร้อยแล้ว", "success");
      } else {
        showToast(data.error || "เกิดข้อผิดพลาดในการบันทึกคำใบ้", "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
    } finally {
      setSavingAllKeywords(false);
    }
  };

  const handleSelectQaContestant = (c) => {
    setQaForm((prev) => ({
      ...prev,
      contestantId: String(c.id),
    }));
    setShowQaDropdown(false);
  };

  const handleSaveQa = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!qaForm.contestantId) {
      alert("กรุณาเลือกผู้เข้าแข่งขัน");
      return;
    }
    if (!qaForm.question?.trim()) {
      alert("กรุณากรอกคำถามจากผู้เข้าแข่งขัน");
      return;
    }
    if (!qaForm.answer?.trim()) {
      alert("กรุณากรอกคำตอบจากทีมงาน");
      return;
    }

    // Match contestant info
    const matched =
      contestants.find((c) => String(c.id) === String(qaForm.contestantId)) ||
      infoKeywords.find((k) => String(k.id) === String(qaForm.contestantId));

    const payload = {
      contestantId: String(qaForm.contestantId),
      contestantName: matched?.name || "",
      nickname: matched?.nickname || "",
      topic: matched?.topic || "",
      category: qaForm.category || "คำถาม-คำตอบ",
      question: qaForm.question.trim(),
      answer: qaForm.answer.trim(),
    };

    if (qaForm.id) {
      payload.id = qaForm.id;
    }

    try {
      setSavingQa(true);
      const res = await fetch("/api/trial-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: qaForm.id ? "update_qa" : "add_qa",
          qa: payload,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "บันทึกเรียบร้อยแล้ว", "success");
        if (Array.isArray(data.qaBoard)) {
          setInfoQaBoard(data.qaBoard);
        } else {
          fetchTrialInfo();
        }
        // Reset form
        setQaForm({
          id: null,
          contestantId: "",
          category: "คำถาม-คำตอบ",
          question: "",
          answer: "",
        });
      } else {
        showToast(data.error || "บันทึกไม่สำเร็จ", "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
    } finally {
      setSavingQa(false);
    }
  };

  const handleEditQa = (item) => {
    setQaForm({
      id: item.id,
      contestantId: String(item.contestantId),
      category: item.category || "คำถาม-คำตอบ",
      question: item.question || "",
      answer: item.answer || "",
    });
    // Scroll smoothly to form
    const formElem = document.getElementById("adminQaFormSection");
    if (formElem) {
      formElem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCancelEditQa = () => {
    setQaForm({
      id: null,
      contestantId: "",
      category: "คำถาม-คำตอบ",
      question: "",
      answer: "",
    });
  };

  const handleDeleteQa = async (id) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบคำถาม-ตอบนี้ออกจากกระดาน?")) {
      return;
    }
    try {
      setDeletingQaId(id);
      const res = await fetch("/api/trial-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_qa", id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("ลบคำถาม-ตอบเรียบร้อยแล้ว", "success");
        if (Array.isArray(data.qaBoard)) {
          setInfoQaBoard(data.qaBoard);
        } else {
          setInfoQaBoard((prev) => prev.filter((item) => item.id !== id));
        }
        if (qaForm.id === id) {
          handleCancelEditQa();
        }
      } else {
        showToast(data.error || "เกิดข้อผิดพลาดในการลบ", "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
    } finally {
      setDeletingQaId(null);
    }
  };

  const loadTrialSettings = async () => {
    try {
      const res = await fetch("/api/settings?admin=1");
      const data = await res.json();
      if (data.success) {
        if (data.trialAdminPassword) {
          setTrialAdminPassConfig(data.trialAdminPassword);
        }
        if (data.trialVotingOpen !== undefined) {
          setVotingOpen(Boolean(data.trialVotingOpen));
        }
        if (data.showWarmupTable !== undefined) {
          setShowWarmupTable(Boolean(data.showWarmupTable));
        }
        if (data.showTrialPollTable !== undefined) {
          setShowPollTable(Boolean(data.showTrialPollTable));
        } else if (data.showPollTable !== undefined) {
          setShowPollTable(Boolean(data.showPollTable));
        }
        if (data.showPollTable !== undefined) {
          setShowMainPollTable(Boolean(data.showPollTable));
        }
        if (data.hideTrialPollScoresDuringVote !== undefined) {
          setHideTrialPollScores(Boolean(data.hideTrialPollScoresDuringVote));
        }
        if (data.trialSubtitle) {
          setTrialSubtitle(data.trialSubtitle);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveTrialSubtitle = async (customValue) => {
    const targetText = typeof customValue === "string" ? customValue : trialSubtitle;
    setSavingSubtitle(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_subtitles",
          trialSubtitle: targetText.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTrialSubtitle(data.trialSubtitle || targetText.trim());
        showToast("🟢 บันทึกข้อความคำเปรยของ Trial FOTY สำเร็จแล้ว", "success");
      } else {
        showToast(data.error || "เกิดข้อผิดพลาดในการบันทึกคำเปรย", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
    } finally {
      setSavingSubtitle(false);
    }
  };

  const fetchData = fetchContestants;

  useEffect(() => {
    fetchContestants();
    loadTrialSettings();
  }, []);

  const handleToggleVoting = async (newStatus) => {
    const targetStatus = typeof newStatus === "boolean" ? newStatus : !votingOpen;
    setTogglingVoting(true);
    try {
      const res = await fetch("/api/trial-poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_voting_open", votingOpen: targetStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setVotingOpen(targetStatus);
        showToast(targetStatus ? "🟢 เปิดรับการโหวตโพลล์มหาชนแล้ว" : "🔴 ปิดรับการโหวตโพลล์มหาชนแล้ว", "success");
      } else {
        showToast(data.error || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะการโหวต", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
    } finally {
      setTogglingVoting(false);
    }
  };

  const handleToggleWarmupTable = async (newStatus) => {
    const targetStatus = typeof newStatus === "boolean" ? newStatus : !showWarmupTable;
    setTogglingWarmupTable(true);
    try {
      const res = await fetch("/api/trial-poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_warmup_table", showWarmupTable: targetStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setShowWarmupTable(targetStatus);
        showToast(targetStatus ? "🟢 เปิดแสดงตารางรอบอุ่นเครื่องในหน้าแรกแล้ว" : "🔴 ปิดซ่อนตารางรอบอุ่นเครื่องในหน้าแรกแล้ว", "success");
      } else {
        showToast(data.error || "เกิดข้อผิดพลาดในการเปลี่ยนการแสดงตารางรอบอุ่นเครื่อง", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
    } finally {
      setTogglingWarmupTable(false);
    }
  };

  const handleToggleTrialPollTable = async (newStatus) => {
    const targetStatus = typeof newStatus === "boolean" ? newStatus : !showPollTable;
    setTogglingPollTable(true);
    try {
      const res = await fetch("/api/trial-poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_trial_poll_table", showTrialPollTable: targetStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPollTable(targetStatus);
        showToast(targetStatus ? "🟢 เปิดแสดงตารางโพลล์ในหน้า Trial FOTY แล้ว" : "🔴 ปิดซ่อนตารางโพลล์ในหน้า Trial FOTY แล้ว", "success");
      } else {
        showToast(data.error || "เกิดข้อผิดพลาดในการเปลี่ยนการแสดงตารางโพลล์", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
    } finally {
      setTogglingPollTable(false);
    }
  };

  const handleToggleHideScores = async (newStatus) => {
    const targetStatus = typeof newStatus === "boolean" ? newStatus : !hideTrialPollScores;
    setTogglingHideScores(true);
    try {
      const res = await fetch("/api/trial-poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_hide_scores", hideTrialPollScoresDuringVote: targetStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setHideTrialPollScores(targetStatus);
        showToast(targetStatus ? "🛡️ เปิดระบบปิดการมองเห็นคะแนนโพลล์ระหว่างโหวตแล้ว" : "🔓 ปิดระบบกันสปอยล์ (แสดงคะแนนสดตามปกติ)", "success");
      } else {
        showToast(data.error || "เกิดข้อผิดพลาดในการตั้งค่า", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
    } finally {
      setTogglingHideScores(false);
    }
  };

  const handleToggleMainPollTable = async (newStatus) => {
    const targetStatus = typeof newStatus === "boolean" ? newStatus : !showMainPollTable;
    setTogglingMainPollTable(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_poll_table", showPollTable: targetStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setShowMainPollTable(targetStatus);
        showToast(targetStatus ? "🟢 เปิดแสดงตารางโพลล์ในหน้าแรกหลัก (/) แล้ว" : "🔴 ปิดซ่อนตารางโพลล์ในหน้าแรกหลัก (/) แล้ว", "success");
      } else {
        showToast(data.error || "เกิดข้อผิดพลาดในการเปลี่ยนการแสดงตารางโพลล์หน้าแรก", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
    } finally {
      setTogglingMainPollTable(false);
    }
  };

  const handleSyncGameScores = async () => {
    if (!window.confirm("ต้องการดึงคะแนนรวมจากห้องเล่นเกม (/game) มาเป็นคะแนนรอบอุ่นเครื่อง (What If? 30%) ของผู้เข้าแข่งขันทั้งหมด ใช่หรือไม่?")) {
      return;
    }
    setSyncingGameScores(true);
    try {
      const res = await fetch("/api/trial-poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_game_scores" }),
      });
      const data = await res.json();
      if (data.success) {
        setPollItems(data.data || []);
        showToast(data.message || "ซิงค์คะแนนจากห้องเล่นเกมเรียบร้อยแล้ว", "success");
      } else {
        showToast(data.error || "เกิดข้อผิดพลาดในการซิงค์คะแนน", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
    } finally {
      setSyncingGameScores(false);
    }
  };

  const handleSaveTrialAdminPassword = async () => {
    if (!trialAdminPassConfig.trim()) {
      showToast("กรุณากรอกรหัสผ่าน", "error");
      return;
    }
    setSavingPassConfig(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", trialAdminPassword: trialAdminPassConfig.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("บันทึกรหัสผ่านใหม่เรียบร้อยแล้ว", "success");
      } else {
        showToast(data.error || "เกิดข้อผิดพลาด", "error");
      }
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    } finally {
      setSavingPassConfig(false);
    }
  };

  // Sync active contestant when contestants update
  useEffect(() => {
    if (selectedContestantId && contestants.length > 0) {
      const found = contestants.find((c) => String(c.id) === String(selectedContestantId));
      if (found) {
        setActiveContestant(found);
      }
    }
  }, [contestants, selectedContestantId]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // When user selects a contestant from dropdown
  const handleSelectContestant = (c) => {
    setSelectedContestantId(c.id);
    setIsDropdownOpen(false);
    setActiveContestant(c);
    const s = c.scores || {};
    setActiveScores({
      "3sec": s["3sec"] !== null && s["3sec"] !== undefined && s["3sec"] !== "" ? String(s["3sec"]) : "",
      qa: s.qa !== null && s.qa !== undefined && s.qa !== "" ? String(s.qa) : "",
      jigsaw: s.jigsaw !== null && s.jigsaw !== undefined && s.jigsaw !== "" ? String(s.jigsaw) : "",
      attribute: s.attribute !== null && s.attribute !== undefined && s.attribute !== "" ? String(s.attribute) : "",
    });
    setOrderInput(c.order !== null && c.order !== undefined ? String(c.order) : "");
    setScoringNotice("");
  };

  // Toggle Playing (On-Air)
  const handleTogglePlaying = async (contestant) => {
    if (!contestant) return;
    try {
      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_playing", id: contestant.id }),
      });
      const data = await res.json();
      if (data.success) {
        setContestants(data.data);
        const updated = data.data.find((c) => String(c.id) === String(contestant.id));
        if (updated) setActiveContestant(updated);
        showToast(
          updated?.isPlaying
            ? `🔴 ${updated.nickname || updated.name} ขึ้นเวทีกำลังแข่งขัน (LIVE)!`
            : `จบการแข่งขันของ ${contestant.nickname || contestant.name}`,
          "success"
        );
      } else {
        showToast(data.error || "เกิดข้อผิดพลาด", "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    }
  };

  // Toggle Waiting Next Match
  const handleToggleWaiting = async (contestant) => {
    if (!contestant) return;
    try {
      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_waiting", id: contestant.id }),
      });
      const data = await res.json();
      if (data.success) {
        setContestants(data.data);
        const updated = data.data.find((c) => String(c.id) === String(contestant.id));
        if (updated) setActiveContestant(updated);
        showToast(
          updated?.waitingNextMatch
            ? `⏳ เพิ่ม ${updated.nickname || updated.name} เป็นสถานะรอลุ้นผลในวันแข่งขันถัดไป`
            : `ปลดสถานะรอลุ้นผลของ ${contestant.nickname || contestant.name}`,
          "success"
        );
      } else {
        showToast(data.error || "เกิดข้อผิดพลาด", "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    }
  };

  // Save Specific Category Score
  const handleSaveCategoryScore = async (categoryKey) => {
    if (!activeContestant) {
      showToast("กรุณาเลือกผู้เข้าแข่งขันก่อน", "error");
      return;
    }
    const val = activeScores[categoryKey];
    const newScores = {
      ...(activeContestant.scores || {}),
      [categoryKey]: val !== "" && !isNaN(Number(val)) ? Number(val) : null,
    };

    try {
      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_score",
          id: activeContestant.id,
          scores: newScores,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setContestants(data.data);
        const updated = data.data.find((c) => String(c.id) === String(activeContestant.id));
        if (updated) setActiveContestant(updated);
        showToast(`บันทึกคะแนนหมวด ${categoryKey} (${val || 0} คะแนน) สำเร็จ!`, "success");
      } else {
        showToast(data.error || "เกิดข้อผิดพลาดในการบันทึก", "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    }
  };

  // Save All Scores
  const handleSaveAllScores = async () => {
    if (!activeContestant) {
      showToast("กรุณาเลือกผู้เข้าแข่งขันก่อน", "error");
      return;
    }
    setIsSavingScore(true);
    try {
      const payload = {
        action: "update_score",
        id: activeContestant.id,
        scores: {
          "3sec": activeScores["3sec"] !== "" ? Number(activeScores["3sec"]) : null,
          qa: activeScores.qa !== "" ? Number(activeScores.qa) : null,
          jigsaw: activeScores.jigsaw !== "" ? Number(activeScores.jigsaw) : null,
          attribute: activeScores.attribute !== "" ? Number(activeScores.attribute) : null,
        },
        order: orderInput !== "" ? Number(orderInput) : null,
      };

      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setContestants(data.data);
        const updated = data.data.find((c) => String(c.id) === String(activeContestant.id));
        if (updated) setActiveContestant(updated);
        showToast(`บันทึกคะแนนทั้งหมดของ ${activeContestant.nickname || activeContestant.name} สำเร็จ! (${activeCalculatedTotal} คะแนน)`, "success");
        setScoringNotice(`✅ บันทึกคะแนนเรียบร้อย: รวม ${activeCalculatedTotal} คะแนน`);
      } else {
        showToast(data.error || "เกิดข้อผิดพลาดในการบันทึก", "error");
        setScoringNotice(`❌ ${data.error || "บันทึกไม่สำเร็จ"}`);
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
      setScoringNotice("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSavingScore(false);
    }
  };

  // Open Add Contestant Modal
  const openAddModal = () => {
    setModalMode("add");
    setFormData({
      id: "",
      name: "",
      nickname: "",
      topic: "",
      image: "",
      order: String(contestants.length + 1),
      warmupSchedule: "",
    });
    setShowContestantModal(true);
  };

  // Open Edit Contestant Modal
  const openEditModal = (c) => {
    setModalMode("edit");
    setFormData({
      id: c.id,
      name: c.name || "",
      nickname: c.nickname || "",
      topic: c.topic || "",
      image: c.image || "",
      order: c.order !== null && c.order !== undefined ? String(c.order) : "",
      warmupSchedule: c.warmupSchedule || "",
    });
    setShowContestantModal(true);
  };

  // Handle Save Contestant from Modal
  const handleSaveContestant = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        action: modalMode === "add" ? "add_slot" : "update_contestant",
        id: formData.id,
        name: formData.name,
        nickname: formData.nickname,
        topic: formData.topic,
        image: formData.image,
        order: formData.order !== "" ? Number(formData.order) : null,
        warmupSchedule: formData.warmupSchedule || "",
      };

      if (isMaintainer && modalMode === "edit") {
        const orig = contestants.find((c) => String(c.id) === String(formData.id));
        if (orig) {
          payload.name = orig.name;
          payload.nickname = orig.nickname;
          payload.topic = orig.topic;
          payload.order = orig.order;
          payload.warmupSchedule = orig.warmupSchedule || "";
        }
      }

      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setContestants(data.data);
        setShowContestantModal(false);
        showToast(modalMode === "add" ? "เพิ่มผู้เข้าแข่งขันเรียบร้อยแล้ว!" : "อัปเดตข้อมูลผู้เข้าแข่งขันเรียบร้อยแล้ว!", "success");
      } else {
        showToast(data.error || "เกิดข้อผิดพลาด", "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    }
  };

  // Quick Save Photo from Contestants Table
  const handleQuickSavePhoto = async (c) => {
    const newUrl = quickPhotos[c.id];
    if (newUrl === undefined) return;
    setSavingQuickPhotoId(c.id);
    try {
      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_contestant",
          id: c.id,
          image: newUrl.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setContestants(data.data);
        showToast(`บันทึกรูปภาพของ ${c.nickname || c.name} สำเร็จ!`, "success");
      } else {
        showToast(data.error || "เกิดข้อผิดพลาด", "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    } finally {
      setSavingQuickPhotoId(null);
    }
  };

  // Delete Contestant
  const handleDeleteContestant = async (c) => {
    if (!confirm(`⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบ "${c.nickname ? `${c.nickname} (${c.name})` : c.name}" ออกจากระบบ?`)) {
      return;
    }
    try {
      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_slot", id: c.id }),
      });
      const data = await res.json();
      if (data.success) {
        setContestants(data.data);
        if (String(selectedContestantId) === String(c.id)) {
          setSelectedContestantId("");
          setActiveContestant(null);
        }
        showToast(`ลบ "${c.name}" เรียบร้อยแล้ว`, "success");
      } else {
        showToast(data.error || "เกิดข้อผิดพลาด", "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    }
  };

  // Reset All Scores
  const handleResetScores = async () => {
    try {
      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_scores" }),
      });
      const data = await res.json();
      if (data.success) {
        setContestants(data.data);
        setSelectedContestantId("");
        setActiveContestant(null);
        setActiveScores({ "3sec": "", qa: "", jigsaw: "", attribute: "" });
        setOrderInput("");
        setShowResetModal(false);
        showToast("รีเซ็ตคะแนนทั้งหมดเป็น 0 เรียบร้อยแล้ว (รายชื่อและรูปยังคงอยู่)", "success");
      } else {
        showToast(data.error || "เกิดข้อผิดพลาด", "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    }
  };

  // Reload 39 Contestants Roster
  const handleReloadTrialRoster = async () => {
    if (!confirm("⚠️ คุณแน่ใจหรือไม่ว่าต้องการรีโหลดรายชื่อ 39 คนตั้งต้นของ งุ่นง่าน Of The Year 2026?")) {
      return;
    }
    try {
      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reload_trial_roster" }),
      });
      const data = await res.json();
      if (data.success) {
        setContestants(data.data);
        setSelectedContestantId("");
        setActiveContestant(null);
        setActiveScores({ "3sec": "", qa: "", jigsaw: "", attribute: "" });
        setOrderInput("");
        showToast("รีโหลดรายชื่อ 39 คนตั้งต้นเรียบร้อยแล้ว", "success");
      } else {
        showToast(data.error || "เกิดข้อผิดพลาด", "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    }
  };

  // Reset to 20 Blank Slots
  const handleResetBlankSlots = async () => {
    if (!confirm("⚠️ ต้องการล้างและรีเซ็ตเป็นช่องว่าง 20 คนสำหรับกรอกข้อมูลใหม่?")) {
      return;
    }
    try {
      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_blank_slots", count: 20 }),
      });
      const data = await res.json();
      if (data.success) {
        setContestants(data.data);
        setSelectedContestantId("");
        setActiveContestant(null);
        setActiveScores({ "3sec": "", qa: "", jigsaw: "", attribute: "" });
        showToast("รีเซ็ตเป็นช่องว่าง 20 คนเรียบร้อยแล้ว", "success");
      } else {
        showToast(data.error || "เกิดข้อผิดพลาด", "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    }
  };

  // Calculated Active Total Score
  const activeCalculatedTotal = ["3sec", "qa", "jigsaw", "attribute"].reduce((sum, key) => {
    const v = activeScores[key];
    return sum + (v !== "" && !isNaN(Number(v)) ? Number(v) : 0);
  }, 0);

  // Contestant filter counts
  const withPhotoCount = contestants.filter((c) => Boolean(c.image)).length;
  const noPhotoCount = contestants.filter((c) => !c.image).length;
  const hasScoreCount = contestants.filter((c) => (c.totalScore ?? 0) > 0).length;

  const filteredContestants = contestants.filter((c) => {
    if (contestantFilter === "withPhoto" && !c.image) return false;
    if (contestantFilter === "noPhoto" && c.image) return false;
    if (contestantFilter === "hasScores" && (!c.totalScore || c.totalScore === 0)) return false;

    if (contestantSearch.trim()) {
      const q = contestantSearch.trim().toLowerCase();
      const matchName = (c.name || "").toLowerCase().includes(q);
      const matchNick = (c.nickname || "").toLowerCase().includes(q);
      const matchTopic = (c.topic || "").toLowerCase().includes(q);
      if (!matchName && !matchNick && !matchTopic) return false;
    }
    return true;
  });

  // ── Unauthenticated Login Screen ─────────────────────────────────────────────
  if (authChecking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#030812", color: "#ffd700" }}>
        กำลังตรวจสอบสิทธิ์...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminLoginScreen
        section="trial_foty"
        title="ห้องควบคุมแอดมิน • งุ่นง่าน 2026"
        subtitle="กรุณากรอก Username และ Password เพื่อเข้าสู่การควบคุม Trial FoTY"
        theme="gold"
        noAccessInfo={noAccessInfo}
        onLogout={handleAdminLogout}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at top center, #0f2744 0%, #07101f 60%, #02050a 100%)",
        color: "#ffffff",
        fontFamily: "var(--font-th, 'Sukhumvit Set', 'Kanit', 'Noto Sans Thai', sans-serif)",
      }}
    >
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            padding: "12px 22px",
            borderRadius: "12px",
            background: toast.type === "error" ? "rgba(220, 38, 38, 0.95)" : "rgba(16, 185, 129, 0.95)",
            color: "#ffffff",
            fontWeight: "800",
            fontSize: "14px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backdropFilter: "blur(10px)",
          }}
        >
          <span>{toast.type === "error" ? "❌" : "✅"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ========================================================
          1. TOP NAVIGATION HEADER (Matching Main Admin Exactly)
         ======================================================== */}
      <header
        style={{
          background: "rgba(5, 15, 30, 0.95)",
          borderBottom: "1px solid rgba(0, 229, 255, 0.25)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          padding: "12px clamp(12px, 3vw, 24px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link href="/trial-foty" title="ไปที่ตารางคะแนนแข่งขัน">
            <img
              src="/img/trial_foty_logo.png"
              alt="The Trial FOTY 2026"
              style={{
                height: "34px",
                width: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 0 10px rgba(0, 229, 255, 0.6))",
              }}
            />
          </Link>
          <div style={{ borderLeft: "1px solid rgba(0, 229, 255, 0.3)", paddingLeft: "10px" }}>
            <h1 style={{ fontSize: "clamp(14px, 3.5vw, 16px)", fontWeight: "800", color: "#00e5ff", margin: 0 }}>
              ห้องควบคุมแอดมิน • The Trial
            </h1>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", margin: 0 }}>
              FOTY 2026 ADMIN ROOM
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <AdminUserMenu
            user={user}
            section="trial_foty"
            onLogout={handleAdminLogout}
            onReset={() => setShowResetModal(true)}
            resetLabel="รีเซ็ตคะแนนแข่งขัน"
            theme="gold"
          />
        </div>
      </header>

      {/* ========================================================
          2. MAIN CONTENT CONTAINER & TABS (Matching Main Admin)
         ======================================================== */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px" }}>
        {/* Navigation Tabs Bar */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            marginBottom: "24px",
            overflowX: "auto",
          }}
        >
          <button
            onClick={() => setActiveTab("scoring")}
            style={{
              padding: "12px 20px",
              fontSize: "15px",
              fontWeight: "700",
              background: activeTab === "scoring" ? "rgba(0, 229, 255, 0.12)" : "transparent",
              color: activeTab === "scoring" ? "#00e5ff" : "rgba(255,255,255,0.6)",
              border: "none",
              borderBottom: activeTab === "scoring" ? "2px solid #00e5ff" : "2px solid transparent",
              cursor: "pointer",
              borderRadius: "6px 6px 0 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
            }}
          >
            🎯 จัดการคะแนนแข่งขัน (Live Scoring)
          </button>

          <button
            onClick={() => setActiveTab("poll")}
            style={{
              padding: "12px 20px",
              fontSize: "15px",
              fontWeight: "700",
              background: activeTab === "poll" ? "rgba(255, 215, 0, 0.15)" : "transparent",
              color: activeTab === "poll" ? "#ffd700" : "rgba(255,255,255,0.6)",
              border: "none",
              borderBottom: activeTab === "poll" ? "2px solid #ffd700" : "2px solid transparent",
              cursor: "pointer",
              borderRadius: "6px 6px 0 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
            }}
          >
            📊 จัดการอันดับโพลล์ ({isMaintainer ? "🔒" : pollItems.length})
          </button>

          <button
            onClick={() => setActiveTab("contestants")}
            style={{
              padding: "12px 20px",
              fontSize: "15px",
              fontWeight: "700",
              background: activeTab === "contestants" ? "rgba(0, 229, 255, 0.12)" : "transparent",
              color: activeTab === "contestants" ? "#00e5ff" : "rgba(255,255,255,0.6)",
              border: "none",
              borderBottom: activeTab === "contestants" ? "2px solid #00e5ff" : "2px solid transparent",
              cursor: "pointer",
              borderRadius: "6px 6px 0 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
            }}
          >
            👥 รายชื่อผู้เข้าแข่งขัน & ผูกรูป ({contestants.length})
          </button>

          <button
            onClick={() => setActiveTab("keywords")}
            style={{
              padding: "12px 20px",
              fontSize: "15px",
              fontWeight: "700",
              background: activeTab === "keywords" ? "rgba(0, 229, 255, 0.12)" : "transparent",
              color: activeTab === "keywords" ? "#00e5ff" : "rgba(255,255,255,0.6)",
              border: "none",
              borderBottom: activeTab === "keywords" ? "2px solid #00e5ff" : "2px solid transparent",
              cursor: "pointer",
              borderRadius: "6px 6px 0 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
            }}
          >
            🔑 Keyword คำใบ้ (ถาม-ตอบ) ({infoKeywords.length})
          </button>

          <button
            onClick={() => setActiveTab("qaBoard")}
            style={{
              padding: "12px 20px",
              fontSize: "15px",
              fontWeight: "700",
              background: activeTab === "qaBoard" ? "rgba(255, 215, 0, 0.15)" : "transparent",
              color: activeTab === "qaBoard" ? "#ffd700" : "rgba(255,255,255,0.6)",
              border: "none",
              borderBottom: activeTab === "qaBoard" ? "2px solid #ffd700" : "2px solid transparent",
              cursor: "pointer",
              borderRadius: "6px 6px 0 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
            }}
          >
            💬 กระดานถามทีมงาน ({infoQaBoard.length})
          </button>

          {user?.isMainAdmin && (
            <button
              onClick={() => setActiveTab("users")}
              style={{
                padding: "12px 20px",
                fontSize: "15px",
                fontWeight: "700",
                background: activeTab === "users" ? "rgba(255, 215, 0, 0.15)" : "transparent",
                color: activeTab === "users" ? "#ffd700" : "rgba(255,255,255,0.6)",
                border: "none",
                borderBottom: activeTab === "users" ? "2px solid #ffd700" : "2px solid transparent",
                cursor: "pointer",
                borderRadius: "6px 6px 0 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                whiteSpace: "nowrap",
              }}
            >
              👥 จัดการผู้ใช้ (Users)
            </button>
          )}

          <button
            onClick={() => setActiveTab("settings")}
            style={{
              padding: "12px 20px",
              fontSize: "15px",
              fontWeight: "700",
              background: activeTab === "settings" ? "rgba(0, 229, 255, 0.12)" : "transparent",
              color: activeTab === "settings" ? "#00e5ff" : "rgba(255,255,255,0.6)",
              border: "none",
              borderBottom: activeTab === "settings" ? "2px solid #00e5ff" : "2px solid transparent",
              cursor: "pointer",
              borderRadius: "6px 6px 0 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
            }}
          >
            ⚙️ ตั้งค่า & ข้อมูลระบบ (Settings & Tools)
          </button>
        </div>

        {/* ========================================================
            TAB 1: LIVE SCORING SESSION (Matching Main Admin)
           ======================================================== */}
        {activeTab === "scoring" && (
          <div>
            {/* Step 1: Select Contestant Card */}
            <div
              style={{
                background: "linear-gradient(145deg, rgba(16, 32, 60, 0.8) 0%, rgba(10, 20, 40, 0.9) 100%)",
                border: "1px solid rgba(0, 229, 255, 0.35)",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#80d0ff",
                  margin: "0 0 16px 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>1️⃣ เลือกผู้เข้าแข่งขันที่ต้องการกรอกคะแนน</span>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: "normal" }}>
                  พิมพ์ค้นหาหรือคลิกเลือกจากรายชื่อ {contestants.length} คน
                </span>
              </h2>

              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                {/* Rich Custom Dropdown */}
                <div ref={dropdownRef} style={{ position: "relative", flex: 1, minWidth: "280px" }}>
                  <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      padding: "10px 16px",
                      borderRadius: "10px",
                      background: "rgba(0, 15, 30, 0.9)",
                      border: isDropdownOpen ? "1.5px solid #00e5ff" : "1px solid rgba(0, 229, 255, 0.4)",
                      cursor: "pointer",
                      boxShadow: isDropdownOpen ? "0 0 16px rgba(0, 229, 255, 0.3)" : "none",
                      transition: "all 0.2s ease",
                      minHeight: "52px",
                      boxSizing: "border-box",
                    }}
                  >
                    {!activeContestant ? (
                      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
                        -- กรุณาเลือกผู้เข้าแข่งขันที่ต้องการบันทึกคะแนน --
                      </span>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "rgba(0, 229, 255, 0.15)",
                            border: "1px solid #00e5ff",
                            color: "#00e5ff",
                            fontSize: "12px",
                            fontWeight: "800",
                            flexShrink: 0,
                          }}
                        >
                          #{activeContestant.id}
                        </span>

                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            overflow: "hidden",
                            background: "#030814",
                            border: "1.5px solid #00e5ff",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <AdminPhotoPreview src={activeContestant.image} name={activeContestant.name} size={36} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <strong style={{ fontSize: "15px", color: "#ffffff" }}>
                              {activeContestant.nickname || activeContestant.name}
                            </strong>
                            {activeContestant.nickname && (
                              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                                ({activeContestant.name})
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "12px", color: "#67e8f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            📌 {activeContestant.topic}
                          </div>
                        </div>

                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: "8px",
                            background: "rgba(255, 215, 0, 0.15)",
                            color: "#ffd700",
                            fontSize: "12px",
                            fontWeight: "800",
                            flexShrink: 0,
                          }}
                        >
                          {activeContestant.totalScore ?? 0} คะแนน
                        </span>
                      </div>
                    )}

                    <span
                      style={{
                        fontSize: "12px",
                        color: "#00e5ff",
                        transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                        flexShrink: 0,
                      }}
                    >
                      ▼
                    </span>
                  </div>

                  {/* Dropdown Options List */}
                  {isDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        background: "linear-gradient(160deg, #07162b 0%, #030a14 100%)",
                        border: "1.5px solid #00e5ff",
                        borderRadius: "12px",
                        boxShadow: "0 14px 40px rgba(0, 0, 0, 0.85), 0 0 25px rgba(0, 229, 255, 0.3)",
                        maxHeight: "380px",
                        overflowY: "auto",
                        backdropFilter: "blur(12px)",
                      }}
                    >
                      {/* Search box inside dropdown */}
                      <div
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#07162b",
                          padding: "10px 12px",
                          borderBottom: "1px solid rgba(0, 229, 255, 0.25)",
                        }}
                      >
                        <input
                          type="text"
                          value={dropdownSearch}
                          onChange={(e) => setDropdownSearch(e.target.value)}
                          placeholder="🔍 ค้นหาชื่อเล่น, ชื่อจริง หรือ หัวข้อ..."
                          autoFocus
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            background: "#030a14",
                            border: "1px solid rgba(0, 229, 255, 0.4)",
                            color: "#ffffff",
                            fontSize: "13px",
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>

                      {/* Filtered items */}
                      {(() => {
                        const q = dropdownSearch.trim().toLowerCase();
                        const filtered = contestants.filter((c) => {
                          if (!q) return true;
                          return (
                            c.name?.toLowerCase().includes(q) ||
                            c.nickname?.toLowerCase().includes(q) ||
                            c.topic?.toLowerCase().includes(q)
                          );
                        });

                        if (filtered.length === 0) {
                          return (
                            <div style={{ padding: "20px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
                              ไม่พบผู้เข้าแข่งขันที่ตรงกับการค้นหา
                            </div>
                          );
                        }

                        return filtered.map((c) => {
                          const isSelected = String(c.id) === String(selectedContestantId);
                          return (
                            <div
                              key={c.id}
                              onClick={() => handleSelectContestant(c)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "10px 14px",
                                borderBottom: "1px solid rgba(255,255,255,0.06)",
                                background: isSelected ? "rgba(0, 229, 255, 0.18)" : "transparent",
                                cursor: "pointer",
                                transition: "background 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.background = "rgba(0, 229, 255, 0.1)";
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) e.currentTarget.style.background = "transparent";
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-block",
                                  minWidth: "36px",
                                  textAlign: "center",
                                  padding: "3px 6px",
                                  borderRadius: "6px",
                                  fontWeight: "900",
                                  fontSize: "11px",
                                  background: "rgba(0, 229, 255, 0.12)",
                                  color: "#67e8f9",
                                  border: "1px solid rgba(0, 229, 255, 0.3)",
                                  flexShrink: 0,
                                }}
                              >
                                #{c.id}
                              </span>

                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "50%",
                                  overflow: "hidden",
                                  background: "#030814",
                                  border: c.image ? "1.5px solid #52c41a" : "1px solid rgba(0, 229, 255, 0.4)",
                                  flexShrink: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <AdminPhotoPreview src={c.image} name={c.name} size={36} />
                              </div>

                              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ fontWeight: "700", fontSize: "14px", color: isSelected ? "#00e5ff" : "#ffffff" }}>
                                    {c.nickname ? `${c.nickname} (${c.name})` : c.name}
                                  </span>
                                </div>
                                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {c.topic}
                                </div>
                              </div>

                              <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <div style={{ fontSize: "12px", fontWeight: "700", color: "#ffd700" }}>
                                  {c.totalScore ?? 0} คะแนน
                                </div>
                                {isSelected && (
                                  <span style={{ fontSize: "11px", color: "#00e5ff", fontWeight: "800" }}>
                                    ✓ กำลังเลือก
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={openAddModal}
                  style={{
                    padding: "12px 20px",
                    borderRadius: "10px",
                    background: "rgba(0, 229, 255, 0.15)",
                    border: "1.5px solid #00e5ff",
                    color: "#00e5ff",
                    fontSize: "14px",
                    fontWeight: "800",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  ➕ เพิ่มผู้เข้าแข่งขันใหม่
                </button>
              </div>

              {scoringNotice && (
                <div
                  style={{
                    marginTop: "14px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: scoringNotice.startsWith("✅") ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 77, 79, 0.15)",
                    color: scoringNotice.startsWith("✅") ? "#86efac" : "#ff7875",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  {scoringNotice}
                </div>
              )}
            </div>

            {/* Step 2: Scoring Form Cards */}
            {activeContestant ? (
              <div
                style={{
                  background: "linear-gradient(145deg, rgba(16, 32, 60, 0.8) 0%, rgba(10, 20, 40, 0.9) 100%)",
                  border: activeContestant.isPlaying ? "2px solid #00e5ff" : "1px solid rgba(0, 229, 255, 0.35)",
                  boxShadow: activeContestant.isPlaying ? "0 0 25px rgba(0, 229, 255, 0.3)" : "none",
                  borderRadius: "16px",
                  padding: "24px",
                }}
              >
                {/* Active Contestant Meta Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "16px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    paddingBottom: "18px",
                    marginBottom: "24px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        background: "#030814",
                        border: "2px solid #00e5ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        flexShrink: 0,
                      }}
                    >
                      <AdminPhotoPreview src={activeContestant.image} name={activeContestant.name} size={60} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff", margin: "0 0 4px 0" }}>
                        {activeContestant.name}{" "}
                        {activeContestant.nickname && <span style={{ color: "#ffd700" }}>({activeContestant.nickname})</span>}
                      </h3>
                      <p style={{ fontSize: "14px", color: "#ffd700", margin: 0, display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                        <span>📌 หัวข้อ: <strong>{activeContestant.topic}</strong></span>
                        {activeContestant.order && (
                          <span style={{ color: "#00e5ff", fontWeight: "700" }}>
                            • 🎲 ลำดับแข่ง #{activeContestant.order}
                          </span>
                        )}
                        {activeContestant.waitingNextMatch && (
                          <span
                            style={{
                              padding: "2px 10px",
                              borderRadius: "12px",
                              background: "rgba(99, 102, 241, 0.25)",
                              border: "1px solid #818cf8",
                              color: "#c7d2fe",
                              fontSize: "12px",
                              fontWeight: "700",
                            }}
                          >
                            ⏳ ในตาราง: รอลุ้นผลวันถัดไป
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    {/* Toggle Playing Button */}
                    <button
                      type="button"
                      onClick={() => handleTogglePlaying(activeContestant)}
                      style={{
                        padding: "10px 18px",
                        borderRadius: "12px",
                        background: activeContestant.isPlaying
                          ? "linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)"
                          : "rgba(0, 229, 255, 0.12)",
                        border: activeContestant.isPlaying ? "1.5px solid #ef4444" : "1.5px solid rgba(0, 229, 255, 0.4)",
                        color: "#ffffff",
                        fontSize: "14px",
                        fontWeight: "800",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: activeContestant.isPlaying ? "0 0 16px rgba(239, 68, 68, 0.6)" : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {activeContestant.isPlaying ? (
                        <>
                          <span
                            style={{
                              display: "inline-block",
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              background: "#fff",
                              boxShadow: "0 0 8px #fff",
                            }}
                          />
                          <span>🔴 กำลังแข่งขันอยู่บนเวที (คลิกเพื่อจบการแข่ง)</span>
                        </>
                      ) : (
                        <span>🎮 ตั้งเป็นคนกำลังแข่ง (ขึ้นเวที)</span>
                      )}
                    </button>

                    {/* Toggle Waiting Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleWaiting(activeContestant)}
                      style={{
                        padding: "10px 18px",
                        borderRadius: "12px",
                        background: activeContestant.waitingNextMatch
                          ? "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)"
                          : "rgba(99, 102, 241, 0.15)",
                        border: activeContestant.waitingNextMatch ? "1.5px solid #818cf8" : "1.5px solid rgba(129, 140, 248, 0.4)",
                        color: "#ffffff",
                        fontSize: "14px",
                        fontWeight: "800",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: activeContestant.waitingNextMatch ? "0 0 16px rgba(99, 102, 241, 0.5)" : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {activeContestant.waitingNextMatch ? "📋 อยู่ในตารางแล้ว (คลิกเพื่อนำออก)" : "⏳ ตั้งเป็นรอลุ้นผล"}
                    </button>

                    {/* Calculated Total Box */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        background: "rgba(0, 229, 255, 0.08)",
                        border: "1px solid rgba(0, 229, 255, 0.3)",
                        padding: "8px 18px",
                        borderRadius: "12px",
                      }}
                    >
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", display: "block" }}>คะแนนรวม</span>
                        <strong
                          style={{
                            fontSize: "26px",
                            color: activeCalculatedTotal === 100 ? "#52c41a" : "#ffd700",
                            fontFamily: "monospace",
                            textShadow: activeCalculatedTotal === 100 ? "0 0 12px rgba(82,196,26,0.8)" : "none",
                          }}
                        >
                          {activeCalculatedTotal}
                        </strong>
                        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}> / 100</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4 Category Scoring Grid */}
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#80d0ff",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>2️⃣ อัปเดตคะแนนทีละหมวด (0 - 25 คะแนนต่อหมวด)</span>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: "normal" }}>
                    กดปุ่มด่วนหรือกรอกตัวเลขแล้วกดบันทึก
                  </span>
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "16px",
                    marginBottom: "24px",
                  }}
                >
                  {/* Category 1: 3 วินาที */}
                  <div style={{ background: "rgba(0, 15, 30, 0.75)", border: "1px solid rgba(0, 229, 255, 0.25)", borderRadius: "14px", padding: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <strong style={{ fontSize: "16px", color: "#00e5ff", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>⏱️</span> 1. 3 วินาที
                      </strong>
                      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: "700" }}>
                        {activeScores["3sec"] !== "" ? `${activeScores["3sec"]}/25` : "ยังไม่ใส่"}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          const cur = Math.max(0, (Number(activeScores["3sec"]) || 0) - 1);
                          setActiveScores({ ...activeScores, "3sec": String(cur) });
                        }}
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "8px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          color: "#fff",
                          fontSize: "18px",
                          fontWeight: "800",
                          cursor: "pointer"
                        }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="25"
                        value={activeScores["3sec"]}
                        onChange={(e) => setActiveScores({ ...activeScores, "3sec": e.target.value })}
                        placeholder="0-25"
                        style={{
                          flex: 1,
                          padding: "10px",
                          borderRadius: "8px",
                          background: "#050b14",
                          border: "1px solid rgba(0, 229, 255, 0.4)",
                          color: "#ffd700",
                          fontSize: "20px",
                          fontWeight: "800",
                          textAlign: "center"
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const cur = Math.min(25, (Number(activeScores["3sec"]) || 0) + 1);
                          setActiveScores({ ...activeScores, "3sec": String(cur) });
                        }}
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "8px",
                          background: "rgba(0, 229, 255, 0.15)",
                          border: "1px solid rgba(0, 229, 255, 0.4)",
                          color: "#00e5ff",
                          fontSize: "18px",
                          fontWeight: "800",
                          cursor: "pointer"
                        }}
                      >
                        +
                      </button>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "12px" }}>
                      {[0, 5, 10, 15, 20, 25].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setActiveScores({ ...activeScores, "3sec": String(val) })}
                          style={{
                            flex: "1",
                            padding: "4px 6px",
                            fontSize: "12px",
                            borderRadius: "6px",
                            background: activeScores["3sec"] === String(val) ? "rgba(0, 229, 255, 0.3)" : "rgba(255,255,255,0.06)",
                            color: activeScores["3sec"] === String(val) ? "#00e5ff" : "#fff",
                            border: activeScores["3sec"] === String(val) ? "1px solid #00e5ff" : "1px solid rgba(255,255,255,0.12)",
                            fontWeight: activeScores["3sec"] === String(val) ? "800" : "500",
                            cursor: "pointer"
                          }}
                        >
                          {val}
                        </button>
                      ))}
                    </div>

                    {/* Mini Meter */}
                    <div style={{ width: "100%", height: "5px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden", marginBottom: "12px" }}>
                      <div style={{
                        width: `${Math.min(100, Math.max(0, ((Number(activeScores["3sec"]) || 0) / 25) * 100))}%`,
                        height: "100%",
                        background: (Number(activeScores["3sec"]) || 0) === 25 ? "linear-gradient(90deg, #ffd700, #52c41a)" : "linear-gradient(90deg, #00b4d8, #00e5ff)",
                        transition: "width 0.25s ease"
                      }} />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveCategoryScore("3sec")}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "8px",
                        background: "rgba(0, 180, 216, 0.25)",
                        border: "1px solid rgba(0, 229, 255, 0.4)",
                        color: "#00e5ff",
                        fontWeight: "700",
                        cursor: "pointer",
                        fontSize: "13px"
                      }}
                    >
                      💾 บันทึก 3 วินาที
                    </button>
                  </div>

                  {/* Category 2: ถาม-ตอบ */}
                  <div style={{ background: "rgba(0, 15, 30, 0.75)", border: "1px solid rgba(0, 229, 255, 0.25)", borderRadius: "14px", padding: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <strong style={{ fontSize: "16px", color: "#00e5ff", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>❓</span> 2. ถาม-ตอบ
                      </strong>
                      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: "700" }}>
                        {activeScores.qa !== "" ? `${activeScores.qa}/25` : "ยังไม่ใส่"}
                      </span>
                    </div>

                    {/* Quick Award Buttons: Correct (25) or Wrong (0) */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                      <button
                        type="button"
                        onClick={() => setActiveScores({ ...activeScores, qa: "25" })}
                        style={{
                          padding: "8px 6px",
                          borderRadius: "8px",
                          background: activeScores.qa === "25" ? "linear-gradient(135deg, #237804 0%, #52c41a 100%)" : "rgba(82, 196, 26, 0.15)",
                          border: activeScores.qa === "25" ? "1px solid #73d13d" : "1px solid rgba(82, 196, 26, 0.4)",
                          color: "#ffffff",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer",
                          boxShadow: activeScores.qa === "25" ? "0 0 12px rgba(82, 196, 26, 0.5)" : "none"
                        }}
                      >
                        ✅ ถูก 25 เต็ม
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveScores({ ...activeScores, qa: "0" })}
                        style={{
                          padding: "8px 6px",
                          borderRadius: "8px",
                          background: activeScores.qa === "0" ? "linear-gradient(135deg, #a8071a 0%, #ff4d4f 100%)" : "rgba(255, 77, 79, 0.15)",
                          border: activeScores.qa === "0" ? "1px solid #ff7875" : "1px solid rgba(255, 77, 79, 0.4)",
                          color: "#ffffff",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer",
                          boxShadow: activeScores.qa === "0" ? "0 0 12px rgba(255, 77, 79, 0.5)" : "none"
                        }}
                      >
                        ❌ ผิด 0 คะแนน
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                      <input
                        type="number"
                        min="0"
                        max="25"
                        value={activeScores.qa}
                        onChange={(e) => setActiveScores({ ...activeScores, qa: e.target.value })}
                        placeholder="คะแนน (0-25)"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          background: "#050b14",
                          border: "1px solid rgba(0, 229, 255, 0.4)",
                          color: "#ffd700",
                          fontSize: "18px",
                          fontWeight: "800",
                          textAlign: "center"
                        }}
                      />
                    </div>

                    {/* Presets */}
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "12px" }}>
                      {[0, 5, 10, 15, 20, 25].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setActiveScores({ ...activeScores, qa: String(val) })}
                          style={{
                            flex: "1",
                            padding: "4px 6px",
                            fontSize: "12px",
                            borderRadius: "6px",
                            background: activeScores.qa === String(val) ? "rgba(0, 229, 255, 0.3)" : "rgba(255,255,255,0.06)",
                            color: activeScores.qa === String(val) ? "#00e5ff" : "#fff",
                            border: activeScores.qa === String(val) ? "1px solid #00e5ff" : "1px solid rgba(255,255,255,0.12)",
                            fontWeight: activeScores.qa === String(val) ? "800" : "500",
                            cursor: "pointer"
                          }}
                        >
                          {val}
                        </button>
                      ))}
                    </div>

                    {/* Mini Meter */}
                    <div style={{ width: "100%", height: "5px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden", marginBottom: "12px" }}>
                      <div style={{
                        width: `${Math.min(100, Math.max(0, ((Number(activeScores.qa) || 0) / 25) * 100))}%`,
                        height: "100%",
                        background: (Number(activeScores.qa) || 0) === 25 ? "linear-gradient(90deg, #ffd700, #52c41a)" : "linear-gradient(90deg, #00b4d8, #00e5ff)",
                        transition: "width 0.25s ease"
                      }} />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveCategoryScore("qa")}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "8px",
                        background: "rgba(0, 180, 216, 0.25)",
                        border: "1px solid rgba(0, 229, 255, 0.4)",
                        color: "#00e5ff",
                        fontWeight: "700",
                        cursor: "pointer",
                        fontSize: "13px"
                      }}
                    >
                      💾 บันทึก ถาม-ตอบ
                    </button>
                  </div>

                  {/* Category 3: จิ๊กซอว์ */}
                  <div style={{ background: "rgba(0, 15, 30, 0.75)", border: "1px solid rgba(0, 229, 255, 0.25)", borderRadius: "14px", padding: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <strong style={{ fontSize: "16px", color: "#00e5ff", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>🧩</span> 3. จิ๊กซอว์
                      </strong>
                      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: "700" }}>
                        {activeScores.jigsaw !== "" ? `${activeScores.jigsaw}/25` : "ยังไม่ใส่"}
                      </span>
                    </div>

                    {/* Quick Award Buttons */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                      <button
                        type="button"
                        onClick={() => setActiveScores({ ...activeScores, jigsaw: "25" })}
                        style={{
                          padding: "8px 6px",
                          borderRadius: "8px",
                          background: activeScores.jigsaw === "25" ? "linear-gradient(135deg, #237804 0%, #52c41a 100%)" : "rgba(82, 196, 26, 0.15)",
                          border: activeScores.jigsaw === "25" ? "1px solid #73d13d" : "1px solid rgba(82, 196, 26, 0.4)",
                          color: "#ffffff",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer",
                          boxShadow: activeScores.jigsaw === "25" ? "0 0 12px rgba(82, 196, 26, 0.5)" : "none"
                        }}
                      >
                        ✅ ตอบถูก 25 เต็ม
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveScores({ ...activeScores, jigsaw: "0" })}
                        style={{
                          padding: "8px 6px",
                          borderRadius: "8px",
                          background: activeScores.jigsaw === "0" ? "linear-gradient(135deg, #a8071a 0%, #ff4d4f 100%)" : "rgba(255, 77, 79, 0.15)",
                          border: activeScores.jigsaw === "0" ? "1px solid #ff7875" : "1px solid rgba(255, 77, 79, 0.4)",
                          color: "#ffffff",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer",
                          boxShadow: activeScores.jigsaw === "0" ? "0 0 12px rgba(255, 77, 79, 0.5)" : "none"
                        }}
                      >
                        ❌ ตอบผิด 0 คะแนน
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                      <input
                        type="number"
                        min="0"
                        max="25"
                        value={activeScores.jigsaw}
                        onChange={(e) => setActiveScores({ ...activeScores, jigsaw: e.target.value })}
                        placeholder="คะแนน (0-25)"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          background: "#050b14",
                          border: "1px solid rgba(0, 229, 255, 0.4)",
                          color: "#ffd700",
                          fontSize: "18px",
                          fontWeight: "800",
                          textAlign: "center"
                        }}
                      />
                    </div>

                    {/* Presets */}
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "12px" }}>
                      {[0, 5, 10, 15, 20, 25].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setActiveScores({ ...activeScores, jigsaw: String(val) })}
                          style={{
                            flex: "1",
                            padding: "4px 6px",
                            fontSize: "12px",
                            borderRadius: "6px",
                            background: activeScores.jigsaw === String(val) ? "rgba(0, 229, 255, 0.3)" : "rgba(255,255,255,0.06)",
                            color: activeScores.jigsaw === String(val) ? "#00e5ff" : "#fff",
                            border: activeScores.jigsaw === String(val) ? "1px solid #00e5ff" : "1px solid rgba(255,255,255,0.12)",
                            fontWeight: activeScores.jigsaw === String(val) ? "800" : "500",
                            cursor: "pointer"
                          }}
                        >
                          {val}
                        </button>
                      ))}
                    </div>

                    {/* Mini Meter */}
                    <div style={{ width: "100%", height: "5px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden", marginBottom: "12px" }}>
                      <div style={{
                        width: `${Math.min(100, Math.max(0, ((Number(activeScores.jigsaw) || 0) / 25) * 100))}%`,
                        height: "100%",
                        background: (Number(activeScores.jigsaw) || 0) === 25 ? "linear-gradient(90deg, #ffd700, #52c41a)" : "linear-gradient(90deg, #00b4d8, #00e5ff)",
                        transition: "width 0.25s ease"
                      }} />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveCategoryScore("jigsaw")}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "8px",
                        background: "rgba(0, 180, 216, 0.25)",
                        border: "1px solid rgba(0, 229, 255, 0.4)",
                        color: "#00e5ff",
                        fontWeight: "700",
                        cursor: "pointer",
                        fontSize: "13px"
                      }}
                    >
                      💾 บันทึก จิ๊กซอว์
                    </button>
                  </div>

                  {/* Category 4: คุณสมบัติ */}
                  <div style={{ background: "rgba(0, 15, 30, 0.75)", border: "1px solid rgba(0, 229, 255, 0.25)", borderRadius: "14px", padding: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <strong style={{ fontSize: "16px", color: "#00e5ff", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>🏷️</span> 4. คุณสมบัติ
                      </strong>
                      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: "700" }}>
                        {activeScores.attribute !== "" ? `${activeScores.attribute}/25` : "ยังไม่ใส่"}
                      </span>
                    </div>

                    {/* Quick Award Buttons */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                      <button
                        type="button"
                        onClick={() => setActiveScores({ ...activeScores, attribute: "25" })}
                        style={{
                          padding: "8px 6px",
                          borderRadius: "8px",
                          background: activeScores.attribute === "25" ? "linear-gradient(135deg, #237804 0%, #52c41a 100%)" : "rgba(82, 196, 26, 0.15)",
                          border: activeScores.attribute === "25" ? "1px solid #73d13d" : "1px solid rgba(82, 196, 26, 0.4)",
                          color: "#ffffff",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer",
                          boxShadow: activeScores.attribute === "25" ? "0 0 12px rgba(82, 196, 26, 0.5)" : "none"
                        }}
                      >
                        ✅ ตอบถูก 25 เต็ม
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveScores({ ...activeScores, attribute: "0" })}
                        style={{
                          padding: "8px 6px",
                          borderRadius: "8px",
                          background: activeScores.attribute === "0" ? "linear-gradient(135deg, #a8071a 0%, #ff4d4f 100%)" : "rgba(255, 77, 79, 0.15)",
                          border: activeScores.attribute === "0" ? "1px solid #ff7875" : "1px solid rgba(255, 77, 79, 0.4)",
                          color: "#ffffff",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer",
                          boxShadow: activeScores.attribute === "0" ? "0 0 12px rgba(255, 77, 79, 0.5)" : "none"
                        }}
                      >
                        ❌ ตอบผิด 0 คะแนน
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                      <input
                        type="number"
                        min="0"
                        max="25"
                        value={activeScores.attribute}
                        onChange={(e) => setActiveScores({ ...activeScores, attribute: e.target.value })}
                        placeholder="คะแนน (0-25)"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          background: "#050b14",
                          border: "1px solid rgba(0, 229, 255, 0.4)",
                          color: "#ffd700",
                          fontSize: "18px",
                          fontWeight: "800",
                          textAlign: "center"
                        }}
                      />
                    </div>

                    {/* Presets */}
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "12px" }}>
                      {[0, 5, 10, 15, 20, 25].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setActiveScores({ ...activeScores, attribute: String(val) })}
                          style={{
                            flex: "1",
                            padding: "4px 6px",
                            fontSize: "12px",
                            borderRadius: "6px",
                            background: activeScores.attribute === String(val) ? "rgba(0, 229, 255, 0.3)" : "rgba(255,255,255,0.06)",
                            color: activeScores.attribute === String(val) ? "#00e5ff" : "#fff",
                            border: activeScores.attribute === String(val) ? "1px solid #00e5ff" : "1px solid rgba(255,255,255,0.12)",
                            fontWeight: activeScores.attribute === String(val) ? "800" : "500",
                            cursor: "pointer"
                          }}
                        >
                          {val}
                        </button>
                      ))}
                    </div>

                    {/* Mini Meter */}
                    <div style={{ width: "100%", height: "5px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden", marginBottom: "12px" }}>
                      <div style={{
                        width: `${Math.min(100, Math.max(0, ((Number(activeScores.attribute) || 0) / 25) * 100))}%`,
                        height: "100%",
                        background: (Number(activeScores.attribute) || 0) === 25 ? "linear-gradient(90deg, #ffd700, #52c41a)" : "linear-gradient(90deg, #00b4d8, #00e5ff)",
                        transition: "width 0.25s ease"
                      }} />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveCategoryScore("attribute")}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "8px",
                        background: "rgba(0, 180, 216, 0.25)",
                        border: "1px solid rgba(0, 229, 255, 0.4)",
                        color: "#00e5ff",
                        fontWeight: "700",
                        cursor: "pointer",
                        fontSize: "13px"
                      }}
                    >
                      💾 บันทึก คุณสมบัติ
                    </button>
                  </div>
                </div>

                {/* Grand Action Bar */}
                <div
                  style={{
                    background: "rgba(0, 15, 30, 0.75)",
                    border: "1.5px solid rgba(0, 229, 255, 0.35)",
                    borderRadius: "14px",
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "700", color: "#80d0ff" }}>
                      🎲 ลำดับการแข่ง (Order):
                    </label>
                    <input
                      type="number"
                      value={orderInput}
                      onChange={(e) => setOrderInput(e.target.value)}
                      placeholder="เช่น 1, 2, 3..."
                      style={{
                        width: "90px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        background: "#050b14",
                        border: "1px solid rgba(0, 229, 255, 0.4)",
                        color: "#ffffff",
                        fontSize: "15px",
                        fontWeight: "800",
                        textAlign: "center",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={handleSaveAllScores}
                      disabled={isSavingScore}
                      style={{
                        padding: "12px 28px",
                        borderRadius: "10px",
                        background: "linear-gradient(90deg, #00e5ff 0%, #0077b6 100%)",
                        border: "none",
                        color: "#030814",
                        fontSize: "15px",
                        fontWeight: "900",
                        cursor: isSavingScore ? "wait" : "pointer",
                        boxShadow: "0 0 20px rgba(0, 229, 255, 0.45)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span>💾</span> บันทึกคะแนนทั้งหมด 4 หมวด ({activeCalculatedTotal} คะแนน)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "50px 20px",
                  background: "rgba(0, 15, 30, 0.5)",
                  borderRadius: "16px",
                  border: "1px dashed rgba(0, 229, 255, 0.3)",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>🤟</div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff" }}>
                  กรุณาเลือกผู้เข้าแข่งขันจากช่องด้านบน
                </div>
                <div style={{ fontSize: "13px", marginTop: "4px" }}>
                  เพื่อเปิดหน้าต่างกรอกคะแนนแบบละเอียดและควบคุมสถานะ On-Air
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: CONTESTANTS & PHOTOS (Matching Main Admin)
           ======================================================== */}
        {/* ========================================================
            TAB: POLL RANKING MANAGEMENT (Matching Main Admin)
           ======================================================== */}
        {activeTab === "poll" && (
          isMaintainer ? (
            <div
              style={{
                background: "linear-gradient(145deg, rgba(20, 15, 30, 0.9) 0%, rgba(10, 8, 20, 0.95) 100%)",
                border: "1.5px solid rgba(255, 75, 143, 0.4)",
                borderRadius: "16px",
                padding: "48px 24px",
                textAlign: "center",
                maxWidth: "600px",
                margin: "40px auto",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ fontSize: "56px", marginBottom: "16px" }}>🔒</div>
              <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#f472b6", marginBottom: "8px" }}>
                สิทธิ์การเข้าถึงจำกัด (Restricted Access)
              </h3>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.75)", lineHeight: "1.7", margin: 0 }}>
                โพลล์แห่งปี (The Trial FOTY Poll) สงวนสิทธิ์เฉพาะ <strong>Admin</strong> หรือ <strong>Main Admin</strong> เท่านั้น
                <br />
                <span style={{ fontSize: "13px", color: "#fca5a5" }}>
                  บทบาท Maintainer ไม่สามารถเข้าถึงหรือจัดการระบบโพลล์ได้เพื่อความปลอดภัยและป้องกันสปอยล์
                </span>
              </p>
              <div style={{ marginTop: "16px", display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "20px", background: "rgba(255, 75, 143, 0.15)", border: "1px solid rgba(255, 75, 143, 0.4)", color: "#f472b6", fontSize: "12px", fontWeight: "700" }}>
                🛠️ สถานะบัญชีของคุณ: Maintainer (ผู้ดูแลข้อมูลการแข่งขัน)
              </div>
            </div>
          ) : (
          <div>
            {/* Header & Action Bar */}
            <div
              style={{
                background: "linear-gradient(145deg, rgba(16, 32, 60, 0.85) 0%, rgba(10, 20, 40, 0.95) 100%)",
                border: "1px solid rgba(255, 215, 0, 0.3)",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "20px",
                      fontWeight: "800",
                      color: "#ffd700",
                      margin: "0 0 6px 0",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>📊</span> จัดการตารางอันดับโพลล์ The Trial (Poll Rankings)
                  </h2>
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: "1.6" }}>
                    ตารางนี้จะแสดงบนหน้าตารางคะแนน (/trial-foty) และหน้าโหวต (/trial-foty/vote)<br />
                    💡 <strong>สูตรคะแนนโพลล์:</strong> สัดส่วนรอบอุ่นเครื่อง What If? (30%) คิดจาก [คะแนนคนนี้ ÷ คะแนนรวมทุกคน] × 30% + สัดส่วนโพลล์มหาชน (70%) คิดจาก [คะแนนโหวตคนนี้ ÷ คะแนนโหวตรวมทุกคน] × 70% รวมกันทั้งสิ้น <strong>100%</strong><br />คุณสามารถใส่คะแนน What If?, แก้ไขคะแนนโหวต หรือกดปุ่ม <strong>"🧮 คำนวณ % โพลล์"</strong> แล้วกด <strong>"บันทึกผลโพลล์ทั้งหมด"</strong>
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Link
                    href="/trial-foty/vote"
                    target="_blank"
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      background: "rgba(255, 215, 0, 0.15)",
                      border: "1px solid rgba(255, 215, 0, 0.5)",
                      color: "#ffd700",
                      fontSize: "13px",
                      fontWeight: "700",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    🗳️ เปิดหน้าโหวตมหาชน
                  </Link>

                  <button
                    type="button"
                    onClick={handleAutoCalculatePercent}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, rgba(0, 229, 255, 0.2) 0%, rgba(255, 215, 0, 0.2) 100%)",
                      border: "1.5px solid #ffd700",
                      color: "#ffd700",
                      fontSize: "13px",
                      fontWeight: "800",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 0 12px rgba(255, 215, 0, 0.25)",
                    }}
                    title="คำนวณเปอร์เซ็นต์โพลล์ตามสูตร: โหวตมหาชน 70% + รอบอุ่นเครื่อง (What If?) 30%"
                  >
                    🧮 คำนวณ % โพลล์ (โหวต 70% + What If 30%)
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncGameScores}
                    disabled={syncingGameScores}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(0, 229, 255, 0.2) 100%)",
                      border: "1.5px solid #10b981",
                      color: "#86efac",
                      fontSize: "13px",
                      fontWeight: "800",
                      cursor: syncingGameScores ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 0 12px rgba(16, 185, 129, 0.25)",
                    }}
                    title="ดึงคะแนน 100 คะแนนเต็มจากห้องเกม (/game) มาอัปเดตเป็นคะแนนรอบอุ่นเครื่อง (30%) และคำนวณ % โพลล์อัตโนมัติ"
                  >
                    {syncingGameScores ? "⏳ กำลังซิงค์..." : "🎮 ซิงค์คะแนนจากเกม (/game)"}
                  </button>

                  <button
                    type="button"
                    onClick={handleAutoSortByVotes}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: "rgba(0, 229, 255, 0.12)",
                      border: "1px solid rgba(0, 229, 255, 0.4)",
                      color: "#67e8f9",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                    title="เรียงอันดับ 1 ถึง 40 ตามคะแนนโพลล์ % รวม (โหวต + What If) จากมากไปน้อย"
                  >
                    📶 จัดอันดับตามคะแนนโพลล์
                  </button>

                  <button
                    type="button"
                    onClick={handleAddPollItem}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      background: "rgba(0, 229, 255, 0.15)",
                      border: "1px solid rgba(0, 229, 255, 0.5)",
                      color: "#00e5ff",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    ➕ เพิ่มคนในโพลล์
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncPhotosToPoll}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: "rgba(0, 229, 255, 0.15)",
                      border: "1px solid rgba(0, 229, 255, 0.4)",
                      color: "#67e8f9",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                    title="ดึงรูปภาพล่าสุดจากรายชื่อผู้เข้าแข่งขันมาอัปเดตในตารางโพลล์ทันที"
                  >
                    🔄 ซิงค์รูปภาพจากรายชื่อ
                  </button>

                  <button
                    type="button"
                    onClick={handleResetPoll}
                    disabled={savingPoll}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      color: "rgba(255, 255, 255, 0.8)",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: savingPoll ? "not-allowed" : "pointer",
                    }}
                  >
                    🔄 รีเซ็ตค่าเริ่มต้น (40 คน)
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAllPoll}
                    disabled={savingPoll}
                    style={{
                      padding: "10px 22px",
                      borderRadius: "8px",
                      background: "linear-gradient(90deg, #ffd700 0%, #ffb703 100%)",
                      border: "none",
                      color: "#030812",
                      fontSize: "14px",
                      fontWeight: "800",
                      cursor: savingPoll ? "not-allowed" : "pointer",
                      boxShadow: "0 0 16px rgba(255, 215, 0, 0.35)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {savingPoll ? "⏳ กำลังบันทึก..." : "💾 บันทึกผลโพลล์ทั้งหมด"}
                  </button>
                </div>
              </div>

              {/* Voting Open / Close Toggle Control Box */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "14px",
                  padding: "16px 20px",
                  borderRadius: "14px",
                  background: votingOpen
                    ? "linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 78, 59, 0.25) 100%)"
                    : "linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(127, 29, 29, 0.25) 100%)",
                  border: votingOpen ? "1.5px solid rgba(16, 185, 129, 0.45)" : "1.5px solid rgba(239, 68, 68, 0.45)",
                  boxShadow: votingOpen ? "0 0 16px rgba(16, 185, 129, 0.15)" : "0 0 16px rgba(239, 68, 68, 0.15)",
                  marginBottom: "16px",
                }}
              >
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: togglingVoting ? "not-allowed" : "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={votingOpen}
                    disabled={togglingVoting}
                    onChange={(e) => handleToggleVoting(e.target.checked)}
                    style={{
                      width: "22px",
                      height: "22px",
                      cursor: togglingVoting ? "not-allowed" : "pointer",
                      accentColor: "#10b981",
                    }}
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: "15px",
                          fontWeight: "900",
                          color: votingOpen ? "#4ade80" : "#f87171",
                        }}
                      >
                        {votingOpen ? "🟢 เปิดรับการโหวตโพลล์มหาชน (Voting Open)" : "🔴 ปิดรับการโหวตโพลล์มหาชน (Voting Closed)"}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "800",
                          padding: "2px 8px",
                          borderRadius: "20px",
                          background: votingOpen ? "rgba(74, 222, 128, 0.2)" : "rgba(248, 113, 113, 0.2)",
                          color: votingOpen ? "#86efac" : "#fca5a5",
                          border: votingOpen ? "1px solid rgba(74, 222, 128, 0.4)" : "1px solid rgba(248, 113, 113, 0.4)",
                        }}
                      >
                        {votingOpen ? "เปิดให้ผู้ชมโหวตอยู่" : "ปิดรับโหวตแล้ว"}
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", margin: "3px 0 0" }}>
                      {votingOpen
                        ? "ผู้ชมสามารถเข้าหน้า /trial-foty/vote และส่งคะแนนโหวตได้ตามปกติ (อันดับ 1-5 และแชมป์)"
                        : "หน้า /trial-foty/vote จะขึ้นแถบแจ้งเตือนปิดรับโหวต และบล็อกไม่ให้ส่งคะแนน"}
                    </p>
                  </div>
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    disabled={togglingVoting}
                    onClick={() => handleToggleVoting(!votingOpen)}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      background: votingOpen ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                      border: votingOpen ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(16, 185, 129, 0.5)",
                      color: votingOpen ? "#fca5a5" : "#86efac",
                      fontSize: "13px",
                      fontWeight: "800",
                      cursor: togglingVoting ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s",
                    }}
                  >
                    {togglingVoting
                      ? "⏳ กำลังบันทึก..."
                      : votingOpen
                      ? "🔒 คลิกเพื่อปิดรับโหวต"
                      : "🔓 คลิกเพื่อเปิดรับโหวต"}
                  </button>
                </div>
              </div>

              {/* Real-time Poll Status Box */}
              <div
                style={{
                  padding: "18px 20px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, rgba(16, 32, 60, 0.95) 0%, rgba(8, 18, 36, 0.98) 100%)",
                  border: "1.5px solid rgba(0, 229, 255, 0.4)",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
                  marginBottom: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "14px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "20px" }}>⚡</span>
                    <span style={{ fontSize: "16px", fontWeight: "800", color: "#00e5ff" }}>
                      ระบบคำนวณผลโพลล์แบบเรียลไทม์ (Direct Real-time Sync)
                    </span>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "20px",
                        background: "rgba(16, 185, 129, 0.2)",
                        border: "1px solid #10b981",
                        color: "#86efac",
                        fontSize: "11px",
                        fontWeight: "800",
                      }}
                    >
                      🔒 เฉพาะ Main Admin & Admin
                    </span>
                  </div>
                  <p style={{ fontSize: "12.5px", color: "rgba(255, 255, 255, 0.75)", margin: "4px 0 0", lineHeight: "1.6" }}>
                    เมื่อมีผู้เข้าชมส่งผลโหวตจาก <code>/trial-foty/vote</code> คะแนนโหวต (อันดับ 1-5 และแชมป์) จะถูกบันทึกและคำนวณ % ตามสูตร (โหวต 70% + อุ่นเครื่อง 30%) ลงในตารางนี้ทันทีโดยอัตโนมัติ โดยไม่ผ่านภายนอก ปลอดภัย 100%
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={fetchContestants}
                    style={{
                      padding: "9px 16px",
                      borderRadius: "8px",
                      background: "rgba(0, 229, 255, 0.15)",
                      border: "1px solid rgba(0, 229, 255, 0.4)",
                      color: "#67e8f9",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    🔄 รีเฟรชตารางโพลล์สด
                  </button>
                </div>
              </div>

              {/* Poll Table on Trial Front Page Toggle Control Box */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "14px",
                  padding: "16px 20px",
                  borderRadius: "14px",
                  background: showPollTable
                    ? "linear-gradient(90deg, rgba(255, 215, 0, 0.15) 0%, rgba(60, 40, 6, 0.25) 100%)"
                    : "linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(127, 29, 29, 0.25) 100%)",
                  border: showPollTable ? "1.5px solid rgba(255, 215, 0, 0.45)" : "1.5px solid rgba(239, 68, 68, 0.45)",
                  boxShadow: showPollTable ? "0 0 16px rgba(255, 215, 0, 0.15)" : "0 0 16px rgba(239, 68, 68, 0.15)",
                  marginBottom: "16px",
                }}
              >
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: togglingPollTable ? "not-allowed" : "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showPollTable}
                    disabled={togglingPollTable}
                    onChange={(e) => handleToggleTrialPollTable(e.target.checked)}
                    style={{
                      width: "22px",
                      height: "22px",
                      cursor: togglingPollTable ? "not-allowed" : "pointer",
                      accentColor: "#ffd700",
                    }}
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: "15px",
                          fontWeight: "900",
                          color: showPollTable ? "#ffd700" : "#f87171",
                        }}
                      >
                        {showPollTable ? "📊 เปิดแสดงตารางโพลล์ในหน้า Trial FOTY (Poll Table Active)" : "🔴 ปิดซ่อนตารางโพลล์ในหน้า Trial FOTY (Poll Table Hidden)"}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "800",
                          padding: "2px 8px",
                          borderRadius: "20px",
                          background: showPollTable ? "rgba(255, 215, 0, 0.2)" : "rgba(248, 113, 113, 0.2)",
                          color: showPollTable ? "#fde047" : "#fca5a5",
                          border: showPollTable ? "1px solid rgba(255, 215, 0, 0.4)" : "1px solid rgba(248, 113, 113, 0.4)",
                        }}
                      >
                        {showPollTable ? "แสดงในหน้า /trial-foty" : "ซ่อนจากหน้า /trial-foty"}
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", margin: "3px 0 0" }}>
                      {showPollTable
                        ? "ผู้ชมสามารถกดดูแท็บ '📊 ตารางอันดับโพลล์ (Poll)' ที่หน้า /trial-foty ได้ตามปกติ"
                        : "ซ่อนแท็บและตารางอันดับโพลล์จากหน้า /trial-foty ผู้ชมทั่วไปจะไม่เห็นตารางนี้"}
                    </p>
                  </div>
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    disabled={togglingPollTable}
                    onClick={() => handleToggleTrialPollTable(!showPollTable)}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      background: showPollTable ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 215, 0, 0.2)",
                      border: showPollTable ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(255, 215, 0, 0.5)",
                      color: showPollTable ? "#fca5a5" : "#ffd700",
                      fontSize: "13px",
                      fontWeight: "800",
                      cursor: togglingPollTable ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s",
                    }}
                  >
                    {togglingPollTable
                      ? "⏳ กำลังบันทึก..."
                      : showPollTable
                      ? "🔒 คลิกเพื่อปิดซ่อน"
                      : "🔓 คลิกเพื่อเปิดแสดง"}
                  </button>
                </div>
              </div>

              {/* Spoiler Shield Toggle Control Box */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "14px",
                  padding: "16px 20px",
                  borderRadius: "14px",
                  background: hideTrialPollScores
                    ? "linear-gradient(90deg, rgba(56, 189, 248, 0.15) 0%, rgba(12, 74, 110, 0.25) 100%)"
                    : "linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, rgba(30, 41, 59, 0.2) 100%)",
                  border: hideTrialPollScores ? "1.5px solid rgba(56, 189, 248, 0.5)" : "1.5px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: hideTrialPollScores ? "0 0 16px rgba(56, 189, 248, 0.15)" : "none",
                  marginBottom: "16px",
                }}
              >
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: togglingHideScores ? "not-allowed" : "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={hideTrialPollScores}
                    disabled={togglingHideScores}
                    onChange={(e) => handleToggleHideScores(e.target.checked)}
                    style={{
                      width: "22px",
                      height: "22px",
                      cursor: togglingHideScores ? "not-allowed" : "pointer",
                      accentColor: "#38bdf8",
                    }}
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: "15px",
                          fontWeight: "900",
                          color: hideTrialPollScores ? "#38bdf8" : "#cbd5e1",
                        }}
                      >
                        {hideTrialPollScores ? "🛡️ ปิดการมองเห็นคะแนนโพลล์ระหว่างโหวต (เปิดโหมดกันสปอยล์)" : "🔓 แสดงคะแนนโพลล์สดตามปกติ (ปิดโหมดกันสปอยล์)"}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "800",
                          padding: "2px 8px",
                          borderRadius: "20px",
                          background: hideTrialPollScores ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.1)",
                          color: hideTrialPollScores ? "#7dd3fc" : "#94a3b8",
                          border: hideTrialPollScores ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        {hideTrialPollScores ? "ซ่อนคะแนน/อันดับสดสำหรับผู้ชมทั่วไป" : "แสดงคะแนนจริง"}
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", margin: "3px 0 0" }}>
                      {hideTrialPollScores
                        ? "ผู้ชมทั่วไปในหน้า /trial-foty จะเห็นคะแนนเป็น '🔒 รอสรุปผล' และไม่แสดงอันดับ เพื่อไม่ให้ชี้นำการโหวตและรักษาความตื่นเต้น (แอดมินยังคงเห็นคะแนนจริงในห้องนี้)"
                        : "ผู้ชมทั่วไปสามารถมองเห็นคะแนน % และอันดับคะแนนสดได้ตามปกติ"}
                    </p>
                  </div>
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    disabled={togglingHideScores}
                    onClick={() => handleToggleHideScores(!hideTrialPollScores)}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      background: hideTrialPollScores ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.1)",
                      border: hideTrialPollScores ? "1px solid rgba(56, 189, 248, 0.5)" : "1px solid rgba(255, 255, 255, 0.3)",
                      color: hideTrialPollScores ? "#7dd3fc" : "#ffffff",
                      fontSize: "13px",
                      fontWeight: "800",
                      cursor: togglingHideScores ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s",
                    }}
                  >
                    {togglingHideScores
                      ? "⏳ กำลังบันทึก..."
                      : hideTrialPollScores
                      ? "🔓 ปิดโหมดกันสปอยล์"
                      : "🛡️ เปิดโหมดกันสปอยล์"}
                  </button>
                </div>
              </div>

              {/* Warm-up Table on Front Page Toggle Control Box */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "14px",
                  padding: "16px 20px",
                  borderRadius: "14px",
                  background: showWarmupTable
                    ? "linear-gradient(90deg, rgba(0, 229, 255, 0.15) 0%, rgba(6, 40, 80, 0.25) 100%)"
                    : "linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(127, 29, 29, 0.25) 100%)",
                  border: showWarmupTable ? "1.5px solid rgba(0, 229, 255, 0.45)" : "1.5px solid rgba(239, 68, 68, 0.45)",
                  boxShadow: showWarmupTable ? "0 0 16px rgba(0, 229, 255, 0.15)" : "0 0 16px rgba(239, 68, 68, 0.15)",
                  marginBottom: "16px",
                }}
              >
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: togglingWarmupTable ? "not-allowed" : "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showWarmupTable}
                    disabled={togglingWarmupTable}
                    onChange={(e) => handleToggleWarmupTable(e.target.checked)}
                    style={{
                      width: "22px",
                      height: "22px",
                      cursor: togglingWarmupTable ? "not-allowed" : "pointer",
                      accentColor: "#00e5ff",
                    }}
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: "15px",
                          fontWeight: "900",
                          color: showWarmupTable ? "#00e5ff" : "#f87171",
                        }}
                      >
                        {showWarmupTable ? "🔥 เปิดแสดงตารางรอบอุ่นเครื่องในหน้าแรก (Warm-up Table Active)" : "🔴 ปิดซ่อนตารางรอบอุ่นเครื่องในหน้าแรก (Warm-up Table Hidden)"}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "800",
                          padding: "2px 8px",
                          borderRadius: "20px",
                          background: showWarmupTable ? "rgba(0, 229, 255, 0.2)" : "rgba(248, 113, 113, 0.2)",
                          color: showWarmupTable ? "#67e8f9" : "#fca5a5",
                          border: showWarmupTable ? "1px solid rgba(0, 229, 255, 0.4)" : "1px solid rgba(248, 113, 113, 0.4)",
                        }}
                      >
                        {showWarmupTable ? "แสดงในหน้าแรก (/trial-foty)" : "ซ่อนจากหน้าแรก"}
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", margin: "3px 0 0" }}>
                      {showWarmupTable
                        ? "ผู้ชมสามารถกดดูแท็บ '🔥 ตารางรอบอุ่นเครื่อง' ที่หน้าแรก (/trial-foty) เพื่อดูคะแนนจากห้องเล่นเกม 4 หมวดเต็ม 100 และสัดส่วน 30% ของโพลล์ได้"
                        : "ซ่อนแท็บตารางรอบอุ่นเครื่องจากหน้าแรก (/trial-foty) ผู้ชมทั่วไปจะไม่เห็นตารางนี้"}
                    </p>
                  </div>
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    disabled={togglingWarmupTable}
                    onClick={() => handleToggleWarmupTable(!showWarmupTable)}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      background: showWarmupTable ? "rgba(239, 68, 68, 0.2)" : "rgba(0, 229, 255, 0.2)",
                      border: showWarmupTable ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(0, 229, 255, 0.5)",
                      color: showWarmupTable ? "#fca5a5" : "#67e8f9",
                      fontSize: "13px",
                      fontWeight: "800",
                      cursor: togglingWarmupTable ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s",
                    }}
                  >
                    {togglingWarmupTable
                      ? "⏳ กำลังบันทึก..."
                      : showWarmupTable
                      ? "🔒 คลิกเพื่อปิดซ่อน"
                      : "🔓 คลิกเพื่อเปิดแสดง"}
                  </button>
                </div>
              </div>

              {pollNotice && (
                <div
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    background: pollNotice.startsWith("✅") ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 77, 79, 0.15)",
                    color: pollNotice.startsWith("✅") ? "#86efac" : "#ff7875",
                    fontWeight: "700",
                    fontSize: "14px",
                  }}
                >
                  {pollNotice}
                </div>
              )}
            </div>

            {/* Poll Table Editor */}
            <div
              style={{
                background: "linear-gradient(145deg, rgba(16, 32, 60, 0.85) 0%, rgba(10, 20, 40, 0.95) 100%)",
                border: "1px solid rgba(0, 229, 255, 0.25)",
                borderRadius: "16px",
                padding: "20px",
                overflowX: "auto",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1280px", fontSize: "14px" }}>
                <thead>
                  <tr style={{ background: "rgba(0, 229, 255, 0.12)", borderBottom: "1px solid rgba(0, 229, 255, 0.3)" }}>
                    <th rowSpan={2} style={{ padding: "10px 8px", textAlign: "center", width: "70px", color: "#ffd700", fontWeight: "800" }}>อันดับ</th>
                    <th rowSpan={2} style={{ padding: "10px 4px", textAlign: "center", width: "48px", color: "#80d0ff" }}>รูป</th>
                    <th rowSpan={2} style={{ padding: "10px 10px", textAlign: "left", minWidth: "160px", color: "#80d0ff" }}>ชื่อจริง - นามสกุล</th>
                    <th rowSpan={2} style={{ padding: "10px 8px", textAlign: "left", width: "140px", minWidth: "140px", color: "#80d0ff" }}>ชื่อเล่น</th>
                    <th rowSpan={2} style={{ padding: "10px 8px", textAlign: "left", minWidth: "170px", color: "#80d0ff" }}>หัวข้อแฟนพันธุ์แท้</th>
                    <th rowSpan={2} style={{ padding: "10px 8px", textAlign: "left", width: "170px", minWidth: "170px", color: "#ffaa40", fontWeight: "900", background: "rgba(255, 136, 0, 0.12)", borderLeft: "1px solid rgba(255, 136, 0, 0.4)" }} title="นัดหมายวัน-เวลาแข่งรอบอุ่นเครื่อง (หากระบุไว้ จะแสดงชื่อในตารางอุ่นเครื่องทันที)">
                      🗓️ นัดแข่งอุ่นเครื่อง<br /><span style={{ fontSize: "11px", fontWeight: "700", color: "#ffedd5" }}>(วัน-เวลาแข่ง)</span>
                    </th>
                    <th rowSpan={2} style={{ padding: "10px 6px", textAlign: "center", width: "100px", color: "#ff8800", fontWeight: "900", background: "rgba(255, 136, 0, 0.12)", borderLeft: "1px solid rgba(255, 136, 0, 0.4)" }} title="คะแนนรอบอุ่นเครื่อง What If? (เต็ม 100) คิดเป็นสัดส่วน 30% ของคะแนนรวม">
                      What If?<br /><span style={{ fontSize: "11px", fontWeight: "700", color: "#ffedd5" }}>(30% • เต็ม 100)</span>
                    </th>
                    <th colSpan={7} style={{ padding: "8px", textAlign: "center", color: "#ffd700", background: "rgba(255, 215, 0, 0.12)", borderLeft: "1px solid rgba(255, 215, 0, 0.3)", borderRight: "1px solid rgba(255, 215, 0, 0.3)", fontWeight: "900", fontSize: "13px" }}>
                      📊 คะแนนโหวตมหาชน (70%)
                    </th>
                    <th rowSpan={2} style={{ padding: "10px 8px", textAlign: "center", width: "105px", color: "#ffd700", fontWeight: "900", background: "rgba(255, 215, 0, 0.08)", borderLeft: "1px solid rgba(255, 215, 0, 0.3)" }} title="คะแนนรวมโพลล์ (คำนวณจาก โพลล์มหาชน 70% + What If 30%)">
                      ⭐ คะแนนรวม<br /><span style={{ fontSize: "11px", fontWeight: "700", color: "#fef08a" }}>(โพลล์ 100%)</span>
                    </th>
                    <th rowSpan={2} style={{ padding: "10px 8px", textAlign: "center", width: "85px", color: "#67e8f9", fontWeight: "900" }}>คิดเป็น %</th>
                    <th rowSpan={2} style={{ padding: "10px 8px", textAlign: "center", width: "125px", color: "#ffd700", fontWeight: "900" }}>โปรไฟล์ & คลิป</th>
                    <th rowSpan={2} style={{ padding: "10px 6px", textAlign: "center", width: "76px", color: "#80d0ff" }}>เลื่อน</th>
                    <th rowSpan={2} style={{ padding: "10px 6px", textAlign: "center", width: "45px", color: "#80d0ff" }}>ลบ</th>
                  </tr>
                  <tr style={{ background: "rgba(255, 215, 0, 0.06)", borderBottom: "1px solid rgba(0, 229, 255, 0.2)" }}>
                    <th style={{ padding: "6px 2px", textAlign: "center", width: "48px", color: "#ffd700", fontSize: "12px", borderLeft: "1px solid rgba(255, 215, 0, 0.3)" }} title="อันดับ 1 (10 คะแนน)">🥇 #1</th>
                    <th style={{ padding: "6px 2px", textAlign: "center", width: "48px", color: "#e2e8f0", fontSize: "12px" }} title="อันดับ 2 (7 คะแนน)">🥈 #2</th>
                    <th style={{ padding: "6px 2px", textAlign: "center", width: "48px", color: "#cd7f32", fontSize: "12px" }} title="อันดับ 3 (5 คะแนน)">🥉 #3</th>
                    <th style={{ padding: "6px 2px", textAlign: "center", width: "48px", color: "#38bdf8", fontSize: "12px" }} title="อันดับ 4 (3 คะแนน)">🎖️ #4</th>
                    <th style={{ padding: "6px 2px", textAlign: "center", width: "48px", color: "#a855f7", fontSize: "12px" }} title="อันดับ 5 (2 คะแนน)">🎖️ #5</th>
                    <th style={{ padding: "6px 2px", textAlign: "center", width: "50px", color: "#ffd700", fontSize: "12px" }} title="สุดยอดแฟนพันธุ์แท้ (15 คะแนน)">🏆 แชมป์</th>
                    <th style={{ padding: "6px 4px", textAlign: "center", width: "70px", color: "#67e8f9", fontSize: "12px", borderRight: "1px solid rgba(255, 215, 0, 0.3)", fontWeight: "800" }} title="คะแนนรวมดิบเฉพาะจากการโหวตมหาชน">🗳️ รวมโหวต</th>
                  </tr>
                </thead>
                <tbody>
                  {pollItems.map((item, index) => {
                    const isTop5 = Number(item.pollRank) <= 5;
                    const matchedContestant = contestants.find(
                      (c) =>
                        (c.name && item.name && c.name.trim() === item.name.trim()) ||
                        (c.nickname && item.nickname && c.nickname.trim() === item.nickname.trim())
                    );
                    const photo = item.image || matchedContestant?.image || null;

                    return (
                      <tr
                        key={item.id ? `${item.id}-${index}` : `${item.pollRank}-${index}`}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                          background: index % 2 === 0 ? "rgba(0,0,0,0.15)" : "transparent",
                        }}
                      >
                        {/* Poll Rank Badge */}
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              borderRadius: "8px",
                              fontWeight: "800",
                              fontSize: "13px",
                              background: isTop5 ? "rgba(255, 215, 0, 0.2)" : "rgba(0, 229, 255, 0.12)",
                              color: isTop5 ? "#ffd700" : "#67e8f9",
                              border: isTop5 ? "1px solid #ffd700" : "1px solid rgba(0, 229, 255, 0.3)",
                              boxShadow: isTop5 ? "0 0 8px rgba(255, 215, 0, 0.25)" : "none",
                            }}
                          >
                            {isTop5 ? `⭐ #${item.pollRank}` : `#${item.pollRank}`}
                          </span>
                        </td>

                        {/* Photo Thumbnail */}
                        <td style={{ padding: "8px 4px", textAlign: "center" }}>
                          <div
                            onClick={() => {
                              const newUrl = window.prompt(`ใส่ URL รูปภาพสำหรับ ${item.nickname || item.name}:`, photo || "");
                              if (newUrl !== null) {
                                handlePollFieldChange(index, "image", newUrl.trim());
                              }
                            }}
                            title="คลิกเพื่อแก้ไข/เปลี่ยนรูปภาพโพลล์"
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              margin: "0 auto",
                              overflow: "hidden",
                              border: isTop5 ? "1.5px solid #ffd700" : "1px solid rgba(255,255,255,0.3)",
                              background: "#030814",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            {photo ? (
                              <img
                                src={getOptimizedImageUrl(photo, 80)}
                                alt={item.name}
                                referrerPolicy="no-referrer"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <span style={{ fontSize: "14px" }} title="คลิกเพื่อใส่รูปภาพ">📷</span>
                            )}
                          </div>
                        </td>

                        {/* Name Input */}
                        <td style={{ padding: "8px 10px", minWidth: "160px" }}>
                          <input
                            type="text"
                            value={item.name || ""}
                            onChange={(e) => handlePollFieldChange(index, "name", e.target.value)}
                            placeholder="ชื่อ-นามสกุล..."
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              background: "#050b14",
                              border: "1px solid rgba(0, 229, 255, 0.3)",
                              color: "#ffffff",
                              fontSize: "13px",
                            }}
                          />
                        </td>

                        {/* Nickname Input */}
                        <td style={{ padding: "8px 10px", minWidth: "150px" }}>
                          <input
                            type="text"
                            value={item.nickname || ""}
                            onChange={(e) => handlePollFieldChange(index, "nickname", e.target.value)}
                            placeholder="ชื่อเล่น..."
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              background: "#050b14",
                              border: "1px solid rgba(0, 229, 255, 0.3)",
                              color: "#ffd700",
                              fontSize: "13px",
                              fontWeight: "600",
                            }}
                          />
                        </td>

                        {/* Topic Input */}
                        <td style={{ padding: "8px 10px", minWidth: "180px" }}>
                          <input
                            type="text"
                            value={item.topic || ""}
                            onChange={(e) => handlePollFieldChange(index, "topic", e.target.value)}
                            placeholder="หัวข้อแฟนพันธุ์แท้..."
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              background: "#050b14",
                              border: "1px solid rgba(0, 229, 255, 0.3)",
                              color: "#67e8f9",
                              fontSize: "13px",
                            }}
                          />
                        </td>

                        {/* Warmup Schedule Input */}
                        <td style={{ padding: "8px 8px", minWidth: "170px", background: "rgba(255, 136, 0, 0.04)", borderLeft: "1px solid rgba(255, 136, 0, 0.3)" }}>
                          <input
                            type="text"
                            value={item.warmupSchedule || ""}
                            onChange={(e) => handlePollFieldChange(index, "warmupSchedule", e.target.value)}
                            placeholder="เช่น พุธ 12 พ.ย. 20:00 น."
                            title="ระบุวัน-เวลาแข่งรอบอุ่นเครื่อง (หากระบุไว้ จะขึ้นแสดงชื่อในตารางรอบอุ่นเครื่องทันที)"
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              background: "#080402",
                              border: item.warmupSchedule ? "1.5px solid #ff8800" : "1px solid rgba(255, 136, 0, 0.35)",
                              color: item.warmupSchedule ? "#ffa940" : "#ffffff",
                              fontSize: "13px",
                              fontWeight: item.warmupSchedule ? "700" : "normal",
                            }}
                          />
                        </td>

                        {/* What If Score Input (เต็ม 100, คิดเป็น 30%) */}
                        <td style={{ padding: "6px 4px", textAlign: "center", background: "rgba(255, 136, 0, 0.05)", borderLeft: "1px solid rgba(255, 136, 0, 0.3)" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.whatIfScore ?? 0}
                              onChange={(e) => {
                                const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                handlePollFieldChange(index, "whatIfScore", val);
                              }}
                              title="คะแนนรอบอุ่นเครื่อง What If? (เต็ม 100 คะแนน คิดเป็น 30% ของคะแนนรวม)"
                              style={{
                                width: "56px",
                                padding: "6px 2px",
                                borderRadius: "6px",
                                background: "#050b14",
                                border: "1px solid rgba(255, 136, 0, 0.7)",
                                color: "#ff8800",
                                fontSize: "13px",
                                fontWeight: "900",
                                textAlign: "center",
                              }}
                            />
                            {(() => {
                              const totalWhatIf = pollItems.reduce((sum, it) => sum + (Number(it.whatIfScore) || 0), 0);
                              const whatIfPct30 = totalWhatIf > 0 ? ((Number(item.whatIfScore) || 0) / totalWhatIf) * 30 : 0;
                              return (
                                <span style={{ fontSize: "10px", color: "#fb923c", fontWeight: "700" }} title="สัดส่วนในโควต้า 30% ของโพลล์ (คะแนนคนนี้ ÷ คะแนนรวมทุกคน x 30%)">
                                  = {whatIfPct30.toFixed(2)}%
                                </span>
                              );
                            })()}
                          </div>
                        </td>

                        {/* Rank 1 votes */}
                        <td style={{ padding: "6px 2px", textAlign: "center", borderLeft: "1px solid rgba(255, 215, 0, 0.15)" }}>
                          <input
                            type="number"
                            min="0"
                            value={item.rankVotes?.["1"] ?? item.rankVotes?.[1] ?? 0}
                            onChange={(e) => handleRankVoteChange(index, "1", e.target.value)}
                            title="จำนวนคนโหวตให้อยู่อันดับ 1 (5 คะแนน)"
                            style={{
                              width: "46px",
                              padding: "6px 2px",
                              borderRadius: "6px",
                              background: "#050b14",
                              border: "1px solid rgba(255, 215, 0, 0.4)",
                              color: "#ffd700",
                              fontSize: "13px",
                              fontWeight: "800",
                              textAlign: "center",
                            }}
                          />
                        </td>

                        {/* Rank 2 votes */}
                        <td style={{ padding: "6px 2px", textAlign: "center" }}>
                          <input
                            type="number"
                            min="0"
                            value={item.rankVotes?.["2"] ?? item.rankVotes?.[2] ?? 0}
                            onChange={(e) => handleRankVoteChange(index, "2", e.target.value)}
                            title="จำนวนคนโหวตให้อยู่อันดับ 2 (4 คะแนน)"
                            style={{
                              width: "46px",
                              padding: "6px 2px",
                              borderRadius: "6px",
                              background: "#050b14",
                              border: "1px solid rgba(226, 232, 240, 0.3)",
                              color: "#e2e8f0",
                              fontSize: "13px",
                              fontWeight: "700",
                              textAlign: "center",
                            }}
                          />
                        </td>

                        {/* Rank 3 votes */}
                        <td style={{ padding: "6px 2px", textAlign: "center" }}>
                          <input
                            type="number"
                            min="0"
                            value={item.rankVotes?.["3"] ?? item.rankVotes?.[3] ?? 0}
                            onChange={(e) => handleRankVoteChange(index, "3", e.target.value)}
                            title="จำนวนคนโหวตให้อยู่อันดับ 3 (3 คะแนน)"
                            style={{
                              width: "46px",
                              padding: "6px 2px",
                              borderRadius: "6px",
                              background: "#050b14",
                              border: "1px solid rgba(205, 127, 50, 0.3)",
                              color: "#cd7f32",
                              fontSize: "13px",
                              fontWeight: "700",
                              textAlign: "center",
                            }}
                          />
                        </td>

                        {/* Rank 4 votes */}
                        <td style={{ padding: "6px 2px", textAlign: "center" }}>
                          <input
                            type="number"
                            min="0"
                            value={item.rankVotes?.["4"] ?? item.rankVotes?.[4] ?? 0}
                            onChange={(e) => handleRankVoteChange(index, "4", e.target.value)}
                            title="จำนวนคนโหวตให้อยู่อันดับ 4 (2 คะแนน)"
                            style={{
                              width: "46px",
                              padding: "6px 2px",
                              borderRadius: "6px",
                              background: "#050b14",
                              border: "1px solid rgba(56, 189, 248, 0.3)",
                              color: "#38bdf8",
                              fontSize: "13px",
                              fontWeight: "700",
                              textAlign: "center",
                            }}
                          />
                        </td>

                        {/* Rank 5 votes */}
                        <td style={{ padding: "6px 2px", textAlign: "center" }}>
                          <input
                            type="number"
                            min="0"
                            value={item.rankVotes?.["5"] ?? item.rankVotes?.[5] ?? 0}
                            onChange={(e) => handleRankVoteChange(index, "5", e.target.value)}
                            title="จำนวนคนโหวตให้อยู่อันดับ 5 (1 คะแนน)"
                            style={{
                              width: "46px",
                              padding: "6px 2px",
                              borderRadius: "6px",
                              background: "#050b14",
                              border: "1px solid rgba(168, 85, 247, 0.3)",
                              color: "#a855f7",
                              fontSize: "13px",
                              fontWeight: "700",
                              textAlign: "center",
                            }}
                          />
                        </td>

                        {/* Champion votes */}
                        <td style={{ padding: "6px 2px", textAlign: "center" }}>
                          <input
                            type="number"
                            min="0"
                            value={item.championVotes ?? 0}
                            onChange={(e) => handleChampionVoteChange(index, e.target.value)}
                            title="จำนวนคนโหวตให้เป็นสุดยอดแฟนพันธุ์แท้ (15 คะแนนพิเศษ)"
                            style={{
                              width: "46px",
                              padding: "6px 2px",
                              borderRadius: "6px",
                              background: "#050b14",
                              border: "1px solid rgba(255, 215, 0, 0.5)",
                              color: "#ffd700",
                              fontSize: "13px",
                              fontWeight: "900",
                              textAlign: "center",
                            }}
                          />
                        </td>

                        {/* Raw Vote Sum */}
                        <td style={{ padding: "6px 4px", textAlign: "center", borderRight: "1px solid rgba(255, 215, 0, 0.2)" }}>
                          <input
                            type="number"
                            min="0"
                            value={item.votes ?? 0}
                            onChange={(e) => handlePollFieldChange(index, "votes", Math.max(0, parseInt(e.target.value) || 0))}
                            title="คะแนนดิบจากการโหวตมหาชน (คำนวณจากจำนวนคนโหวตอัตโนมัติ หรือแก้ไขได้)"
                            style={{
                              width: "56px",
                              padding: "6px 2px",
                              borderRadius: "6px",
                              background: "#050b14",
                              border: "1px solid rgba(0, 229, 255, 0.4)",
                              color: "#67e8f9",
                              fontSize: "13px",
                              fontWeight: "800",
                              textAlign: "center",
                            }}
                          />
                        </td>

                        {/* Total Combined Score (Vote 70% + What If 30%) */}
                        <td style={{ padding: "6px 6px", textAlign: "center", background: "rgba(255, 215, 0, 0.04)", borderLeft: "1px solid rgba(255, 215, 0, 0.2)" }}>
                          {(() => {
                            const w = Number(item.whatIfScore) || 0;
                            const v = Number(item.votes) || 0;
                            const totalWhatIf = pollItems.reduce((sum, it) => sum + (Number(it.whatIfScore) || 0), 0);
                            const totalVotes = pollItems.reduce((sum, it) => sum + (Number(it.votes) || 0), 0);

                            const whatIfShare30 = totalWhatIf > 0 ? (w / totalWhatIf) * 30 : 0;
                            const voteShare70 = totalVotes > 0 ? (v / totalVotes) * 70 : 0;
                            const totalPct = voteShare70 + whatIfShare30;

                            const displayTotal = item.percent ? parseFloat(item.percent).toFixed(2) : totalPct.toFixed(2);

                            return (
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                                <span style={{ fontSize: "14px", fontWeight: "900", color: "#ffd700", textShadow: "0 0 8px rgba(255,215,0,0.3)" }}>
                                  {displayTotal}%
                                </span>
                                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)" }}>
                                  (โหวต {voteShare70.toFixed(2)}% + WI {whatIfShare30.toFixed(2)}%)
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Percent Input */}
                        <td style={{ padding: "8px 6px", textAlign: "center" }}>
                          <input
                            type="text"
                            value={item.percent || ""}
                            onChange={(e) => handlePollFieldChange(index, "percent", e.target.value)}
                            placeholder="0.00%"
                            style={{
                              width: "80px",
                              padding: "6px 4px",
                              borderRadius: "6px",
                              background: "#050b14",
                              border: "1px solid rgba(0, 229, 255, 0.4)",
                              color: "#67e8f9",
                              fontSize: "13px",
                              fontWeight: "800",
                              textAlign: "center",
                            }}
                          />
                        </td>

                        {/* Profile & Video Modal Button */}
                        <td style={{ padding: "8px 6px", textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditCandidate(item)}
                            title="แก้ไขคำอธิบาย, ลิงก์คลิป Google Drive, และคะแนนรอบเก็บโพลล์"
                            style={{
                              padding: "6px 10px",
                              borderRadius: "6px",
                              background: item.videoUrl || item.description ? "rgba(0, 229, 255, 0.2)" : "rgba(255, 255, 255, 0.08)",
                              border: item.videoUrl || item.description ? "1px solid #00e5ff" : "1px solid rgba(255, 255, 255, 0.2)",
                              color: item.videoUrl || item.description ? "#00e5ff" : "rgba(255,255,255,0.7)",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span>🎬</span>
                            <span>{item.videoUrl ? "มีคลิปแล้ว" : "ข้อมูล/คลิป"}</span>
                          </button>
                        </td>

                        {/* Move Up/Down Buttons */}
                        <td style={{ padding: "8px 10px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                            <button
                              type="button"
                              onClick={() => handleMovePoll(index, -1)}
                              disabled={index === 0}
                              style={{
                                width: "30px",
                                height: "30px",
                                borderRadius: "6px",
                                background: index === 0 ? "rgba(255,255,255,0.04)" : "rgba(0, 229, 255, 0.15)",
                                border: index === 0 ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0, 229, 255, 0.4)",
                                color: index === 0 ? "rgba(255,255,255,0.2)" : "#00e5ff",
                                cursor: index === 0 ? "not-allowed" : "pointer",
                                fontSize: "14px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              title="เลื่อนขึ้น"
                            >
                              ⬆️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMovePoll(index, 1)}
                              disabled={index === pollItems.length - 1}
                              style={{
                                width: "30px",
                                height: "30px",
                                borderRadius: "6px",
                                background: index === pollItems.length - 1 ? "rgba(255,255,255,0.04)" : "rgba(0, 229, 255, 0.15)",
                                border: index === pollItems.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0, 229, 255, 0.4)",
                                color: index === pollItems.length - 1 ? "rgba(255,255,255,0.2)" : "#00e5ff",
                                cursor: index === pollItems.length - 1 ? "not-allowed" : "pointer",
                                fontSize: "14px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              title="เลื่อนลง"
                            >
                              ⬇️
                            </button>
                          </div>
                        </td>

                        {/* Delete Button */}
                        <td style={{ padding: "8px 10px", textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleDeletePollItem(index)}
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "6px",
                              background: "rgba(239, 68, 68, 0.15)",
                              border: "1px solid rgba(239, 68, 68, 0.4)",
                              color: "#fca5a5",
                              cursor: "pointer",
                              fontSize: "13px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title="ลบออกจากโพลล์"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {pollItems.length === 0 && (
                    <tr>
                      <td colSpan={18} style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.5)" }}>
                        ยังไม่มีข้อมูลในตารางอันดับโพลล์ กดปุ่ม "➕ เพิ่มคนในโพลล์" หรือ "🔄 รีเซ็ตค่าเริ่มต้น" เพื่อเริ่มต้น
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Bottom Quick Save */}
              <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={handleSaveAllPoll}
                  disabled={savingPoll}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "8px",
                    background: "linear-gradient(90deg, #ffd700 0%, #ffb703 100%)",
                    border: "none",
                    color: "#030812",
                    fontSize: "14px",
                    fontWeight: "800",
                    cursor: savingPoll ? "not-allowed" : "pointer",
                    boxShadow: "0 0 16px rgba(255, 215, 0, 0.35)",
                  }}
                >
                  {savingPoll ? "⏳ กำลังบันทึก..." : "💾 บันทึกผลโพลล์ทั้งหมด"}
                </button>
              </div>
            </div>

            {/* Trial FOTY Candidate Profile & Video Edit Modal */}
            {editingPollCandidate && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  backdropFilter: "blur(6px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 9999,
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    background: "linear-gradient(145deg, #0d192e 0%, #060b14 100%)",
                    border: "1.5px solid rgba(0, 229, 255, 0.4)",
                    borderRadius: "16px",
                    maxWidth: "600px",
                    width: "100%",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    padding: "24px",
                    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "16px",
                      borderBottom: "1px solid rgba(0,229,255,0.2)",
                      paddingBottom: "12px",
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#ffd700", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>🎬</span> แก้ไขข้อมูลและคลิปผู้เข้าแข่งขัน (Trial FOTY)
                      </h3>
                      <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#80d0ff" }}>
                        {pollCandidateForm.name} ({pollCandidateForm.nickname}) - {pollCandidateForm.topic}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingPollCandidate(null)}
                      style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "22px", cursor: "pointer", lineHeight: "1" }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Description */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#ffd700", marginBottom: "6px" }}>
                        📝 คำอธิบาย (Admin ใส่เอง แสดงในการ์ดผู้เข้าแข่งขัน):
                      </label>
                      <textarea
                        rows={3}
                        value={pollCandidateForm.description}
                        onChange={(e) => setPollCandidateForm({ ...pollCandidateForm, description: e.target.value })}
                        placeholder="พิมพ์ประวัติ ผลงาน หรือคำอธิบายเกี่ยวกับผู้เข้าแข่งขันท่านนี้..."
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "8px",
                          background: "#050b14",
                          border: "1px solid rgba(0,229,255,0.3)",
                          color: "#fff",
                          fontSize: "13px",
                          lineHeight: "1.5",
                        }}
                      />
                    </div>

                    {/* Google Drive Video URL */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#00e5ff", marginBottom: "6px" }}>
                        🎬 ลิงก์คลิปจาก Google Drive (หรือ YouTube):
                      </label>
                      <input
                        type="text"
                        value={pollCandidateForm.videoUrl}
                        onChange={(e) => setPollCandidateForm({ ...pollCandidateForm, videoUrl: e.target.value })}
                        placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "8px",
                          background: "#050b14",
                          border: "1px solid rgba(0,229,255,0.3)",
                          color: "#fff",
                          fontSize: "13px",
                        }}
                      />
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "4px", display: "block" }}>
                        💡 วางลิงก์แชร์ของ Google Drive (ตั้งค่า Anyone with link can view) หรือ YouTube ระบบจะแปลงเป็น Embed ให้อัตโนมัติ
                      </span>
                    </div>

                    {/* Warmup Match Schedule */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#ffa940", marginBottom: "6px" }}>
                        🗓️ วัน-เวลานัดแข่งรอบอุ่นเครื่อง (Warmup Schedule):
                      </label>
                      <input
                        type="text"
                        value={pollCandidateForm.warmupSchedule}
                        onChange={(e) => setPollCandidateForm({ ...pollCandidateForm, warmupSchedule: e.target.value })}
                        placeholder="เช่น เสาร์ 22 พ.ย. 20:00 น."
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          background: "#050b14",
                          border: "1px solid rgba(255, 170, 64, 0.4)",
                          color: "#ffa940",
                          fontSize: "13px",
                        }}
                      />
                    </div>

                    {/* Scores Section */}
                    <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,215,0,0.25)", borderRadius: "10px", padding: "14px" }}>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#ffd700", marginBottom: "10px" }}>
                        🏆 คะแนนรอบเก็บโพลล์ / รอบอุ่นเครื่อง (4 หมวดการแข่งขัน):
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.8)", marginBottom: "4px" }}>
                            ⚡ 3 วินาที (คะแนน):
                          </label>
                          <input
                            type="number"
                            value={pollCandidateForm.scores["3sec"]}
                            onChange={(e) => handleScoreChange("3sec", e.target.value)}
                            placeholder="0"
                            style={{
                              width: "100%",
                              padding: "8px",
                              borderRadius: "6px",
                              background: "#050b14",
                              border: "1px solid rgba(0,229,255,0.3)",
                              color: "#fff",
                              fontSize: "13px",
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.8)", marginBottom: "4px" }}>
                            ❓ คำถาม-คำตอบ (คะแนน):
                          </label>
                          <input
                            type="number"
                            value={pollCandidateForm.scores.qa}
                            onChange={(e) => handleScoreChange("qa", e.target.value)}
                            placeholder="0"
                            style={{
                              width: "100%",
                              padding: "8px",
                              borderRadius: "6px",
                              background: "#050b14",
                              border: "1px solid rgba(0,229,255,0.3)",
                              color: "#fff",
                              fontSize: "13px",
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.8)", marginBottom: "4px" }}>
                            🧩 จิ๊กซอว์ (คะแนน):
                          </label>
                          <input
                            type="number"
                            value={pollCandidateForm.scores.jigsaw}
                            onChange={(e) => handleScoreChange("jigsaw", e.target.value)}
                            placeholder="0"
                            style={{
                              width: "100%",
                              padding: "8px",
                              borderRadius: "6px",
                              background: "#050b14",
                              border: "1px solid rgba(0,229,255,0.3)",
                              color: "#fff",
                              fontSize: "13px",
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.8)", marginBottom: "4px" }}>
                            🔍 คุณสมบัติ (คะแนน):
                          </label>
                          <input
                            type="number"
                            value={pollCandidateForm.scores.attribute}
                            onChange={(e) => handleScoreChange("attribute", e.target.value)}
                            placeholder="0"
                            style={{
                              width: "100%",
                              padding: "8px",
                              borderRadius: "6px",
                              background: "#050b14",
                              border: "1px solid rgba(0,229,255,0.3)",
                              color: "#fff",
                              fontSize: "13px",
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "13px", fontWeight: "800", color: "#ff8800" }}>คะแนนรอบ What-If รวม (30%):</span>
                        <input
                          type="number"
                          value={pollCandidateForm.whatIfScore}
                          onChange={(e) => setPollCandidateForm({ ...pollCandidateForm, whatIfScore: e.target.value })}
                          style={{
                            width: "110px",
                            padding: "8px",
                            borderRadius: "6px",
                            background: "#050b14",
                            border: "1px solid #ff8800",
                            color: "#ff8800",
                            fontSize: "15px",
                            fontWeight: "800",
                            textAlign: "right",
                          }}
                        />
                      </div>
                    </div>

                    {/* Modal Actions */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                      <button
                        type="button"
                        onClick={() => setEditingPollCandidate(null)}
                        style={{
                          padding: "10px 18px",
                          borderRadius: "8px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          color: "#fff",
                          fontSize: "13px",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCandidateDetails}
                        disabled={savingCandidateDetails}
                        style={{
                          padding: "10px 22px",
                          borderRadius: "8px",
                          background: "linear-gradient(90deg, #00e5ff 0%, #00a8ff 100%)",
                          border: "none",
                          color: "#030812",
                          fontSize: "13px",
                          fontWeight: "800",
                          cursor: savingCandidateDetails ? "not-allowed" : "pointer",
                          boxShadow: "0 0 14px rgba(0,229,255,0.4)",
                        }}
                      >
                        {savingCandidateDetails ? "⏳ กำลังบันทึก..." : "💾 บันทึกข้อมูลและคลิป"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          )
        )}

        {activeTab === "contestants" && (
          <div>
            {/* Header & Add Button */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "18px",
              }}
            >
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#80d0ff", margin: "0 0 4px 0" }}>
                  👥 รายชื่อผู้เข้าแข่งขันทั้งหมด ({contestants.length} คน)
                </h2>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: 0 }}>
                  ผูกรูปโปรไฟล์จาก Google Photos, อัปเดตข้อมูล และตรวจสอบคะแนนรวม
                </p>
              </div>

              {!isMaintainer && (
                <button
                  type="button"
                  onClick={openAddModal}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    background: "linear-gradient(90deg, #00e5ff 0%, #0077b6 100%)",
                    color: "#030812",
                    fontWeight: "800",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    boxShadow: "0 0 15px rgba(0, 229, 255, 0.3)",
                  }}
                >
                  ➕ เพิ่มผู้เข้าแข่งขันใหม่
                </button>
              )}
            </div>

            {isMaintainer && (
              <div
                style={{
                  background: "rgba(0, 229, 255, 0.08)",
                  border: "1px solid rgba(0, 229, 255, 0.3)",
                  borderRadius: "10px",
                  padding: "12px 18px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "13px",
                  color: "#e0f2fe",
                }}
              >
                <span style={{ fontSize: "18px" }}>ℹ️</span>
                <span>
                  <strong>สิทธิ์ Maintainer:</strong> สามารถเปลี่ยนลิงก์รูปภาพ (Google Photos) หรืออัปโหลดรูปผู้เข้าแข่งขันได้ แต่ไม่สามารถเพิ่ม ลบ หรือแก้ไขชื่อ/หัวข้อของผู้เข้าแข่งขันได้
                </span>
              </div>
            )}

            {/* Search & Filter Toolbar */}
            <div
              style={{
                background: "rgba(0, 15, 30, 0.6)",
                border: "1px solid rgba(0, 229, 255, 0.2)",
                borderRadius: "12px",
                padding: "14px 18px",
                marginBottom: "16px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              {/* Search Bar */}
              <div style={{ position: "relative", flex: "1", minWidth: "240px", maxWidth: "420px" }}>
                <input
                  type="text"
                  value={contestantSearch}
                  onChange={(e) => setContestantSearch(e.target.value)}
                  placeholder="🔍 ค้นหาชื่อ, ชื่อเล่น หรือหัวข้อ..."
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 34px",
                    borderRadius: "8px",
                    background: "#050b14",
                    border: "1px solid rgba(0, 229, 255, 0.35)",
                    color: "#fff",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", opacity: 0.5 }}>
                  🔍
                </span>
              </div>

              {/* Filter Chips */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {[
                  { key: "all", label: `ทั้งหมด (${contestants.length})` },
                  { key: "withPhoto", label: `📷 มีรูปแล้ว (${withPhotoCount})` },
                  { key: "noPhoto", label: `👤 ยังไม่มีรูป (${noPhotoCount})` },
                  { key: "hasScores", label: `🏆 มีคะแนน (${hasScoreCount})` },
                ].map((chip) => {
                  const active = contestantFilter === chip.key;
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => setContestantFilter(chip.key)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: active ? "800" : "600",
                        background: active ? "linear-gradient(90deg, #00e5ff 0%, #0077b6 100%)" : "rgba(255,255,255,0.06)",
                        color: active ? "#030812" : "rgba(255,255,255,0.75)",
                        border: active ? "1px solid #00e5ff" : "1px solid rgba(255,255,255,0.12)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contestants Table (Matching Main Admin Exact Structure) */}
            <div
              style={{
                overflowX: "auto",
                background: "rgba(0, 15, 30, 0.8)",
                borderRadius: "12px",
                border: "1px solid rgba(0, 229, 255, 0.25)",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                <thead>
                  <tr style={{ background: "rgba(0, 229, 255, 0.12)", borderBottom: "1px solid rgba(0, 229, 255, 0.3)" }}>
                    <th style={{ padding: "12px 14px", width: "70px", textAlign: "center", color: "#ffd700" }}>#ID</th>
                    <th style={{ padding: "12px 14px", width: "60px", textAlign: "center" }}>รูป</th>
                    <th style={{ padding: "12px 14px" }}>ชื่อจริง - นามสกุล</th>
                    <th style={{ padding: "12px 14px" }}>ชื่อเล่น</th>
                    <th style={{ padding: "12px 14px" }}>หัวข้อแฟนพันธุ์แท้</th>
                    <th style={{ padding: "12px 14px", width: "260px" }}>📸 ใส่ URL รูป Google Photos ด่วน</th>
                    <th style={{ padding: "12px 14px", textAlign: "center", width: "80px" }}>รวม</th>
                    <th style={{ padding: "12px 14px", textAlign: "center", width: "140px" }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContestants.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: "30px", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                        ไม่พบผู้เข้าแข่งขันที่ตรงตามเงื่อนไข
                      </td>
                    </tr>
                  ) : (
                    filteredContestants.map((c) => {
                      const inputUrl = quickPhotos[c.id] ?? c.image ?? "";
                      const hasChanged = inputUrl.trim() !== (c.image || "").trim();
                      const isSaving = savingQuickPhotoId === c.id;

                      return (
                        <tr
                          key={c.id}
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                            transition: "background 0.15s ease",
                          }}
                        >
                          <td style={{ padding: "10px", textAlign: "center" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontWeight: "800",
                                fontSize: "12px",
                                background: "rgba(0, 229, 255, 0.12)",
                                color: "#67e8f9",
                                border: "1px solid rgba(0, 229, 255, 0.3)",
                              }}
                            >
                              #{c.id}
                            </span>
                          </td>

                          <td style={{ padding: "10px", textAlign: "center" }}>
                            <div
                              onClick={() => openEditModal(c)}
                              title="คลิกเพื่อผูกรูปหรือแก้ไข"
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                overflow: "hidden",
                                background: "rgba(0, 229, 255, 0.1)",
                                border: c.image ? "2px solid #52c41a" : "1px dashed rgba(255, 77, 79, 0.6)",
                                margin: "0 auto",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                            >
                              <AdminPhotoPreview src={c.image} name={c.name} size={40} />
                            </div>
                          </td>

                          <td style={{ padding: "12px 14px", fontWeight: "700" }}>
                            {c.name}
                            {c.waitingNextMatch && (
                              <span
                                style={{
                                  marginLeft: "6px",
                                  fontSize: "11px",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  background: "rgba(99, 102, 241, 0.25)",
                                  border: "1px solid #818cf8",
                                  color: "#c7d2fe",
                                  fontWeight: "600",
                                }}
                              >
                                รอลุ้นผล
                              </span>
                            )}
                            {c.isPlaying && (
                              <span
                                style={{
                                  marginLeft: "6px",
                                  fontSize: "11px",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  background: "rgba(239, 68, 68, 0.3)",
                                  border: "1px solid #ef4444",
                                  color: "#fca5a5",
                                  fontWeight: "800",
                                }}
                              >
                                LIVE
                              </span>
                            )}
                          </td>

                          <td style={{ padding: "12px 14px", color: "#ffd700", fontWeight: "700" }}>
                            {c.nickname || "-"}
                          </td>

                          <td style={{ padding: "12px 14px", color: "rgba(255,255,255,0.75)" }}>
                            {c.topic}
                          </td>

                          {/* Quick Google Photo URL Input */}
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              <input
                                type="text"
                                value={inputUrl}
                                onChange={(e) => setQuickPhotos({ ...quickPhotos, [c.id]: e.target.value })}
                                placeholder="วางลิงก์ Google Photos..."
                                style={{
                                  width: "100%",
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  background: "#030a14",
                                  border: hasChanged ? "1.5px solid #00e5ff" : "1px solid rgba(255,255,255,0.15)",
                                  color: "#ffffff",
                                  fontSize: "12px",
                                  outline: "none",
                                }}
                              />
                              {hasChanged && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickSavePhoto(c)}
                                  disabled={isSaving}
                                  style={{
                                    padding: "6px 12px",
                                    borderRadius: "6px",
                                    background: "#00e5ff",
                                    color: "#030814",
                                    fontWeight: "800",
                                    fontSize: "12px",
                                    border: "none",
                                    cursor: isSaving ? "wait" : "pointer",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {isSaving ? "..." : "บันทึก"}
                                </button>
                              )}
                            </div>
                          </td>

                          <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: "900", color: "#ffd700", fontSize: "16px" }}>
                            {c.totalScore ?? 0}
                          </td>

                          {/* Action Buttons */}
                          <td style={{ padding: "12px 14px", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                              <button
                                type="button"
                                onClick={() => {
                                  handleSelectContestant(c);
                                  setActiveTab("scoring");
                                }}
                                style={{
                                  padding: "5px 10px",
                                  borderRadius: "6px",
                                  background: "rgba(0, 229, 255, 0.15)",
                                  border: "1px solid rgba(0, 229, 255, 0.4)",
                                  color: "#00e5ff",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                }}
                                title="เลือกคนนี้ไปกรอกคะแนน"
                              >
                                🎯 ให้คะแนน
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditModal(c)}
                                style={{
                                  padding: "5px 8px",
                                  borderRadius: "6px",
                                  background: isMaintainer ? "rgba(0, 229, 255, 0.15)" : "rgba(255,255,255,0.08)",
                                  border: isMaintainer ? "1px solid rgba(0, 229, 255, 0.4)" : "1px solid rgba(255,255,255,0.2)",
                                  color: isMaintainer ? "#67e8f9" : "#ffffff",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                }}
                                title={isMaintainer ? "เปลี่ยนรูปผู้เข้าแข่งขัน" : "แก้ไขข้อมูล"}
                              >
                                {isMaintainer ? "📷 เปลี่ยนรูป" : "✏️"}
                              </button>

                              {!isMaintainer && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteContestant(c)}
                                  style={{
                                    padding: "5px 8px",
                                    borderRadius: "6px",
                                    background: "rgba(239, 68, 68, 0.15)",
                                    border: "1px solid rgba(239, 68, 68, 0.4)",
                                    color: "#fca5a5",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                  }}
                                  title="ลบผู้เข้าแข่งขัน"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: SETTINGS & TOOLS (Matching Main Admin)
           ======================================================== */}
        {activeTab === "settings" && (
          <div>
            {/* Trial Voting Open / Close Settings Box */}
            <div
              style={{
                background: "linear-gradient(145deg, rgba(16, 32, 60, 0.85) 0%, rgba(10, 20, 40, 0.95) 100%)",
                border: votingOpen ? "1.5px solid rgba(16, 185, 129, 0.4)" : "1.5px solid rgba(239, 68, 68, 0.4)",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "20px",
                boxShadow: votingOpen ? "0 0 20px rgba(16, 185, 129, 0.12)" : "0 0 20px rgba(239, 68, 68, 0.12)",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#ffd700", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🗳️</span> เปิด-ปิดระบบโหวตโพลล์มหาชน (Trial FoTY Poll Voting)
              </h3>
              <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.7)", margin: "0 0 16px", lineHeight: "1.6" }}>
                ควบคุมการเปิดหรือปิดรับการส่งคะแนนโหวตจากผู้ชมในหน้า <code>/trial-foty/vote</code> หากปิดระบบ ผู้ชมจะไม่สามารถส่งคะแนนได้
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "14px",
                  padding: "14px 18px",
                  borderRadius: "12px",
                  background: votingOpen ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                  border: votingOpen ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid rgba(239, 68, 68, 0.35)",
                }}
              >
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: togglingVoting ? "not-allowed" : "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={votingOpen}
                    disabled={togglingVoting}
                    onChange={(e) => handleToggleVoting(e.target.checked)}
                    style={{
                      width: "22px",
                      height: "22px",
                      cursor: togglingVoting ? "not-allowed" : "pointer",
                      accentColor: "#10b981",
                    }}
                  />
                  <div>
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: "900",
                        color: votingOpen ? "#4ade80" : "#f87171",
                      }}
                    >
                      {votingOpen ? "🟢 เปิดรับการโหวตอยู่ (Open for Voting)" : "🔴 ปิดรับการโหวตแล้ว (Voting Closed)"}
                    </span>
                    <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.65)", margin: "2px 0 0" }}>
                      {votingOpen
                        ? "สถานะปัจจุบัน: ผู้ชมสามารถเข้าหน้าโหวตและส่งคะแนนได้ตามปกติ"
                        : "สถานะปัจจุบัน: หน้าโหวตแสดงแจ้งเตือนปิดรับโหวต และบล็อกการส่งคะแนน"}
                    </p>
                  </div>
                </label>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <Link
                    href="/trial-foty/vote"
                    target="_blank"
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      background: "rgba(255, 215, 0, 0.12)",
                      border: "1px solid rgba(255, 215, 0, 0.4)",
                      color: "#ffd700",
                      fontSize: "13px",
                      fontWeight: "700",
                      textDecoration: "none",
                    }}
                  >
                    ↗ ดูหน้าโหวต
                  </Link>
                  <button
                    type="button"
                    disabled={togglingVoting}
                    onClick={() => handleToggleVoting(!votingOpen)}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      background: votingOpen ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                      border: votingOpen ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(16, 185, 129, 0.5)",
                      color: votingOpen ? "#fca5a5" : "#86efac",
                      fontSize: "13px",
                      fontWeight: "800",
                      cursor: togglingVoting ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {togglingVoting
                      ? "⏳ กำลังบันทึก..."
                      : votingOpen
                      ? "🔒 คลิกเพื่อปิดรับโหวต"
                      : "🔓 คลิกเพื่อเปิดรับโหวต"}
                  </button>
                </div>
              </div>
            </div>

            {/* Trial Warm-up Table Open / Close Settings Box */}
            <div
              style={{
                background: "linear-gradient(145deg, rgba(16, 32, 60, 0.85) 0%, rgba(10, 20, 40, 0.95) 100%)",
                border: showWarmupTable ? "1.5px solid rgba(0, 229, 255, 0.4)" : "1.5px solid rgba(239, 68, 68, 0.4)",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "20px",
                boxShadow: showWarmupTable ? "0 0 20px rgba(0, 229, 255, 0.12)" : "0 0 20px rgba(239, 68, 68, 0.12)",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#00e5ff", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🔥</span> แสดง-ซ่อนตารางรอบอุ่นเครื่องในหน้าแรก (What If? Standings)
              </h3>
              <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.7)", margin: "0 0 16px", lineHeight: "1.6" }}>
                ควบคุมการเปิดหรือปิดแท็บ <strong>"🔥 ตารางรอบอุ่นเครื่อง (What If?)"</strong> ในหน้าแรก <code>/trial-foty</code> ซึ่งแสดงคะแนนการเล่น 4 หมวดเต็ม 100 จากห้องเกม <code>/game</code> และสัดส่วนคะแนน 30% ในโพลล์
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "14px",
                  padding: "14px 18px",
                  borderRadius: "12px",
                  background: showWarmupTable ? "rgba(0, 229, 255, 0.12)" : "rgba(239, 68, 68, 0.12)",
                  border: showWarmupTable ? "1px solid rgba(0, 229, 255, 0.35)" : "1px solid rgba(239, 68, 68, 0.35)",
                }}
              >
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: togglingWarmupTable ? "not-allowed" : "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showWarmupTable}
                    disabled={togglingWarmupTable}
                    onChange={(e) => handleToggleWarmupTable(e.target.checked)}
                    style={{
                      width: "22px",
                      height: "22px",
                      cursor: togglingWarmupTable ? "not-allowed" : "pointer",
                      accentColor: "#00e5ff",
                    }}
                  />
                  <div>
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: "900",
                        color: showWarmupTable ? "#00e5ff" : "#f87171",
                      }}
                    >
                      {showWarmupTable ? "🔥 เปิดแสดงตารางรอบอุ่นเครื่องในหน้าแรก" : "🔴 ปิดซ่อนตารางรอบอุ่นเครื่องในหน้าแรก"}
                    </span>
                    <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", margin: "3px 0 0" }}>
                      {showWarmupTable
                        ? "ผู้ชมสามารถกดดูแท็บ '🔥 ตารางรอบอุ่นเครื่อง' บนหน้า /trial-foty ได้ตามปกติ"
                        : "ซ่อนแท็บตารางรอบอุ่นเครื่องจากหน้าแรก (/trial-foty)"}
                    </p>
                  </div>
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    disabled={togglingWarmupTable}
                    onClick={() => handleToggleWarmupTable(!showWarmupTable)}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      background: showWarmupTable ? "rgba(239, 68, 68, 0.2)" : "rgba(0, 229, 255, 0.2)",
                      border: showWarmupTable ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(0, 229, 255, 0.5)",
                      color: showWarmupTable ? "#fca5a5" : "#67e8f9",
                      fontSize: "13px",
                      fontWeight: "800",
                      cursor: togglingWarmupTable ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {togglingWarmupTable
                      ? "⏳ กำลังบันทึก..."
                      : showWarmupTable
                      ? "🔒 คลิกเพื่อปิดซ่อน"
                      : "🔓 คลิกเพื่อเปิดแสดง"}
                  </button>
                </div>
              </div>
            </div>

            {/* Trial Poll Table Open / Close Settings Box */}
            <div
              style={{
                background: "linear-gradient(145deg, rgba(16, 32, 60, 0.85) 0%, rgba(10, 20, 40, 0.95) 100%)",
                border: showPollTable ? "1.5px solid rgba(255, 215, 0, 0.4)" : "1.5px solid rgba(239, 68, 68, 0.4)",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "20px",
                boxShadow: showPollTable ? "0 0 20px rgba(255, 215, 0, 0.12)" : "0 0 20px rgba(239, 68, 68, 0.12)",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#ffd700", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📊</span> แสดง-ซ่อนตารางอันดับโพลล์ในหน้า Trial FoTY (/trial-foty)
              </h3>
              <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.7)", margin: "0 0 16px", lineHeight: "1.6" }}>
                ควบคุมการเปิดหรือปิดแท็บ <strong>"📊 ตารางอันดับโพลล์ (Poll)"</strong> ในหน้าแรก <code>/trial-foty</code> ซึ่งแสดงอันดับและผลคะแนนโหวตมหาชน
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "14px",
                  padding: "14px 18px",
                  borderRadius: "12px",
                  background: showPollTable ? "rgba(255, 215, 0, 0.12)" : "rgba(239, 68, 68, 0.12)",
                  border: showPollTable ? "1px solid rgba(255, 215, 0, 0.35)" : "1px solid rgba(239, 68, 68, 0.35)",
                }}
              >
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: togglingPollTable ? "not-allowed" : "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showPollTable}
                    disabled={togglingPollTable}
                    onChange={(e) => handleToggleTrialPollTable(e.target.checked)}
                    style={{
                      width: "22px",
                      height: "22px",
                      cursor: togglingPollTable ? "not-allowed" : "pointer",
                      accentColor: "#ffd700",
                    }}
                  />
                  <div>
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: "900",
                        color: showPollTable ? "#ffd700" : "#f87171",
                      }}
                    >
                      {showPollTable ? "📊 เปิดแสดงตารางโพลล์ในหน้า Trial FOTY" : "🔴 ปิดซ่อนตารางโพลล์ในหน้า Trial FOTY"}
                    </span>
                    <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", margin: "3px 0 0" }}>
                      {showPollTable
                        ? "ผู้ชมสามารถกดดูแท็บ '📊 ตารางอันดับโพลล์ (Poll)' บนหน้า /trial-foty ได้ตามปกติ"
                        : "ซ่อนแท็บและตารางอันดับโพลล์จากหน้า /trial-foty"}
                    </p>
                  </div>
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    disabled={togglingPollTable}
                    onClick={() => handleToggleTrialPollTable(!showPollTable)}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      background: showPollTable ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 215, 0, 0.2)",
                      border: showPollTable ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(255, 215, 0, 0.5)",
                      color: showPollTable ? "#fca5a5" : "#ffd700",
                      fontSize: "13px",
                      fontWeight: "800",
                      cursor: togglingPollTable ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {togglingPollTable
                      ? "⏳ กำลังบันทึก..."
                      : showPollTable
                      ? "🔒 คลิกเพื่อปิดซ่อน"
                      : "🔓 คลิกเพื่อเปิดแสดง"}
                  </button>
                </div>
              </div>
            </div>

            {/* Main Homepage Poll Table Open / Close Settings Box */}
            <div
              style={{
                background: "linear-gradient(145deg, rgba(16, 32, 60, 0.85) 0%, rgba(10, 20, 40, 0.95) 100%)",
                border: showMainPollTable ? "1.5px solid rgba(0, 229, 255, 0.4)" : "1.5px solid rgba(239, 68, 68, 0.4)",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "20px",
                boxShadow: showMainPollTable ? "0 0 20px rgba(0, 229, 255, 0.12)" : "0 0 20px rgba(239, 68, 68, 0.12)",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#00e5ff", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🏠</span> แสดง-ซ่อนตารางอันดับโพลล์ในหน้าแรกหลัก (/)
              </h3>
              <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.7)", margin: "0 0 16px", lineHeight: "1.6" }}>
                ควบคุมการเปิดหรือปิดแท็บ <strong>"📊 ตารางอันดับโพลล์ (Poll)"</strong> ในหน้าแรกของเว็บไซต์หลัก <code>/</code>
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "14px",
                  padding: "14px 18px",
                  borderRadius: "12px",
                  background: showMainPollTable ? "rgba(0, 229, 255, 0.12)" : "rgba(239, 68, 68, 0.12)",
                  border: showMainPollTable ? "1px solid rgba(0, 229, 255, 0.35)" : "1px solid rgba(239, 68, 68, 0.35)",
                }}
              >
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: togglingMainPollTable ? "not-allowed" : "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showMainPollTable}
                    disabled={togglingMainPollTable}
                    onChange={(e) => handleToggleMainPollTable(e.target.checked)}
                    style={{
                      width: "22px",
                      height: "22px",
                      cursor: togglingMainPollTable ? "not-allowed" : "pointer",
                      accentColor: "#00e5ff",
                    }}
                  />
                  <div>
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: "900",
                        color: showMainPollTable ? "#00e5ff" : "#f87171",
                      }}
                    >
                      {showMainPollTable ? "🏠 เปิดแสดงตารางโพลล์ในหน้าแรกหลัก (/)" : "🔴 ปิดซ่อนตารางโพลล์ในหน้าแรกหลัก (/)"}
                    </span>
                    <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", margin: "3px 0 0" }}>
                      {showMainPollTable
                        ? "ผู้ชมสามารถกดดูแท็บ '📊 ตารางอันดับโพลล์ (Poll)' บนหน้าแรกหลัก (/) ได้ตามปกติ"
                        : "ซ่อนแท็บและตารางอันดับโพลล์จากหน้าแรกหลัก (/)"}
                    </p>
                  </div>
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    disabled={togglingMainPollTable}
                    onClick={() => handleToggleMainPollTable(!showMainPollTable)}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      background: showMainPollTable ? "rgba(239, 68, 68, 0.2)" : "rgba(0, 229, 255, 0.2)",
                      border: showMainPollTable ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(0, 229, 255, 0.5)",
                      color: showMainPollTable ? "#fca5a5" : "#67e8f9",
                      fontSize: "13px",
                      fontWeight: "800",
                      cursor: togglingMainPollTable ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {togglingMainPollTable
                      ? "⏳ กำลังบันทึก..."
                      : showMainPollTable
                      ? "🔒 คลิกเพื่อปิดซ่อน"
                      : "🔓 คลิกเพื่อเปิดแสดง"}
                  </button>
                </div>
              </div>
            </div>

            {/* Trial Subtitle Customization Box */}
            <div
              style={{
                background: "linear-gradient(145deg, rgba(16, 32, 60, 0.85) 0%, rgba(10, 20, 40, 0.95) 100%)",
                border: "1px solid rgba(0, 229, 255, 0.35)",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "900",
                    color: "#00e5ff",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>📝</span> ปรับแต่งข้อความคำเปรยหน้าแรก (Hero Subtitle / คำแนะนำ)
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const def =
                      "ศึกประลองความรู้แฟนพันธุ์แท้ฉบับทดสอบ (Trial Edition) คำนวณแบบ Dense Ranking พร้อมระบบโควตาตัดตัว 5 อันดับแรก";
                    setTrialSubtitle(def);
                    handleSaveTrialSubtitle(def);
                  }}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  ↺ รีเซ็ตเป็นค่าเริ่มต้น
                </button>
              </div>
              <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.7)", margin: "0 0 14px", lineHeight: "1.6" }}>
                ข้อความนี้จะแสดงอยู่ใต้หัวข้อ <strong>"งุ่นง่าน Of The Year 2026"</strong> บนหน้าแรกของ <code>/trial-foty</code>
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <textarea
                  rows={3}
                  value={trialSubtitle}
                  onChange={(e) => setTrialSubtitle(e.target.value)}
                  placeholder="พิมพ์ข้อความคำเปรยของหน้า Trial FOTY..."
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "rgba(0, 15, 30, 0.9)",
                    border: "1px solid rgba(0, 229, 255, 0.4)",
                    color: "#ffffff",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    resize: "vertical",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                    💡 ผู้ชมทั่วไปจะเห็นข้อความที่พิมพ์นี้บนหน้า <code>/trial-foty</code> ทันทีหลังกดบันทึก
                  </div>
                  <button
                    type="button"
                    disabled={savingSubtitle}
                    onClick={() => handleSaveTrialSubtitle(trialSubtitle)}
                    style={{
                      padding: "9px 22px",
                      borderRadius: "8px",
                      background: "linear-gradient(90deg, #00e5ff 0%, #0077b6 100%)",
                      border: "none",
                      color: "#030814",
                      fontSize: "14px",
                      fontWeight: "900",
                      cursor: savingSubtitle ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 0 15px rgba(0, 229, 255, 0.3)",
                    }}
                  >
                    {savingSubtitle ? "⏳ กำลังบันทึก..." : "💾 บันทึกคำเปรย"}
                  </button>
                </div>
              </div>
            </div>

            {/* Trial Admin Password Management Box */}
            <div
              style={{
                background: "linear-gradient(145deg, rgba(16, 32, 60, 0.85) 0%, rgba(10, 20, 40, 0.95) 100%)",
                border: "1px solid rgba(255, 215, 0, 0.35)",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#ffd700", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🔐</span> ตั้งค่ารหัสผ่านเข้าห้อง Admin ของ Trial FoTY
              </h3>
              <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.7)", margin: "0 0 16px", lineHeight: "1.6" }}>
                รหัสผ่านนี้ใช้สำหรับปลดล็อกเข้าสู่หน้าห้องควบคุมแอดมิน <code>/trial-foty/admin</code>
              </p>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", maxWidth: "520px" }}>
                <input
                  type="text"
                  value={trialAdminPassConfig}
                  onChange={(e) => setTrialAdminPassConfig(e.target.value)}
                  placeholder="เช่น trial_admin_2026"
                  style={{
                    flex: 1,
                    minWidth: "220px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "rgba(0, 15, 30, 0.9)",
                    border: "1px solid rgba(255, 215, 0, 0.4)",
                    color: "#ffd700",
                    fontSize: "15px",
                  }}
                />
                <button
                  type="button"
                  disabled={savingPassConfig}
                  onClick={handleSaveTrialAdminPassword}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    background: "linear-gradient(90deg, #ffd700 0%, #f59e0b 100%)",
                    border: "none",
                    color: "#030814",
                    fontSize: "14px",
                    fontWeight: "900",
                    cursor: savingPassConfig ? "not-allowed" : "pointer",
                    boxShadow: "0 0 12px rgba(255, 215, 0, 0.35)",
                  }}
                >
                  {savingPassConfig ? "⏳ กำลังบันทึก..." : "💾 บันทึกรหัสผ่าน"}
                </button>
              </div>
            </div>

            {/* Reset / Reload Roster Box */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(0, 229, 255, 0.1) 0%, rgba(10, 25, 47, 0.6) 100%)",
                border: "1px solid rgba(0, 229, 255, 0.35)",
                borderRadius: "14px",
                padding: "20px",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#67e8f9", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>👥</span> จัดการรายชื่อผู้เข้าแข่งขัน The Trial (งุ่นง่าน 2026)
              </h3>
              <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.7)", margin: "0 0 16px", lineHeight: "1.6" }}>
                สามารถรีโหลดรายชื่อชุดตั้งต้น 39 คน หรือล้างเป็นช่องว่างสำหรับกรอกรายชื่อใหม่ได้ตามต้องการ
              </p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleReloadTrialRoster}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "10px",
                    background: "linear-gradient(90deg, #ffd700 0%, #f59e0b 100%)",
                    border: "none",
                    color: "#030814",
                    fontSize: "14px",
                    fontWeight: "900",
                    cursor: "pointer",
                    boxShadow: "0 0 16px rgba(255, 215, 0, 0.4)",
                  }}
                >
                  ⚡ ซิงก์รายชื่อ 39 คนตั้งต้น
                </button>
                <button
                  type="button"
                  onClick={handleResetBlankSlots}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "800",
                    cursor: "pointer",
                  }}
                >
                  🔄 ล้างเป็นช่องว่าง 20 คน
                </button>
              </div>
            </div>

            {/* Danger Zone: Reset All Scores */}
            <div
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1.5px solid rgba(239, 68, 68, 0.4)",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#fca5a5", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>⚠️</span> รีเซ็ตคะแนนการแข่งขันทั้งหมด (Reset All Scores)
              </h3>
              <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.7)", margin: "0 0 16px", lineHeight: "1.6" }}>
                การกดปุ่มนี้จะล้างคะแนนทั้ง 4 หมวดของผู้เข้าแข่งขันทุกคนใน The Trial FOTY กลับเป็น 0 และปลดสถานะกำลังแข่ง โดยรายชื่อและรูปภาพจะยังคงอยู่เหมือนเดิม
              </p>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                style={{
                  padding: "12px 24px",
                  borderRadius: "10px",
                  background: "linear-gradient(90deg, #dc2626 0%, #991b1b 100%)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "800",
                  cursor: "pointer",
                  boxShadow: "0 0 16px rgba(220, 38, 38, 0.4)",
                }}
              >
                🔄 รีเซ็ตคะแนนทั้งหมด
              </button>
            </div>

            {/* Stats Summary Card */}
            <div
              style={{
                background: "rgba(0, 10, 22, 0.6)",
                border: "1px solid rgba(0, 229, 255, 0.2)",
                borderRadius: "14px",
                padding: "20px",
              }}
            >
              <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#00e5ff", margin: "0 0 12px" }}>
                📊 ข้อมูลสถิติ The Trial Fan of The Year 2026
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", fontSize: "13px" }}>
                <div style={{ background: "rgba(0, 0, 0, 0.3)", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "11px" }}>จำนวนผู้เข้าแข่งขันทั้งหมด:</div>
                  <div style={{ fontSize: "20px", fontWeight: "900", color: "#ffffff", marginTop: "4px" }}>{contestants.length} คน</div>
                </div>
                <div style={{ background: "rgba(0, 0, 0, 0.3)", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "11px" }}>ลงแข่งแล้ว:</div>
                  <div style={{ fontSize: "20px", fontWeight: "900", color: "#00e5ff", marginTop: "4px" }}>
                    {contestants.filter((c) => (c.totalScore || 0) > 0 || c.isPlaying || c.waitingNextMatch).length} คน
                  </div>
                </div>
                <div style={{ background: "rgba(0, 0, 0, 0.3)", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "11px" }}>คะแนนสูงสุด:</div>
                  <div style={{ fontSize: "20px", fontWeight: "900", color: "#ffd700", marginTop: "4px" }}>
                    {Math.max(0, ...contestants.map((c) => c.totalScore || 0))} คะแนน
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: KEYWORD คำใบ้ (ถาม-ตอบ)
           ======================================================== */}
        {activeTab === "keywords" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Header & Controls */}
            <div
              style={{
                background: "linear-gradient(145deg, rgba(16, 32, 60, 0.8) 0%, rgba(10, 20, 40, 0.9) 100%)",
                border: "1px solid rgba(0, 229, 255, 0.35)",
                borderRadius: "16px",
                padding: "20px 24px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#00e5ff", margin: "0 0 6px" }}>
                  🔑 จัดการคำใบ้ Keyword รอบถาม-คำตอบ (The Trial 40 คน)
                </h2>
                <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", margin: 0 }}>
                  แอดมินสามารถแก้ไข Keyword คำใบ้ของผู้เข้าแข่งขันแต่ละท่านได้โดยตรง และกดบันทึกเป็นรายคนหรือบันทึกทั้งหมด
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <Link
                  href="/trial-foty/info"
                  target="_blank"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: "rgba(0, 229, 255, 0.15)",
                    border: "1px solid rgba(0, 229, 255, 0.4)",
                    color: "#00e5ff",
                    fontSize: "13px",
                    fontWeight: "700",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  👁️ ดูกระดานหน้าเว็บ ↗
                </Link>

                <button
                  type="button"
                  onClick={handleSaveAllKeywords}
                  disabled={savingAllKeywords}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #00e5ff, #0088cc)",
                    border: "none",
                    color: "#030814",
                    fontSize: "13px",
                    fontWeight: "800",
                    cursor: savingAllKeywords ? "not-allowed" : "pointer",
                    boxShadow: "0 0 16px rgba(0, 229, 255, 0.4)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {savingAllKeywords ? "⏳ กำลังบันทึก..." : "💾 บันทึกคำใบ้ทั้งหมด"}
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div
              style={{
                background: "rgba(0, 15, 30, 0.7)",
                border: "1px solid rgba(0, 229, 255, 0.25)",
                borderRadius: "12px",
                padding: "12px 18px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span style={{ fontSize: "16px", color: "rgba(255, 255, 255, 0.5)" }}>🔍</span>
              <input
                type="text"
                placeholder="ค้นหาชื่อ, ชื่อเล่น, หัวข้อ หรือคำใบ้..."
                value={keywordAdminSearch}
                onChange={(e) => setKeywordAdminSearch(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "14px",
                  outline: "none",
                  width: "100%",
                }}
              />
              {keywordAdminSearch && (
                <button
                  onClick={() => setKeywordAdminSearch("")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  ล้าง
                </button>
              )}
            </div>

            {/* Keyword Table */}
            <div
              style={{
                background: "rgba(10, 20, 40, 0.6)",
                border: "1px solid rgba(0, 229, 255, 0.2)",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                  <thead>
                    <tr
                      style={{
                        background: "rgba(0, 229, 255, 0.1)",
                        borderBottom: "1px solid rgba(0, 229, 255, 0.3)",
                        color: "#00e5ff",
                        fontWeight: "800",
                      }}
                    >
                      <th style={{ padding: "14px 16px", width: "50px" }}>#</th>
                      <th style={{ padding: "14px 16px", width: "70px" }}>รูป</th>
                      <th style={{ padding: "14px 16px", width: "200px" }}>ชื่อ-นามสกุล</th>
                      <th style={{ padding: "14px 16px", width: "100px" }}>ชื่อเล่น</th>
                      <th style={{ padding: "14px 16px" }}>หัวข้อแฟนพันธุ์แท้</th>
                      <th style={{ padding: "14px 16px", width: "260px" }}>Keyword คำใบ้ (ถาม-ตอบ)</th>
                      <th style={{ padding: "14px 16px", width: "110px", textAlign: "center" }}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {infoKeywords
                      .filter((item) => {
                        const q = keywordAdminSearch.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          (item.name && item.name.toLowerCase().includes(q)) ||
                          (item.nickname && item.nickname.toLowerCase().includes(q)) ||
                          (item.topic && item.topic.toLowerCase().includes(q)) ||
                          (item.keyword && item.keyword.toLowerCase().includes(q))
                        );
                      })
                      .map((k, idx) => {
                        const isSaving = savingKeywordId === k.id;
                        return (
                          <tr
                            key={k.id || idx}
                            style={{
                              borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                              background: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.02)",
                            }}
                          >
                            <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.5)" }}>
                              #{k.id}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "8px",
                                  overflow: "hidden",
                                  background: "#030814",
                                  border: "1px solid rgba(0, 229, 255, 0.4)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <AdminPhotoPreview src={k.image} name={k.name} size={36} />
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", fontWeight: "700", color: "#ffffff" }}>
                              {k.name}
                            </td>
                            <td style={{ padding: "12px 16px", color: "#00e5ff", fontWeight: "700" }}>
                              {k.nickname || "-"}
                            </td>
                            <td style={{ padding: "12px 16px", color: "#ffd700" }}>
                              🏷️ {k.topic}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <input
                                type="text"
                                value={k.keyword || ""}
                                onChange={(e) => handleKeywordChange(k.id, e.target.value)}
                                placeholder="เช่น ภัยพิบัติ หรือ [ยังไม่มี]"
                                style={{
                                  width: "100%",
                                  background: "rgba(0, 0, 0, 0.5)",
                                  border: "1px solid rgba(0, 229, 255, 0.35)",
                                  borderRadius: "6px",
                                  padding: "7px 12px",
                                  color: "#ffd700",
                                  fontWeight: "700",
                                  fontSize: "14px",
                                  outline: "none",
                                  boxSizing: "border-box",
                                }}
                              />
                            </td>
                            <td style={{ padding: "12px 16px", textAlign: "center" }}>
                              <button
                                type="button"
                                onClick={() => handleSaveKeyword(k.id, k.keyword)}
                                disabled={isSaving}
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: "6px",
                                  background: isSaving
                                    ? "rgba(255, 255, 255, 0.1)"
                                    : "rgba(0, 229, 255, 0.2)",
                                  border: "1px solid rgba(0, 229, 255, 0.4)",
                                  color: "#00e5ff",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  cursor: isSaving ? "not-allowed" : "pointer",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {isSaving ? "⏳" : "💾 บันทึก"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 6: กระดานถามทีมงาน (STAFF Q&A BOARD)
           ======================================================== */}
        {activeTab === "qaBoard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(145deg, rgba(16, 32, 60, 0.8) 0%, rgba(10, 20, 40, 0.9) 100%)",
                border: "1px solid rgba(255, 215, 0, 0.35)",
                borderRadius: "16px",
                padding: "20px 24px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#ffd700", margin: "0 0 6px" }}>
                  💬 จัดการกระดานถามทีมงาน (Staff Q&A Board)
                </h2>
                <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", margin: 0 }}>
                  เพิ่ม/แก้ไข/ลบ ข้อซักถามของผู้เข้าแข่งขัน พร้อมคำตอบอย่างเป็นทางการจากทีมงาน (รองรับการก็อปปี้ format จาก Discord มาแปะได้ทันที)
                </p>
              </div>

              <Link
                href="/trial-foty/info"
                target="_blank"
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "rgba(255, 215, 0, 0.15)",
                  border: "1px solid rgba(255, 215, 0, 0.4)",
                  color: "#ffd700",
                  fontSize: "13px",
                  fontWeight: "700",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                👁️ ดูกระดานหน้าเว็บ ↗
              </Link>
            </div>

            {/* QA Editor Form */}
            <div
              id="adminQaFormSection"
              style={{
                background: "linear-gradient(145deg, rgba(16, 32, 60, 0.85) 0%, rgba(6, 14, 28, 0.95) 100%)",
                border: "1.5px solid rgba(0, 229, 255, 0.35)",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "17px", color: qaForm.id ? "#ffd700" : "#00e5ff", fontWeight: "800" }}>
                  {qaForm.id ? "✏️ แก้ไขข้อซักถาม-ตอบ" : "➕ เพิ่มข้อซักถาม-ตอบใหม่"}
                </h3>
                {qaForm.id && (
                  <button
                    type="button"
                    onClick={handleCancelEditQa}
                    style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      color: "#94a3b8",
                      padding: "4px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    ยกเลิกการแก้ไข
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveQa} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Field 1: Contestant Selector Dropdown */}
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#e2e8f0", marginBottom: "8px" }}>
                    👤 หัวข้อผู้เข้าแข่งขัน:
                  </label>
                  <div style={{ position: "relative" }}>
                    {(() => {
                      const sel =
                        contestants.find((c) => String(c.id) === String(qaForm.contestantId)) ||
                        infoKeywords.find((k) => String(k.id) === String(qaForm.contestantId));
                      return (
                        <div
                          onClick={() => setShowQaDropdown((prev) => !prev)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "12px",
                            padding: "10px 16px",
                            borderRadius: "10px",
                            background: "rgba(0, 15, 30, 0.9)",
                            border: showQaDropdown ? "1.5px solid #00e5ff" : "1px solid rgba(0, 229, 255, 0.4)",
                            cursor: "pointer",
                            minHeight: "52px",
                            boxSizing: "border-box",
                          }}
                        >
                          {!sel ? (
                            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
                              -- กรุณาเลือกผู้เข้าแข่งขันที่สอบถาม --
                            </span>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                              <span
                                style={{
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  background: "rgba(0, 229, 255, 0.15)",
                                  border: "1px solid #00e5ff",
                                  color: "#00e5ff",
                                  fontSize: "12px",
                                  fontWeight: "800",
                                }}
                              >
                                #{sel.id}
                              </span>
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "50%",
                                  overflow: "hidden",
                                  background: "#030814",
                                  border: "1.5px solid #00e5ff",
                                  flexShrink: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <AdminPhotoPreview src={sel.image} name={sel.name} size={36} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <strong style={{ fontSize: "15px", color: "#ffffff" }}>
                                    {sel.name}
                                  </strong>
                                  {sel.nickname && (
                                    <span style={{ fontSize: "13px", color: "#00e5ff", fontWeight: "700" }}>
                                      ({sel.nickname})
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: "12px", color: "#ffd700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  🏷️ {sel.topic}
                                </div>
                              </div>
                            </div>
                          )}
                          <span style={{ color: "#00e5ff", fontSize: "14px" }}>
                            {showQaDropdown ? "▲" : "▼"}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Dropdown Menu */}
                    {showQaDropdown && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          marginTop: "6px",
                          background: "#040d1a",
                          border: "1.5px solid #00e5ff",
                          borderRadius: "12px",
                          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.8)",
                          zIndex: 200,
                          maxHeight: "320px",
                          display: "flex",
                          flexDirection: "column",
                          overflow: "hidden",
                        }}
                      >
                        <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(0, 229, 255, 0.2)" }}>
                          <input
                            type="text"
                            placeholder="ค้นหาชื่อ, ชื่อเล่น หรือหัวข้อ..."
                            value={qaContestantSearch}
                            onChange={(e) => setQaContestantSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              width: "100%",
                              background: "rgba(0, 0, 0, 0.6)",
                              border: "1px solid rgba(0, 229, 255, 0.3)",
                              borderRadius: "8px",
                              padding: "8px 12px",
                              color: "#ffffff",
                              fontSize: "13px",
                              outline: "none",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>

                        <div style={{ overflowY: "auto", flex: 1 }}>
                          {contestants
                            .filter((c) => {
                              const q = qaContestantSearch.trim().toLowerCase();
                              if (!q) return true;
                              return (
                                (c.name && c.name.toLowerCase().includes(q)) ||
                                (c.nickname && c.nickname.toLowerCase().includes(q)) ||
                                (c.topic && c.topic.toLowerCase().includes(q))
                              );
                            })
                            .map((c) => (
                              <div
                                key={c.id}
                                onClick={() => handleSelectQaContestant(c)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  padding: "10px 14px",
                                  cursor: "pointer",
                                  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                                  background:
                                    String(qaForm.contestantId) === String(c.id)
                                      ? "rgba(0, 229, 255, 0.15)"
                                      : "transparent",
                                  transition: "background 0.15s ease",
                                }}
                              >
                                <span
                                  style={{
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    background: "rgba(0, 229, 255, 0.1)",
                                    color: "#00e5ff",
                                    fontSize: "11px",
                                    fontWeight: "800",
                                  }}
                                >
                                  #{c.id}
                                </span>
                                <div
                                  style={{
                                    width: "30px",
                                    height: "30px",
                                    borderRadius: "50%",
                                    overflow: "hidden",
                                    background: "#030814",
                                    flexShrink: 0,
                                  }}
                                >
                                  <AdminPhotoPreview src={c.image} name={c.name} size={30} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>
                                    {c.name} {c.nickname ? `(${c.nickname})` : ""}
                                  </div>
                                  <div style={{ fontSize: "11px", color: "#ffd700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {c.topic}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Field 2: Category Selector */}
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#e2e8f0", marginBottom: "8px" }}>
                    หมวดที่ผู้เข้าแข่งขันสอบถาม:
                  </label>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {[
                      { key: "3 วินาที", icon: "⏱️", color: "#38bdf8" },
                      { key: "คำถาม-คำตอบ", icon: "❓", color: "#c084fc" },
                      { key: "จิ๊กซอว์", icon: "🧩", color: "#fb923c" },
                      { key: "คุณสมบัติ", icon: "🔍", color: "#4ade80" },
                    ].map((cat) => {
                      const isSel = qaForm.category === cat.key;
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => setQaForm((prev) => ({ ...prev, category: cat.key }))}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "10px",
                            background: isSel ? "rgba(0, 229, 255, 0.2)" : "rgba(255, 255, 255, 0.05)",
                            border: `1.5px solid ${isSel ? cat.color : "rgba(255, 255, 255, 0.15)"}`,
                            color: isSel ? cat.color : "#94a3b8",
                            fontSize: "13px",
                            fontWeight: "800",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.key}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Field 3: Question Textarea + Live Discord Preview */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "700", color: "#e2e8f0" }}>
                      🙋‍♂️ คำถามจากผู้เข้าแข่งขัน:
                    </label>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      รองรับ Discord: **หนา**, *เอียง*, __ขีดเส้นใต้__, ||สปอยล์||, `โค้ด`, &gt; อ้างอิง
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="พิมพ์คำถาม หรือก็อปปี้ format ข้อความจาก Discord มาแปะได้ทันที..."
                    value={qaForm.question}
                    onChange={(e) => setQaForm((prev) => ({ ...prev, question: e.target.value }))}
                    style={{
                      width: "100%",
                      background: "rgba(0, 15, 30, 0.8)",
                      border: "1px solid rgba(0, 229, 255, 0.35)",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      color: "#ffffff",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                      lineHeight: 1.5,
                    }}
                  />
                  {qaForm.question.trim() && (
                    <div
                      style={{
                        marginTop: "8px",
                        background: "rgba(0, 0, 0, 0.4)",
                        border: "1px dashed rgba(0, 229, 255, 0.3)",
                        borderRadius: "8px",
                        padding: "10px 14px",
                      }}
                    >
                      <div style={{ fontSize: "11px", color: "#00e5ff", fontWeight: "700", marginBottom: "4px" }}>
                        👁️ ตัวอย่างข้อความคำถาม (Live Preview):
                      </div>
                      <DiscordMarkdown content={qaForm.question} />
                    </div>
                  )}
                </div>

                {/* Field 4: Staff Answer Textarea + Live Discord Preview */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "700", color: "#ffd700" }}>
                      🛡️ คำตอบจากทีมงาน:
                    </label>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      คำชี้แจงกติกาหรือคำตอบอย่างเป็นทางการ
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    placeholder="พิมพ์คำตอบจากทีมงาน..."
                    value={qaForm.answer}
                    onChange={(e) => setQaForm((prev) => ({ ...prev, answer: e.target.value }))}
                    style={{
                      width: "100%",
                      background: "rgba(0, 15, 30, 0.8)",
                      border: "1px solid rgba(255, 215, 0, 0.35)",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      color: "#ffffff",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                      lineHeight: 1.5,
                    }}
                  />
                  {qaForm.answer.trim() && (
                    <div
                      style={{
                        marginTop: "8px",
                        background: "rgba(0, 0, 0, 0.4)",
                        border: "1px dashed rgba(255, 215, 0, 0.3)",
                        borderRadius: "8px",
                        padding: "10px 14px",
                      }}
                    >
                      <div style={{ fontSize: "11px", color: "#ffd700", fontWeight: "700", marginBottom: "4px" }}>
                        👁️ ตัวอย่างข้อความคำตอบ (Live Preview):
                      </div>
                      <DiscordMarkdown content={qaForm.answer} />
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                  {qaForm.id && (
                    <button
                      type="button"
                      onClick={handleCancelEditQa}
                      style={{
                        padding: "10px 20px",
                        borderRadius: "8px",
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        color: "#94a3b8",
                        fontSize: "14px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      ยกเลิก
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={savingQa}
                    style={{
                      padding: "11px 28px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #ffd700, #f59e0b)",
                      border: "none",
                      color: "#030814",
                      fontSize: "14px",
                      fontWeight: "900",
                      cursor: savingQa ? "not-allowed" : "pointer",
                      boxShadow: "0 0 20px rgba(255, 215, 0, 0.4)",
                    }}
                  >
                    {savingQa ? "⏳ กำลังบันทึก..." : qaForm.id ? "💾 บันทึกการแก้ไข" : "💾 บันทึกและขึ้นกระดาน"}
                  </button>
                </div>
              </form>
            </div>

            {/* List of Existing QA Items */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "16px", color: "#ffffff", fontWeight: "800" }}>
                  📋 รายการข้อซักถามทั้งหมด ({infoQaBoard.length} รายการ)
                </h3>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    placeholder="ค้นหาตามชื่อ/หัวข้อ/ข้อความ..."
                    value={qaAdminSearch}
                    onChange={(e) => setQaAdminSearch(e.target.value)}
                    style={{
                      background: "rgba(0, 15, 30, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      color: "#ffffff",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                  <select
                    value={qaCategoryFilter}
                    onChange={(e) => setQaCategoryFilter(e.target.value)}
                    style={{
                      background: "rgba(0, 15, 30, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      color: "#ffffff",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  >
                    <option value="all">ทุกหมวด</option>
                    <option value="3 วินาที">⏱️ 3 วินาที</option>
                    <option value="คำถาม-คำตอบ">❓ คำถาม-คำตอบ</option>
                    <option value="จิ๊กซอว์">🧩 จิ๊กซอว์</option>
                    <option value="คุณสมบัติ">🔍 คุณสมบัติ</option>
                  </select>
                </div>
              </div>

              {infoQaBoard.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    background: "rgba(10, 20, 40, 0.4)",
                    borderRadius: "14px",
                    border: "1px dashed rgba(255, 255, 255, 0.15)",
                    color: "#94a3b8",
                  }}
                >
                  ยังไม่มีข้อซักถามในระบบ
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {infoQaBoard
                    .filter((item) => {
                      if (qaCategoryFilter !== "all" && item.category !== qaCategoryFilter) return false;
                      const q = qaAdminSearch.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        (item.contestantName && item.contestantName.toLowerCase().includes(q)) ||
                        (item.nickname && item.nickname.toLowerCase().includes(q)) ||
                        (item.topic && item.topic.toLowerCase().includes(q)) ||
                        (item.question && item.question.toLowerCase().includes(q)) ||
                        (item.answer && item.answer.toLowerCase().includes(q))
                      );
                    })
                    .map((item) => {
                      const matched =
                        contestants.find((c) => String(c.id) === String(item.contestantId)) ||
                        infoKeywords.find((k) => String(k.id) === String(item.contestantId));
                      const isDeleting = deletingQaId === item.id;

                      return (
                        <div
                          key={item.id}
                          style={{
                            background: "rgba(10, 20, 40, 0.75)",
                            border: "1px solid rgba(0, 229, 255, 0.25)",
                            borderRadius: "14px",
                            padding: "18px 20px",
                          }}
                        >
                          {/* Header */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: "10px",
                              marginBottom: "12px",
                              paddingBottom: "10px",
                              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "8px",
                                  overflow: "hidden",
                                  background: "#030814",
                                  border: "1px solid rgba(0, 229, 255, 0.4)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <AdminPhotoPreview
                                  src={matched?.image}
                                  name={item.contestantName}
                                  size={36}
                                />
                              </div>
                              <div>
                                <div style={{ fontSize: "14px", fontWeight: "800", color: "#ffffff" }}>
                                  {item.contestantName} {item.nickname ? `(${item.nickname})` : ""}
                                </div>
                                <div style={{ fontSize: "12px", color: "#ffd700" }}>
                                  🏷️ {item.topic}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span
                                style={{
                                  background: "rgba(0, 229, 255, 0.15)",
                                  border: "1px solid rgba(0, 229, 255, 0.4)",
                                  color: "#00e5ff",
                                  padding: "3px 10px",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                }}
                              >
                                หมวด: {item.category}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleEditQa(item)}
                                style={{
                                  background: "rgba(255, 215, 0, 0.15)",
                                  border: "1px solid rgba(255, 215, 0, 0.4)",
                                  color: "#ffd700",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                }}
                              >
                                ✏️ แก้ไข
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteQa(item.id)}
                                disabled={isDeleting}
                                style={{
                                  background: "rgba(239, 68, 68, 0.15)",
                                  border: "1px solid rgba(239, 68, 68, 0.4)",
                                  color: "#fca5a5",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  cursor: isDeleting ? "not-allowed" : "pointer",
                                }}
                              >
                                {isDeleting ? "⏳" : "🗑️ ลบ"}
                              </button>
                            </div>
                          </div>

                          {/* Question */}
                          <div
                            style={{
                              background: "rgba(0, 0, 0, 0.3)",
                              padding: "10px 14px",
                              borderRadius: "8px",
                              marginBottom: "10px",
                            }}
                          >
                            <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700", marginBottom: "4px" }}>
                              คำถาม:
                            </div>
                            <DiscordMarkdown content={item.question} />
                          </div>

                          {/* Answer */}
                          <div
                            style={{
                              background: "rgba(255, 215, 0, 0.05)",
                              border: "1px solid rgba(255, 215, 0, 0.2)",
                              padding: "10px 14px",
                              borderRadius: "8px",
                            }}
                          >
                            <div style={{ fontSize: "11px", color: "#ffd700", fontWeight: "700", marginBottom: "4px" }}>
                              คำตอบจากทีมงาน:
                            </div>
                            <DiscordMarkdown content={item.answer} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB: USER MANAGEMENT (ADMIN ACCOUNTS)
           ======================================================== */}
        {activeTab === "users" && (
          <AdminUserManagement
            token={token}
            section="trial_foty"
            currentUser={user}
            theme="gold"
            sectionLabel="Trial FoTY (งุ่นง่าน 2026)"
          />
        )}
      </div>

      {/* ========================================================
          MODAL: ADD / EDIT CONTESTANT (Matching Main Admin Exact Structure)
         ======================================================== */}
      {showContestantModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              maxWidth: "520px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "linear-gradient(150deg, #0d213a 0%, #07101f 100%)",
              border: "1px solid rgba(0, 229, 255, 0.4)",
              borderRadius: "18px",
              padding: "26px",
              boxShadow: "0 0 40px rgba(0, 229, 255, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#00e5ff", margin: 0 }}>
                {isMaintainer ? "📷 เปลี่ยนรูปภาพผู้เข้าแข่งขัน (Maintainer)" : (modalMode === "edit" ? "✏️ แก้ไขข้อมูล / ผูกรูปผู้เข้าแข่งขัน" : "➕ เพิ่มผู้เข้าแข่งขันใหม่")}
              </h3>
              <button
                type="button"
                onClick={() => setShowContestantModal(false)}
                style={{ background: "transparent", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {isMaintainer && (
              <div style={{ background: "rgba(0, 229, 255, 0.1)", border: "1px solid rgba(0, 229, 255, 0.3)", borderRadius: "8px", padding: "10px", marginBottom: "14px", fontSize: "12px", color: "#e0f2fe" }}>
                🔒 บัญชีสิทธิ์ Maintainer สามารถแก้ไขเฉพาะ URL รูปภาพหรืออัปโหลดรูปภาพใหม่เท่านั้น (ข้อมูลชื่อและหัวข้อถูกล็อก)
              </div>
            )}

            <form onSubmit={handleSaveContestant}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#80d0ff", marginBottom: "4px" }}>
                  ชื่อจริง - นามสกุล * {isMaintainer && "(ล็อก)"}
                </label>
                <input
                  type="text"
                  required
                  disabled={isMaintainer}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น นัทธสม บุญมา"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    background: isMaintainer ? "rgba(255,255,255,0.05)" : "#050b14",
                    border: "1px solid rgba(0,229,255,0.3)",
                    color: isMaintainer ? "rgba(255,255,255,0.6)" : "#fff",
                    boxSizing: "border-box",
                    cursor: isMaintainer ? "not-allowed" : "text",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#80d0ff", marginBottom: "4px" }}>
                    ชื่อเล่น {isMaintainer && "(ล็อก)"}
                  </label>
                  <input
                    type="text"
                    disabled={isMaintainer}
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="เช่น ซ่า"
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      background: isMaintainer ? "rgba(255,255,255,0.05)" : "#050b14",
                      border: "1px solid rgba(0,229,255,0.3)",
                      color: isMaintainer ? "rgba(255,255,255,0.6)" : "#fff",
                      boxSizing: "border-box",
                      cursor: isMaintainer ? "not-allowed" : "text",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#80d0ff", marginBottom: "4px" }}>
                    ลำดับแข่ง (Order) {isMaintainer && "(ล็อก)"}
                  </label>
                  <input
                    type="number"
                    disabled={isMaintainer}
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                    placeholder="เช่น 1, 2, 3"
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      background: isMaintainer ? "rgba(255,255,255,0.05)" : "#050b14",
                      border: "1px solid rgba(0,229,255,0.3)",
                      color: isMaintainer ? "rgba(255,255,255,0.6)" : "#fff",
                      boxSizing: "border-box",
                      cursor: isMaintainer ? "not-allowed" : "text",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#80d0ff", marginBottom: "4px" }}>
                  หัวข้อแฟนพันธุ์แท้ * {isMaintainer && "(ล็อก)"}
                </label>
                <input
                  type="text"
                  required
                  disabled={isMaintainer}
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="เช่น ประวัติศาสตร์ไทย"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    background: isMaintainer ? "rgba(255,255,255,0.05)" : "#050b14",
                    border: "1px solid rgba(0,229,255,0.3)",
                    color: isMaintainer ? "rgba(255,255,255,0.6)" : "#fff",
                    boxSizing: "border-box",
                    cursor: isMaintainer ? "not-allowed" : "text",
                  }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#ffa940", marginBottom: "4px" }}>
                  🗓️ นัดหมายวัน-เวลาแข่งรอบอุ่นเครื่อง (Warm-up Schedule) {isMaintainer && "(ล็อก)"}
                </label>
                <input
                  type="text"
                  disabled={isMaintainer}
                  value={formData.warmupSchedule || ""}
                  onChange={(e) => setFormData({ ...formData, warmupSchedule: e.target.value })}
                  placeholder="เช่น พุธ 12 พ.ย. 20:00 น."
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    background: isMaintainer ? "rgba(255,255,255,0.05)" : "#080402",
                    border: formData.warmupSchedule ? "1.5px solid #ff8800" : "1px solid rgba(255,136,0,0.3)",
                    color: formData.warmupSchedule ? "#ffa940" : "#fff",
                    boxSizing: "border-box",
                    cursor: isMaintainer ? "not-allowed" : "text",
                  }}
                />
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "3px", display: "block" }}>
                  หากระบุไว้ ชื่อจะแสดงในตารางรอบอุ่นเครื่องที่หน้าเว็บหลักทันที พร้อมแถบเวลานัดแข่ง
                </span>
              </div>

              {/* Photo Binding Section */}
              <div
                style={{
                  background: "rgba(0, 15, 30, 0.7)",
                  border: "1px solid rgba(0, 229, 255, 0.25)",
                  borderRadius: "10px",
                  padding: "14px",
                  marginBottom: "16px",
                }}
              >
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#00e5ff", marginBottom: "8px" }}>
                  🖼️ ผูกรูปภาพผู้เข้าแข่งขัน (Google Photos Binding)
                </label>

                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "10px" }}>
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      background: "#050b14",
                      border: "2px solid #00e5ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <AdminPhotoPreview src={formData.image} name={formData.name} size={56} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="วาง URL รูปภาพ เช่น https://lh3.googleusercontent.com/..."
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        background: "#050b14",
                        border: "1px solid rgba(0,229,255,0.3)",
                        color: "#fff",
                        fontSize: "12px",
                        boxSizing: "border-box",
                      }}
                    />
                    <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "4px", display: "block" }}>
                      รองรับ Direct Link ของ Google Photos (`lh3.googleusercontent.com`)
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowContestantModal(false)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.1)",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 22px",
                    borderRadius: "8px",
                    background: "linear-gradient(90deg, #00e5ff 0%, #0077b6 100%)",
                    border: "none",
                    color: "#030812",
                    fontWeight: "800",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  💾 บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: RESET COMPETITION CONFIRMATION
         ======================================================== */}
      {showResetModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              maxWidth: "460px",
              width: "100%",
              background: "linear-gradient(150deg, #2b0b0e 0%, #150507 100%)",
              border: "1.5px solid #ef4444",
              borderRadius: "18px",
              padding: "26px",
              boxShadow: "0 0 40px rgba(239, 68, 68, 0.4)",
            }}
          >
            <div style={{ fontSize: "36px", textAlign: "center", marginBottom: "12px" }}>⚠️</div>
            <h3 style={{ fontSize: "18px", fontWeight: "900", color: "#fca5a5", textAlign: "center", margin: "0 0 10px 0" }}>
              ยืนยันการรีเซ็ตคะแนนทั้งหมด?
            </h3>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: "1.6", textAlign: "center", margin: "0 0 20px 0" }}>
              คะแนนทั้ง 4 หมวดของผู้เข้าแข่งขันทุกคนจะถูกรีเซ็ตกลับเป็น <strong>0</strong> และปลดสถานะกำลังแข่งทั้งหมด เพื่อให้พร้อมเริ่มแข่งขันรอบใหม่ (รายชื่อและรูปภาพจะไม่ถูกลบ)
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleResetScores}
                style={{
                  padding: "10px 22px",
                  borderRadius: "8px",
                  background: "linear-gradient(90deg, #dc2626 0%, #991b1b 100%)",
                  border: "none",
                  color: "#ffffff",
                  fontWeight: "800",
                  cursor: "pointer",
                  fontSize: "14px",
                  boxShadow: "0 0 15px rgba(220, 38, 38, 0.5)",
                }}
              >
                🔄 ยืนยันการรีเซ็ต
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
