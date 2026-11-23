import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getKVData, saveKVData } from "@/lib/kv";

const POLL_FILE = path.join(process.cwd(), "src/app/data/trial-poll.json");
const SETTINGS_FILE = path.join(process.cwd(), "src/app/data/settings.json");
const TRIAL_DATA_FILE = path.join(process.cwd(), "src/app/data/trial-leaderboard.json");
const GAME_DATA_FILE = path.join(process.cwd(), "src/app/data/game_leaderboard.json");

function readGameData() {
  try {
    if (fs.existsSync(GAME_DATA_FILE)) {
      return JSON.parse(fs.readFileSync(GAME_DATA_FILE, "utf-8"));
    }
  } catch (e) {}
  return [];
}

function readTrialData() {
  try {
    if (fs.existsSync(TRIAL_DATA_FILE)) {
      return JSON.parse(fs.readFileSync(TRIAL_DATA_FILE, "utf-8"));
    }
  } catch (e) {}
  return [];
}

function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
    }
  } catch (e) {}
  return { trialVotingOpen: true };
}

function writeSettings(data) {
  try {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {}
}

async function getVotingStatus() {
  try {
    const settings = await getKVData("fpt_settings", readSettings);
    return settings ? settings.trialVotingOpen !== false : true;
  } catch (e) {
    return true;
  }
}

function getDefaultPoll() {
  try {
    if (fs.existsSync(POLL_FILE)) {
      const content = fs.readFileSync(POLL_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (e) {
    console.error("Error reading initial trial-poll.json:", e);
  }
  return [];
}

function readLocalPoll() {
  try {
    if (!fs.existsSync(POLL_FILE)) {
      const def = getDefaultPoll();
      try {
        fs.mkdirSync(path.dirname(POLL_FILE), { recursive: true });
        fs.writeFileSync(POLL_FILE, JSON.stringify(def, null, 2), "utf-8");
      } catch (e) {}
      return def;
    }
    const content = fs.readFileSync(POLL_FILE, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading trial poll data:", err);
    return getDefaultPoll();
  }
}

function writeLocalPoll(data) {
  try {
    fs.mkdirSync(path.dirname(POLL_FILE), { recursive: true });
    fs.writeFileSync(POLL_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    if (err.code !== "EROFS") {
      console.error("Error writing trial poll data:", err);
    }
  }
}

/**
 * Recalculate poll percentages:
 * 30% from Warm-up Round What If? Score: (contestant whatIf / total whatIf) * 30%
 * 70% from Popular Votes: (contestant votes / total votes) * 70%
 * Total Poll % = (Vote 70%) + (What If 30%) = 100% total
 */
function computePollPercentages(items) {
  const totalVotes = items.reduce((sum, item) => sum + (Number(item.votes) || 0), 0);
  const totalWhatIf = items.reduce((sum, item) => sum + (Number(item.whatIfScore) || 0), 0);

  return items.map((item) => {
    const v = Number(item.votes) || 0;
    const w = Math.min(100, Math.max(0, Number(item.whatIfScore) || 0));

    // What If (30% เต็ม): สัดส่วนคะแนน What If คนนี้ ÷ รวมทุกคน x 30%
    const whatIfShare30 = totalWhatIf > 0 ? (w / totalWhatIf) * 30 : 0;

    // คะแนนโหวตมหาชน (70% เต็ม): สัดส่วนคะแนนโหวตคนนี้ ÷ รวมโหวตทุกคน x 70%
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
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  const [data, trialContestants, gameScores, rawSettings] = await Promise.all([
    getKVData("fpt_trial_poll", readLocalPoll),
    getKVData("fpt_trial", readTrialData),
    getKVData("fpt_game_leaderboard", readGameData),
    getKVData("fpt_settings", readSettings),
  ]);
  const votingOpen = rawSettings ? rawSettings.trialVotingOpen !== false : true;
  const showWarmupTable = rawSettings ? rawSettings.showWarmupTable !== false : true;
  const showTrialPollTable = rawSettings
    ? (rawSettings.showTrialPollTable !== undefined ? rawSettings.showTrialPollTable !== false : true)
    : true;
  const showPollTable = showTrialPollTable;
  const showTrialContestantsOnHome = Boolean(rawSettings?.showTrialContestantsOnHome);
  const hideTrialPollScoresDuringVote = rawSettings ? rawSettings.hideTrialPollScoresDuringVote !== false : true;

  let isAdmin = false;
  try {
    if (req) {
      const url = new URL(req.url);
      if (url.searchParams.get("admin") === "1") isAdmin = true;
    }
  } catch (e) {}

  const isScoreHidden = Boolean(!isAdmin && votingOpen && hideTrialPollScoresDuringVote);

  const pollList = Array.isArray(data) && data.length > 0 ? data : getDefaultPoll();
  const contestants = Array.isArray(trialContestants) ? trialContestants : [];
  const games = Array.isArray(gameScores) ? gameScores : [];

  // Merge latest photos and contestant info from trial leaderboard into poll items
  const enrichedPoll = pollList.map((item) => {
    const matched = contestants.find(
      (c) =>
        (c.id && item.id && String(c.id) === String(item.id)) ||
        (c.name && item.name && c.name.trim() === item.name.trim()) ||
        (c.nickname && item.nickname && c.nickname.trim() === item.nickname.trim())
    );
    const matchedGame = games.find(
      (g) =>
        (g.id && item.id && String(g.id) === String(item.id)) ||
        (g.name && item.name && g.name.trim() === item.name.trim()) ||
        (g.nickname && item.nickname && g.nickname.trim() === item.nickname.trim())
    );
    return {
      ...item,
      image: (matched && matched.image) ? matched.image : (item.image || ""),
      name: (matched && matched.name) ? matched.name : (item.name || ""),
      nickname: (matched && matched.nickname) ? matched.nickname : (item.nickname || ""),
      topic: (matched && matched.topic) ? matched.topic : (item.topic || "-"),
      warmupSchedule: (matched && matched.warmupSchedule) ? matched.warmupSchedule : (item.warmupSchedule || ""),
      description: item.description || matched?.description || "",
      videoUrl: item.videoUrl || matched?.videoUrl || "",
      scores: item.scores || matchedGame?.scores || matched?.scores || { "3sec": null, qa: null, jigsaw: null, attribute: null },
      gameScores: matchedGame?.scores || matched?.scores || null,
      gameTotalScore: matchedGame?.totalScore !== undefined ? matchedGame.totalScore : Number(item.whatIfScore || matched?.totalScore || 0),
    };
  });

  let outputData = enrichedPoll;
  if (isScoreHidden) {
    outputData = enrichedPoll
      .map((item) => ({
        ...item,
        pollRank: "?",
        votes: 0,
        totalScore: 0,
        whatIfScore: 0,
        scores: { "3sec": null, qa: null, jigsaw: null, attribute: null },
        gameScores: null,
        gameTotalScore: 0,
        percent: "🔒 รอสรุปผล",
        championVotes: 0,
        rankVotes: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      }))
      .sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
  }

  return NextResponse.json(
    {
      success: true,
      data: outputData,
      votingOpen,
      showWarmupTable,
      showPollTable,
      showTrialPollTable,
      showTrialContestantsOnHome,
      isScoreHidden,
      hideTrialPollScoresDuringVote,
      trialSubtitle:
        rawSettings?.trialSubtitle ||
        "ศึกประลองความรู้แฟนพันธุ์แท้ฉบับทดสอบ (Trial Edition) คำนวณแบบ Dense Ranking พร้อมระบบโควตาตัดตัว 5 อันดับแรก",
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "CDN-Cache-Control": "no-store",
      },
    }
  );
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Update Trial Subtitle action
    if (body.action === "update_trial_subtitle" || body.action === "update_subtitle") {
      const rawSettings = await getKVData("fpt_settings", readSettings);
      const newSubtitle = String(body.trialSubtitle || body.subtitle || "").trim();
      const updatedSettings = {
        ...(rawSettings || {}),
        trialSubtitle:
          newSubtitle ||
          "ศึกประลองความรู้แฟนพันธุ์แท้ฉบับทดสอบ (Trial Edition) คำนวณแบบ Dense Ranking พร้อมระบบโควตาตัดตัว 5 อันดับแรก",
      };
      writeSettings(updatedSettings);
      await saveKVData("fpt_settings", updatedSettings, writeSettings);
      return NextResponse.json({
        success: true,
        trialSubtitle: updatedSettings.trialSubtitle,
        message: "บันทึกคำเปรยของ Trial FOTY เรียบร้อยแล้ว",
      });
    }

    // Toggle / Set voting open status
    if (body.action === "toggle_voting" || body.action === "set_voting_open") {
      const rawSettings = await getKVData("fpt_settings", readSettings);
      const currentStatus = rawSettings ? rawSettings.trialVotingOpen !== false : true;
      const newStatus = body.votingOpen !== undefined ? Boolean(body.votingOpen) : !currentStatus;
      const updatedSettings = { ...(rawSettings || {}), trialVotingOpen: newStatus };

      writeSettings(updatedSettings);
      await saveKVData("fpt_settings", updatedSettings, writeSettings);

      return NextResponse.json({
        success: true,
        votingOpen: newStatus,
        message: newStatus ? "🟢 เปิดรับการโหวตโพลล์มหาชนแล้ว" : "🔴 ปิดรับการโหวตโพลล์มหาชนแล้ว",
      });
    }

    // Toggle warm-up table visibility on front page
    if (body.action === "toggle_warmup_table" || body.action === "set_warmup_table") {
      const rawSettings = await getKVData("fpt_settings", readSettings);
      const currentStatus = rawSettings ? rawSettings.showWarmupTable !== false : true;
      const newStatus = body.showWarmupTable !== undefined ? Boolean(body.showWarmupTable) : !currentStatus;
      const updatedSettings = { ...(rawSettings || {}), showWarmupTable: newStatus };

      writeSettings(updatedSettings);
      await saveKVData("fpt_settings", updatedSettings, writeSettings);

      return NextResponse.json({
        success: true,
        showWarmupTable: newStatus,
        message: newStatus ? "🟢 เปิดแสดงตารางรอบอุ่นเครื่องในหน้าแรกแล้ว" : "🔴 ซ่อนตารางรอบอุ่นเครื่องในหน้าแรกแล้ว",
      });
    }

    // Toggle poll table visibility on trial front page
    if (body.action === "toggle_poll_table" || body.action === "set_poll_table" || body.action === "toggle_trial_poll_table") {
      const rawSettings = await getKVData("fpt_settings", readSettings);
      const currentStatus = rawSettings
        ? (rawSettings.showTrialPollTable !== undefined ? rawSettings.showTrialPollTable !== false : true)
        : true;
      const newStatus =
        body.showTrialPollTable !== undefined
          ? Boolean(body.showTrialPollTable)
          : body.showPollTable !== undefined
          ? Boolean(body.showPollTable)
          : !currentStatus;
      const updatedSettings = {
        ...(rawSettings || {}),
        showTrialPollTable: newStatus,
      };

      writeSettings(updatedSettings);
      await saveKVData("fpt_settings", updatedSettings, writeSettings);

      return NextResponse.json({
        success: true,
        showPollTable: newStatus,
        showTrialPollTable: newStatus,
        message: newStatus ? "🟢 เปิดแสดงตารางโพลล์ในหน้าแรกแล้ว" : "🔴 ซ่อนตารางโพลล์ในหน้าแรกแล้ว",
      });
    }

    // Toggle contestants view mode on trial front page
    if (body.action === "toggle_trial_contestants_on_home") {
      const rawSettings = await getKVData("fpt_settings", readSettings);
      const currentVal = Boolean(rawSettings?.showTrialContestantsOnHome);
      const newStatus =
        body.showTrialContestantsOnHome !== undefined
          ? Boolean(body.showTrialContestantsOnHome)
          : !currentVal;
      const updatedSettings = {
        ...(rawSettings || {}),
        showTrialContestantsOnHome: newStatus,
      };

      writeSettings(updatedSettings);
      await saveKVData("fpt_settings", updatedSettings, writeSettings);

      return NextResponse.json({
        success: true,
        showTrialContestantsOnHome: newStatus,
        message: newStatus ? "🟢 เปลี่ยนหน้าแรก Trial เป็นหน้าข้อมูลผู้เข้าแข่งขันแล้ว" : "🔴 ปิดโหมดหน้าข้อมูลผู้เข้าแข่งขันแล้ว",
      });
    }

    // Toggle hide trial poll scores during vote (Spoiler Shield)
    if (body.action === "toggle_hide_scores" || body.action === "toggle_hide_trial_poll_scores") {
      const rawSettings = await getKVData("fpt_settings", readSettings);
      const currentVal = rawSettings ? rawSettings.hideTrialPollScoresDuringVote !== false : true;
      const newStatus =
        body.hideTrialPollScoresDuringVote !== undefined
          ? Boolean(body.hideTrialPollScoresDuringVote)
          : !currentVal;
      const updatedSettings = {
        ...(rawSettings || {}),
        hideTrialPollScoresDuringVote: newStatus,
      };
      writeSettings(updatedSettings);
      await saveKVData("fpt_settings", updatedSettings, writeSettings);
      return NextResponse.json({
        success: true,
        hideTrialPollScoresDuringVote: newStatus,
        message: newStatus ? "🛡️ เปิดระบบปิดการมองเห็นคะแนนโพลล์ระหว่างโหวตแล้ว" : "🔓 ปิดระบบกันสปอยล์ (แสดงคะแนนตามปกติ)",
      });
    }

    // Sync game scores from /game (fpt_game_leaderboard) into whatIfScore (30% weight)
    if (body.action === "sync_game_scores") {
      const [currentPoll, gameScores] = await Promise.all([
        getKVData("fpt_trial_poll", readLocalPoll),
        getKVData("fpt_game_leaderboard", readGameData),
      ]);
      const pollItems = Array.isArray(currentPoll) && currentPoll.length > 0 ? currentPoll : getDefaultPoll();
      const games = Array.isArray(gameScores) ? gameScores : [];

      let updatedCount = 0;
      const updatedPoll = pollItems.map((item) => {
        const matched = games.find(
          (g) =>
            (g.id && item.id && String(g.id) === String(item.id)) ||
            (g.name && item.name && g.name.trim() === item.name.trim()) ||
            (g.nickname && item.nickname && g.nickname.trim() === item.nickname.trim())
        );
        if (matched && matched.totalScore !== undefined && matched.totalScore !== null) {
          updatedCount++;
          return {
            ...item,
            whatIfScore: Number(matched.totalScore) || 0,
          };
        }
        return item;
      });

      let recomputed = computePollPercentages(updatedPoll);
      recomputed.sort((a, b) => parseFloat(b.percent || b.totalScore || 0) - parseFloat(a.percent || a.totalScore || 0));
      recomputed = recomputed.map((item, idx) => ({ ...item, pollRank: idx + 1 }));
      await saveKVData("fpt_trial_poll", recomputed, writeLocalPoll);

      return NextResponse.json({
        success: true,
        message: `ซิงค์คะแนนจากห้องเล่นเกมสำเร็จ (${updatedCount} คน)`,
        data: recomputed,
      });
    }

    // Reset poll to default 40 contestants
    if (body.action === "reset") {
      const def = getDefaultPoll();
      await saveKVData("fpt_trial_poll", def, writeLocalPoll);
      return NextResponse.json({
        success: true,
        data: def,
        message: "รีเซ็ตตารางผลโพลล์ Trial FoTY เป็นค่าเริ่มต้น 40 คนแล้ว",
      });
    }

    // Save all items (reorder, manual percent, whatIfScore, etc.)
    if (body.action === "save_all" && Array.isArray(body.items)) {
      const trialContestants = await getKVData("fpt_trial", readTrialData);
      const contestants = Array.isArray(trialContestants) ? trialContestants : [];

      const sanitized = body.items.map((item, idx) => {
        const matched = contestants.find(
          (c) =>
            (c.id && item.id && String(c.id) === String(item.id)) ||
            (c.name && item.name && c.name.trim() === item.name.trim()) ||
            (c.nickname && item.nickname && c.nickname.trim() === item.nickname.trim())
        );

        return {
          pollRank: Number(item.pollRank) || idx + 1,
          id: item.id ? String(item.id) : String(idx + 1),
          name: String(item.name || matched?.name || "").trim(),
          nickname: String(item.nickname || matched?.nickname || "").trim(),
          topic: String(item.topic || matched?.topic || "").trim(),
          percent: String(item.percent || "").trim() || "0.00%",
          votes: Number(item.votes) || 0,
          whatIfScore: Math.min(100, Math.max(0, Number(item.whatIfScore) || 0)),
          totalScore: Number(item.totalScore) || 0,
          championVotes: Number(item.championVotes) || 0,
          rankVotes:
            item.rankVotes && typeof item.rankVotes === "object"
              ? {
                  "1": Number(item.rankVotes["1"] || item.rankVotes[1]) || 0,
                  "2": Number(item.rankVotes["2"] || item.rankVotes[2]) || 0,
                  "3": Number(item.rankVotes["3"] || item.rankVotes[3]) || 0,
                  "4": Number(item.rankVotes["4"] || item.rankVotes[4]) || 0,
                  "5": Number(item.rankVotes["5"] || item.rankVotes[5]) || 0,
                }
              : { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
          image: item.image || matched?.image || "",
          warmupSchedule: String(item.warmupSchedule || matched?.warmupSchedule || "").trim(),
          description: item.description !== undefined ? String(item.description) : (matched?.description || ""),
          videoUrl: item.videoUrl !== undefined ? String(item.videoUrl) : (matched?.videoUrl || ""),
          scores: item.scores || matched?.scores || null,
        };
      });

      // Sort by pollRank ascending
      sanitized.sort((a, b) => a.pollRank - b.pollRank);
      await saveKVData("fpt_trial_poll", sanitized, writeLocalPoll);

      // Also sync warmupSchedule, description, videoUrl, scores to fpt_trial contestants
      try {
        let tData = await getKVData("fpt_trial", readTrialData);
        if (Array.isArray(tData)) {
          let tChanged = false;
          tData = tData.map((c) => {
            const m = sanitized.find(
              (p) =>
                (p.id && c.id && String(p.id) === String(c.id)) ||
                (p.name && c.name && p.name.trim() === c.name.trim()) ||
                (p.nickname && c.nickname && p.nickname.trim() === c.nickname.trim())
            );
            if (m) {
              let updated = { ...c };
              if (m.warmupSchedule !== undefined && m.warmupSchedule !== c.warmupSchedule) {
                tChanged = true;
                updated.warmupSchedule = m.warmupSchedule;
              }
              if (m.description !== undefined && m.description !== c.description) {
                tChanged = true;
                updated.description = m.description;
              }
              if (m.videoUrl !== undefined && m.videoUrl !== c.videoUrl) {
                tChanged = true;
                updated.videoUrl = m.videoUrl;
              }
              if (m.scores !== undefined && JSON.stringify(m.scores) !== JSON.stringify(c.scores)) {
                tChanged = true;
                updated.scores = m.scores;
              }
              return updated;
            }
            return c;
          });
          if (tChanged) {
            writeTrialData(tData);
            await saveKVData("fpt_trial", tData, writeTrialData);
          }
        }
      } catch (e) {}

      return NextResponse.json({
        success: true,
        data: sanitized,
        message: "บันทึกผลโพลล์ Trial FoTY ทั้งหมดเรียบร้อยแล้ว",
      });
    }

    // Update Candidate Details (Admin: description, videoUrl, scores, whatIfScore, warmupSchedule)
    if (body.action === "save_candidate_details" || body.action === "update_candidate_details") {
      let currentPoll = await getKVData("fpt_trial_poll", readLocalPoll);
      if (!Array.isArray(currentPoll) || currentPoll.length === 0) {
        currentPoll = getDefaultPoll();
      }
      const { id, name, nickname, description, videoUrl, scores, whatIfScore, warmupSchedule } = body;
      let found = false;
      let updatedPoll = currentPoll.map((item) => {
        const matchesId = id && String(item.id) === String(id);
        const matchesName = name && item.name && item.name.trim() === String(name).trim();
        const matchesNick = nickname && item.nickname && item.nickname.trim() === String(nickname).trim();
        if (matchesId || matchesName || matchesNick) {
          found = true;
          return {
            ...item,
            description: description !== undefined ? String(description) : (item.description || ""),
            videoUrl: videoUrl !== undefined ? String(videoUrl) : (item.videoUrl || ""),
            scores: scores !== undefined ? scores : (item.scores || null),
            whatIfScore: whatIfScore !== undefined ? Number(whatIfScore) : (item.whatIfScore || 0),
            warmupSchedule: warmupSchedule !== undefined ? String(warmupSchedule) : (item.warmupSchedule || ""),
          };
        }
        return item;
      });

      // Recalculate percent
      updatedPoll = computePollPercentages(updatedPoll);
      await saveKVData("fpt_trial_poll", updatedPoll, writeLocalPoll);

      // Also sync to fpt_trial contestants
      try {
        let tData = await getKVData("fpt_trial", readTrialData);
        if (Array.isArray(tData)) {
          let tChanged = false;
          tData = tData.map((c) => {
            const matchesId = id && String(c.id) === String(id);
            const matchesName = name && c.name && c.name.trim() === String(name).trim();
            const matchesNick = nickname && c.nickname && c.nickname.trim() === String(nickname).trim();
            if (matchesId || matchesName || matchesNick) {
              tChanged = true;
              return {
                ...c,
                description: description !== undefined ? String(description) : (c.description || ""),
                videoUrl: videoUrl !== undefined ? String(videoUrl) : (c.videoUrl || ""),
                scores: scores !== undefined ? scores : (c.scores || null),
                warmupSchedule: warmupSchedule !== undefined ? String(warmupSchedule) : (c.warmupSchedule || ""),
              };
            }
            return c;
          });
          if (tChanged) {
            writeTrialData(tData);
            await saveKVData("fpt_trial", tData, writeTrialData);
          }
        }
      } catch (e) {}

      return NextResponse.json({
        success: true,
        data: updatedPoll,
        message: "บันทึกข้อมูลและคลิปของผู้เข้าแข่งขันเรียบร้อยแล้ว",
      });
    }

    // Calculate percent formula action (70% votes + 30% what-if)
    if (body.action === "calculate_percent" && Array.isArray(body.items)) {
      let computed = computePollPercentages(body.items);
      computed.sort((a, b) => parseFloat(b.percent) - parseFloat(a.percent));
      computed = computed.map((item, idx) => ({ ...item, pollRank: idx + 1 }));
      await saveKVData("fpt_trial_poll", computed, writeLocalPoll);
      return NextResponse.json({
        success: true,
        data: computed,
        message: "คำนวณ % โพลล์ (โหวต 70% + รอบอุ่นเครื่อง 30%) เรียบร้อยแล้ว",
      });
    }

    let current = await getKVData("fpt_trial_poll", readLocalPoll);
    if (!Array.isArray(current) || current.length === 0) {
      current = getDefaultPoll();
    }

    // Check if voting is open before processing any vote action
    if (body.action === "ballot_vote" || body.action === "vote") {
      const isVotingOpen = await getVotingStatus();
      if (!isVotingOpen) {
        return NextResponse.json(
          {
            success: false,
            error: "ขณะนี้ระบบปิดรับการโหวตโพลล์มหาชนแล้ว ขออภัยในความไม่สะดวก",
          },
          { status: 403 }
        );
      }
    }

    // Ballot vote: 5 ranks (up to 5 contestants per rank) + 1 champion
    // Directly scores into KV & file so votes update immediately in the admin panel!
    if (body.action === "ballot_vote") {
      const ranks = body.ranks || {};
      const championId = body.champion ? String(body.champion) : null;

      // Weight mapping for ranks 1-5 (ที่ 1=10, ที่ 2=7, ที่ 3=5, ที่ 4=3, ที่ 5=2)
      const rankWeights = {
        "1": 10, // อันดับ 1 ได้ 10 คะแนนต่อคน
        "2": 7,  // อันดับ 2 ได้ 7 คะแนนต่อคน
        "3": 5,  // อันดับ 3 ได้ 5 คะแนนต่อคน
        "4": 3,  // อันดับ 4 ได้ 3 คะแนนต่อคน
        "5": 2,  // อันดับ 5 ได้ 2 คะแนนต่อคน
      };

      // Add points for ranks 1-5 (each contestant can only be selected in one rank)
      const seenContestants = new Set();
      Object.entries(ranks).forEach(([rankStr, contestantIds]) => {
        const weight = rankWeights[rankStr] || 0;
        const ids = Array.isArray(contestantIds) ? contestantIds : [contestantIds];
        ids.forEach((cId) => {
          if (!cId) return;
          const strId = String(cId);
          if (seenContestants.has(strId)) return; // Disallow duplicate selection across ranks
          seenContestants.add(strId);

          const target = current.find(
            (item) => String(item.id) === strId || (item.name && String(item.name) === strId)
          );
          if (target) {
            target.votes = (Number(target.votes) || 0) + weight;
            if (!target.rankVotes) target.rankVotes = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
            target.rankVotes[rankStr] = (target.rankVotes[rankStr] || 0) + 1;
          }
        });
      });

      // Add champion vote (สุดยอดแฟนพันธุ์แท้ 15 คะแนนพิเศษ) - ต้องเป็นคนจาก 5 อันดับแรกเท่านั้น
      let validChampionId = null;
      if (championId) {
        const champStr = String(championId);
        const champTarget = current.find(
          (item) => String(item.id) === champStr || (item.name && String(item.name) === champStr)
        );
        const isPresentInRanks =
          champTarget &&
          (seenContestants.has(String(champTarget.id)) ||
            (champTarget.name && seenContestants.has(String(champTarget.name))) ||
            seenContestants.has(champStr));

        if (isPresentInRanks && champTarget) {
          validChampionId = champTarget.id;
          champTarget.votes = (Number(champTarget.votes) || 0) + 15; // เพิ่ม 15 คะแนนพิเศษสำหรับตำแหน่งแชมป์
          champTarget.championVotes = (Number(champTarget.championVotes) || 0) + 1;
        }
      }

      // คนที่ไม่ถูกโหวตเลยในใบโหวตนั้นๆ จะได้คนละ 1 คะแนน
      const votedIdsOrNames = new Set([...seenContestants]);
      if (validChampionId) {
        votedIdsOrNames.add(String(validChampionId));
        const champObj = current.find(
          (item) => String(item.id) === String(validChampionId) || (item.name && String(item.name) === String(validChampionId))
        );
        if (champObj?.name) votedIdsOrNames.add(String(champObj.name));
        if (champObj?.id) votedIdsOrNames.add(String(champObj.id));
      }

      current.forEach((item) => {
        const strId = String(item.id);
        const strName = item.name ? String(item.name) : "";
        const strNick = item.nickname ? String(item.nickname) : "";

        const isVoted =
          votedIdsOrNames.has(strId) ||
          (strName && votedIdsOrNames.has(strName)) ||
          (strNick && votedIdsOrNames.has(strNick));

        if (!isVoted) {
          item.votes = (Number(item.votes) || 0) + 1;
        }
      });

      // Recalculate percent using 70% votes + 30% What-If formula
      current = computePollPercentages(current);

      // Sort by percent descending
      current.sort((a, b) => parseFloat(b.percent) - parseFloat(a.percent));
      current = current.map((item, idx) => ({ ...item, pollRank: idx + 1 }));

      await saveKVData("fpt_trial_poll", current, writeLocalPoll);
      return NextResponse.json({
        success: true,
        data: current,
        message: "บันทึกผลการโหวตของคุณเรียบร้อยแล้ว!",
      });
    }

    // Single Vote for a contestant (backward compatibility)
    if (body.action === "vote") {
      const candidateId = body.id ? String(body.id) : null;
      const candidateName = body.name ? String(body.name).trim() : null;
      const candidateRank = body.pollRank ? Number(body.pollRank) : null;

      let targetIndex = -1;
      if (candidateId) {
        targetIndex = current.findIndex((item) => String(item.id) === candidateId);
      }
      if (targetIndex === -1 && candidateRank) {
        targetIndex = current.findIndex((item) => Number(item.pollRank) === candidateRank);
      }
      if (targetIndex === -1 && candidateName) {
        targetIndex = current.findIndex(
          (item) => item.name === candidateName || item.nickname === candidateName
        );
      }

      if (targetIndex === -1) {
        return NextResponse.json({ success: false, error: "ไม่พบผู้เข้าแข่งขันที่ต้องการโหวต" }, { status: 404 });
      }

      // Increment vote
      const currentVotes = Number(current[targetIndex].votes) || 0;
      current[targetIndex].votes = currentVotes + 1;

      // Recalculate percent using 70% votes + 30% What-If formula
      current = computePollPercentages(current);

      if (body.autoSort) {
        current.sort((a, b) => parseFloat(b.percent) - parseFloat(a.percent));
        current = current.map((item, idx) => ({ ...item, pollRank: idx + 1 }));
      }

      await saveKVData("fpt_trial_poll", current, writeLocalPoll);
      return NextResponse.json({
        success: true,
        data: current,
        votedCandidate: current[targetIndex],
        message: `โหวตให้ ${current[targetIndex].nickname || current[targetIndex].name} สำเร็จ!`,
      });
    }

    // Delete single item
    if (body.action === "delete" && body.pollRank) {
      current = current.filter((item) => Number(item.pollRank) !== Number(body.pollRank));
      current = current.map((item, i) => ({ ...item, pollRank: i + 1 }));
      await saveKVData("fpt_trial_poll", current, writeLocalPoll);
      return NextResponse.json({ success: true, data: current });
    }

    // Add new item
    if (body.action === "add") {
      const newRank = current.length + 1;
      const newItem = {
        pollRank: newRank,
        id: String(Date.now()),
        name: String(body.name || "ผู้เข้าแข่งขันใหม่").trim(),
        nickname: String(body.nickname || "").trim(),
        topic: String(body.topic || "-").trim(),
        percent: String(body.percent || "0.00%").trim(),
        votes: Number(body.votes) || 0,
        whatIfScore: 0,
        championVotes: 0,
        rankVotes: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
        image: body.image || "",
      };
      current.push(newItem);
      await saveKVData("fpt_trial_poll", current, writeLocalPoll);
      return NextResponse.json({ success: true, data: current });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Error in trial-poll API:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
