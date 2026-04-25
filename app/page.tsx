"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  BookOpen,
  Brain,
  CalendarDays,
  Clock,
  Flame,
  Home,
  Pause,
  Play,
  Plus,
  Rocket,
  RotateCcw,
  Sparkles,
  Target,
  Timer,
  Trash2,
  Trophy,
} from "lucide-react";

const CATEGORIES = [
  "IAM/Organizations",
  "KMS/Secrets",
  "Network",
  "Security/Logging",
  "S3/CloudFront",
  "CI/CD",
  "DR/HA",
  "Cost",
  "Database",
];

const MISTAKE_REASONS = ["知識不足", "読み違い", "サービス比較ミス", "時間切れ", "設計判断ミス"];
const inputClass = "border-white/10 bg-white/10 text-white placeholder:text-slate-400";

type StudyLog = {
  id: string;
  date: string;
  category: string;
  material: string;
  minutes: number;
  understanding: number;
  memo: string;
};

type QuestionLog = {
  id: string;
  date: string;
  category: string;
  title: string;
  isCorrect: boolean;
  mistakeReason: string;
  reviewDate: string;
  memo: string;
};

const initialLogs: StudyLog[] = [
  {
    id: "sample-log-1",
    date: new Date().toISOString().slice(0, 10),
    category: "KMS/Secrets",
    material: "AWS SAP 問題集",
    minutes: 70,
    understanding: 65,
    memo: "S3アクセス権とKMS復号権の違いを復習",
  },
  {
    id: "sample-log-2",
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    category: "Network",
    material: "Black Belt",
    minutes: 90,
    understanding: 55,
    memo: "TGW / DX / VPN の使い分け",
  },
];

const initialQuestions: QuestionLog[] = [
  {
    id: "sample-question-1",
    date: new Date().toISOString().slice(0, 10),
    category: "Network",
    title: "TGWとVPCピアリングの使い分け",
    isCorrect: false,
    mistakeReason: "サービス比較ミス",
    reviewDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    memo: "大規模・ハブスポークならTGW。少数接続ならピアリング。",
  },
];

function loadState<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveState(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function addDays(dateString: string, days: number) {
  const d = new Date(dateString);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string) {
  const start = new Date(from);
  const end = new Date(to);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - start.getTime()) / 86400000);
}

function calcStreak(logs: StudyLog[]) {
  const dates = new Set(logs.map((l) => l.date));
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (!dates.has(key)) break;
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function generateCalendarDays() {
  const today = new Date();
  const days = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function formatSeconds(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function Page() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-[#020617]" />;
  }

  return <StudyApp />;
}

function StudyApp() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [logs, setLogs] = useState<StudyLog[]>(() => loadState("study_logs", initialLogs));
  const [questions, setQuestions] = useState<QuestionLog[]>(() => loadState("study_questions", initialQuestions));
  const [targetDate, setTargetDate] = useState<string>(() => loadState("target_exam_date", addDays(new Date().toISOString().slice(0, 10), 30)));
  const [targetHours, setTargetHours] = useState<number>(() => loadState("target_hours", 80));
  const [dailyTargetMinutes, setDailyTargetMinutes] = useState<number>(() => loadState("daily_target_minutes", 120));

  const [timerSeconds, setTimerSeconds] = useState<number>(() => loadState("timer_seconds", 0));
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [logForm, setLogForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: "IAM/Organizations",
    material: "",
    minutes: 60,
    understanding: 70,
    memo: "",
  });

  const [questionForm, setQuestionForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: "IAM/Organizations",
    title: "",
    isCorrect: false,
    mistakeReason: "知識不足",
    memo: "",
  });

  useEffect(() => saveState("study_logs", logs), [logs]);
  useEffect(() => saveState("study_questions", questions), [questions]);
  useEffect(() => saveState("target_exam_date", targetDate), [targetDate]);
  useEffect(() => saveState("target_hours", targetHours), [targetHours]);
  useEffect(() => saveState("timer_seconds", timerSeconds), [timerSeconds]);
  useEffect(() => saveState("daily_target_minutes", dailyTargetMinutes), [dailyTargetMinutes]);

  useEffect(() => {
    if (!isTimerRunning) return;
    const id = window.setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [isTimerRunning]);

  const today = new Date().toISOString().slice(0, 10);

  const totalMinutes = useMemo(() => logs.reduce((sum, log) => sum + Number(log.minutes || 0), 0), [logs]);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const remainingHours = Math.max(0, Math.round((targetHours - totalHours) * 10) / 10);
  const remainingDays = Math.max(0, daysBetween(today, targetDate));
  const requiredMinutesPerDay = remainingDays > 0 ? Math.ceil((remainingHours * 60) / remainingDays) : 0;
  const streak = useMemo(() => calcStreak(logs), [logs]);

  const todayMinutes = useMemo(
    () => logs.filter((l) => l.date === today).reduce((sum, log) => sum + Number(log.minutes || 0), 0),
    [logs, today]
  );

  const todayProgress = Math.min(100, Math.round((todayMinutes / Math.max(1, dailyTargetMinutes)) * 100));

  const correctRate = useMemo(() => {
    if (!questions.length) return 0;
    const correct = questions.filter((q) => q.isCorrect).length;
    return Math.round((correct / questions.length) * 100);
  }, [questions]);

  const categoryStats = useMemo(() => {
    return CATEGORIES.map((category) => {
      const categoryLogs = logs.filter((l) => l.category === category);
      const minutes = categoryLogs.reduce((sum, log) => sum + Number(log.minutes || 0), 0);
      const avgUnderstanding = categoryLogs.length
        ? Math.round(categoryLogs.reduce((sum, log) => sum + Number(log.understanding || 0), 0) / categoryLogs.length)
        : 0;
      const categoryQuestions = questions.filter((q) => q.category === category);
      const wrong = categoryQuestions.filter((q) => !q.isCorrect).length;
      const score = Math.max(0, Math.min(100, avgUnderstanding - wrong * 8));
      return { category, minutes, understanding: avgUnderstanding, wrong, score };
    });
  }, [logs, questions]);

  const weakCategories = useMemo(() => {
    return [...categoryStats]
      .filter((s) => s.minutes > 0 || s.wrong > 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
  }, [categoryStats]);

  const dailyData = useMemo(() => {
    const map = new Map<string, number>();
    logs.forEach((log) => {
      map.set(log.date, (map.get(log.date) || 0) + Number(log.minutes || 0));
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, minutes]) => ({ date: date.slice(5), minutes }));
  }, [logs]);

  const reviewQuestions = useMemo(() => {
    return questions.filter((q) => !q.isCorrect && q.reviewDate <= today).sort((a, b) => a.reviewDate.localeCompare(b.reviewDate));
  }, [questions, today]);

  const calendarDays = useMemo(() => generateCalendarDays(), []);
  const studyDateSet = useMemo(() => new Set(logs.map((l) => l.date)), [logs]);
  const reviewDateSet = useMemo(() => new Set(questions.filter((q) => !q.isCorrect).map((q) => q.reviewDate)), [questions]);

  const recommendation = useMemo(() => {
    if (!weakCategories.length) return "まずは1件、学習記録か問題演習ログを登録しましょう。";
    const top = weakCategories[0];
    return `次は「${top.category}」を優先。理解度${top.understanding || 0}%、誤答${top.wrong}件です。長文問題を3問解いて、間違い理由を記録しましょう。`;
  }, [weakCategories]);

  const localAdvice = useMemo(() => {
    const top = weakCategories[0];
    const wrongReason = questions.filter((q) => !q.isCorrect).reduce<Record<string, number>>((acc, q) => {
      acc[q.mistakeReason] = (acc[q.mistakeReason] || 0) + 1;
      return acc;
    }, {});
    const worstReason = Object.entries(wrongReason).sort((a, b) => b[1] - a[1])[0]?.[0] || "データ不足";

    return [
      `結論：今日は「${top?.category || "未登録"}」を優先しましょう。`,
      `1. まず復習対象 ${reviewQuestions.length} 件を処理する`,
      `2. ${top?.category || "弱点分野"} の長文問題を3問解く`,
      `3. 間違えたら「${worstReason}」に分類してログへ残す`,
      `注意：残り${remainingDays}日なので、1日${requiredMinutesPerDay}分ペースを崩さないこと。`,
    ].join("\n");
  }, [weakCategories, questions, reviewQuestions.length, remainingDays, requiredMinutesPerDay]);

  const localQuestion = useMemo(() => {
    const category = weakCategories[0]?.category || "Network";
    return `【${category}：復習問題】\n\nある企業は、複数アカウント・複数VPC環境でAWSを利用しています。運用チームは、接続構成をシンプルにしつつ、将来的なVPC追加にも耐えられる構成にしたいと考えています。さらに、オンプレミス環境との安定した接続も必要です。\n\n最も適切な選択肢はどれですか？\n\nA. すべてのVPCをVPCピアリングでフルメッシュ接続する\nB. Transit GatewayでVPC接続を集約し、オンプレミスとはDirect Connectを利用する\nC. すべての通信をNAT Gateway経由にする\nD. 各VPCに個別のInternet Gatewayを追加する\n\n正解：B\n\n解説：大規模なVPC間接続はTransit Gatewayでハブアンドスポーク化するのが適切です。オンプレミス接続の帯域・安定性要件にはDirect Connectが向いています。Aは管理が複雑、C/Dは要件を満たしません。`;
  }, [weakCategories]);

  const addLog = () => {
    if (!logForm.material.trim()) return alert("教材名を入力してください");
    setLogs([{ id: crypto.randomUUID(), ...logForm, minutes: Number(logForm.minutes), understanding: Number(logForm.understanding) }, ...logs]);
    setLogForm({ ...logForm, material: "", memo: "" });
  };

  const applyTimerToLog = () => {
    const minutes = Math.max(1, Math.round(timerSeconds / 60));
    setLogForm({ ...logForm, minutes });
  };

  const addTimerLog = () => {
    const minutes = Math.max(1, Math.round(timerSeconds / 60));
    if (!logForm.material.trim()) return alert("教材名を入力してください");
    setLogs([{ id: crypto.randomUUID(), ...logForm, minutes, understanding: Number(logForm.understanding), memo: `${logForm.memo}${logForm.memo ? "\n" : ""}タイマー記録：${formatSeconds(timerSeconds)}` }, ...logs]);
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setLogForm({ ...logForm, material: "", memo: "", minutes: 60 });
  };

  const addQuestion = () => {
    if (!questionForm.title.trim()) return alert("問題タイトルを入力してください");
    const reviewDate = questionForm.isCorrect ? addDays(questionForm.date, 7) : addDays(questionForm.date, 1);
    setQuestions([{ id: crypto.randomUUID(), ...questionForm, reviewDate }, ...questions]);
    setQuestionForm({ ...questionForm, title: "", memo: "", isCorrect: false });
  };

  const removeLog = (id: string) => setLogs(logs.filter((l) => l.id !== id));
  const removeQuestion = (id: string) => setQuestions(questions.filter((q) => q.id !== id));

  const markReviewed = (id: string) => {
    setQuestions(questions.map((q) => q.id === id ? { ...q, reviewDate: addDays(today, 3), memo: `${q.memo}\n復習済み：${today}`.trim() } : q));
  };

  const tabTitle: Record<string, string> = {
    dashboard: "分析ダッシュボード",
    plan: "学習計画",
    log: "タイマー記録",
    question: "問題演習",
    review: "復習管理",
  };

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,#312e81_0,#0f172a_38%,#020617_100%)] text-slate-100">
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-black/25 p-5 backdrop-blur-xl lg:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 p-3 shadow-lg shadow-violet-500/30">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight">StudyPlus<span className="text-violet-400">+</span></p>
            <p className="text-xs text-slate-400">AWS SAP Dashboard</p>
          </div>
        </div>

        <nav className="space-y-2">
          <SideNavItem active={activeTab === "dashboard"} icon="📊" label="分析" onClick={() => setActiveTab("dashboard")} />
          <SideNavItem active={activeTab === "plan"} icon="🗓" label="計画" onClick={() => setActiveTab("plan")} />
          <SideNavItem active={activeTab === "log"} icon="⏱" label="記録" onClick={() => setActiveTab("log")} />
          <SideNavItem active={activeTab === "question"} icon="🧠" label="問題" onClick={() => setActiveTab("question")} />
          <SideNavItem active={activeTab === "review"} icon="🔁" label="復習" onClick={() => setActiveTab("review")} />
        </nav>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-slate-400">今日の進捗</p>
          <p className="mt-1 text-2xl font-black">{todayMinutes}分 / {dailyTargetMinutes}分</p>
          <div className="mt-3 h-3 rounded-full bg-white/10">
            <div className="h-3 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${todayProgress}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-400">{todayProgress}% 達成</p>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden px-6 py-6">
        <header className="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-sm text-slate-400">StudyPlus+ MVP</p>
            <h1 className="text-3xl font-black tracking-tight">{tabTitle[activeTab]}</h1>
          </div>
          <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 md:block">
            {streak > 0 ? `${streak}日連続学習中 🔥` : "今日から再スタート"}
          </div>
        </header>

        <section className="mb-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-sm text-violet-200">
              <Flame className="h-4 w-4" /> Portfolio App
            </div>
            <h2 className="max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-5xl">
              合格まで
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent"> 導く </span>
              学習アプリ
            </h2>
            <p className="mt-4 max-w-2xl text-slate-300">
              タイマーで学習時間を記録し、理解度・誤答理由・復習予定から、次にやるべき学習を提示します。
            </p>
          </div>

          <GlassCard className="border-violet-400/40 bg-violet-500/10">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 h-5 w-5 text-cyan-300" />
              <div>
                <p className="font-bold">今日のおすすめ</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{recommendation}</p>
              </div>
            </div>
          </GlassCard>
        </section>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <MetricCard Icon={Clock} label="今日の学習" value={`${todayMinutes}分`} accent="from-violet-500 to-indigo-500" />
          <MetricCard Icon={BookOpen} label="累計学習" value={`${totalHours}時間`} accent="from-cyan-500 to-blue-500" />
          <MetricCard Icon={Target} label="問題正答率" value={`${correctRate}%`} accent="from-fuchsia-500 to-pink-500" />
          <MetricCard Icon={Trophy} label="連続学習" value={`${streak}日`} accent="from-amber-500 to-orange-500" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsContent value="dashboard" className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <ChartCard title="日別学習時間">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dailyData}>
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.15)", borderRadius: "12px", color: "#fff" }} />
                    <Line type="monotone" dataKey="minutes" stroke="#a78bfa" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="弱点レーダー">
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={categoryStats.filter((s) => s.minutes > 0 || s.wrong > 0)}>
                    <PolarGrid stroke="rgba(148,163,184,.35)" />
                    <PolarAngleAxis dataKey="category" stroke="#cbd5e1" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" />
                    <Radar dataKey="score" stroke="#22d3ee" fill="#8b5cf6" fillOpacity={0.35} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.15)", borderRadius: "12px", color: "#fff" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <ChartCard title="分野別の学習時間">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={categoryStats.filter((s) => s.minutes > 0)}>
                  <XAxis dataKey="category" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.15)", borderRadius: "12px", color: "#fff" }} />
                  <Bar dataKey="minutes" fill="#6366f1" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </TabsContent>

          <TabsContent value="plan" className="grid gap-5 lg:grid-cols-[420px_1fr]">
            <GlassCard>
              <div className="space-y-3">
                <h2 className="flex items-center gap-2 text-xl font-bold"><CalendarDays className="h-5 w-5" />試験日から逆算</h2>
                <label className="text-sm text-slate-400">試験日</label>
                <Input className={inputClass} type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
                <label className="text-sm text-slate-400">目標学習時間</label>
                <Input className={inputClass} type="number" value={targetHours} onChange={(e) => setTargetHours(Number(e.target.value))} />
                <label className="text-sm text-slate-400">1日の目標学習時間（分）</label>
                <Input className={inputClass} type="number" value={dailyTargetMinutes} onChange={(e) => setDailyTargetMinutes(Number(e.target.value))} />
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-300">
                  <p>残り日数：<span className="font-bold text-white">{remainingDays}日</span></p>
                  <p>残り学習：<span className="font-bold text-white">{remainingHours}時間</span></p>
                  <p>必要ペース：<span className="font-bold text-cyan-300">1日 {requiredMinutesPerDay}分</span></p>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <h2 className="mb-4 text-xl font-bold">学習カレンダー（直近28日）</h2>
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day) => {
                  const studied = studyDateSet.has(day);
                  const review = reviewDateSet.has(day);
                  return (
                    <div key={day} className={`rounded-2xl border p-3 text-center text-xs ${studied ? "border-emerald-400/40 bg-emerald-400/20 text-emerald-100" : review ? "border-amber-400/40 bg-amber-400/20 text-amber-100" : "border-white/10 bg-white/5 text-slate-400"}`}>
                      <p>{day.slice(5)}</p>
                      <p className="mt-1 text-lg">{studied ? "🔥" : review ? "🔁" : "・"}</p>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-sm text-slate-400">🔥 学習日 / 🔁 復習予定日</p>
            </GlassCard>

            <GlassCard className="lg:col-span-2">
              <h2 className="mb-3 flex items-center gap-2 text-xl font-bold"><Sparkles className="h-5 w-5 text-cyan-300" />ローカル弱点アドバイス</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">{localAdvice}</p>
            </GlassCard>

            <GlassCard className="lg:col-span-2">
              <h2 className="mb-3 flex items-center gap-2 text-xl font-bold"><Brain className="h-5 w-5 text-fuchsia-300" />ローカル問題生成</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">{localQuestion}</p>
            </GlassCard>
          </TabsContent>

          <TabsContent value="log" className="grid gap-5 lg:grid-cols-[420px_1fr]">
            <GlassCard>
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-xl font-bold"><Timer className="h-5 w-5" />学習タイマー</h2>
                <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-center">
                  <p className="font-mono text-5xl font-black tracking-widest text-cyan-200">{formatSeconds(timerSeconds)}</p>
                  <p className="mt-2 text-sm text-slate-400">タイマーで測った時間をそのまま学習記録にできます</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Button className="rounded-2xl bg-emerald-500 hover:bg-emerald-600" onClick={() => setIsTimerRunning(true)} disabled={isTimerRunning}><Play className="mr-2 h-4 w-4" />開始</Button>
                  <Button className="rounded-2xl bg-amber-500 hover:bg-amber-600" onClick={() => setIsTimerRunning(false)} disabled={!isTimerRunning}><Pause className="mr-2 h-4 w-4" />停止</Button>
                  <Button className="rounded-2xl bg-white/10 hover:bg-white/20" onClick={() => { setIsTimerRunning(false); setTimerSeconds(0); }}><RotateCcw className="mr-2 h-4 w-4" />リセット</Button>
                </div>
                <Button className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-500" onClick={applyTimerToLog}>タイマー時間を下の記録に反映</Button>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="space-y-3">
                <h2 className="text-xl font-bold">学習記録を追加</h2>
                <Input className={inputClass} type="date" value={logForm.date} onChange={(e) => setLogForm({ ...logForm, date: e.target.value })} />
                <CategorySelect value={logForm.category} onChange={(v) => setLogForm({ ...logForm, category: v })} />
                <Input className={inputClass} placeholder="教材名 例：Udemy / 問題集 / Black Belt" value={logForm.material} onChange={(e) => setLogForm({ ...logForm, material: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">学習時間（分）</label>
                    <Input className={inputClass} type="number" min="1" placeholder="例：60" value={logForm.minutes} onChange={(e) => setLogForm({ ...logForm, minutes: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">理解度（%）</label>
                    <Input className={inputClass} type="number" min="0" max="100" placeholder="例：70" value={logForm.understanding} onChange={(e) => setLogForm({ ...logForm, understanding: Number(e.target.value) })} />
                  </div>
                </div>
                <Textarea className={inputClass} placeholder="メモ" value={logForm.memo} onChange={(e) => setLogForm({ ...logForm, memo: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Button className="rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-500" onClick={addLog}><Plus className="mr-2 h-4 w-4" />手入力で追加</Button>
                  <Button className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400" onClick={addTimerLog}><Timer className="mr-2 h-4 w-4" />タイマーで追加</Button>
                </div>
              </div>
            </GlassCard>

            <div className="lg:col-span-2">
              <ListCard title="学習ログ" items={logs} type="log" onDelete={removeLog} />
            </div>
          </TabsContent>

          <TabsContent value="question" className="grid gap-5 lg:grid-cols-[420px_1fr]">
            <GlassCard>
              <div className="space-y-3">
                <h2 className="text-xl font-bold">問題演習ログを追加</h2>
                <Input className={inputClass} type="date" value={questionForm.date} onChange={(e) => setQuestionForm({ ...questionForm, date: e.target.value })} />
                <CategorySelect value={questionForm.category} onChange={(v) => setQuestionForm({ ...questionForm, category: v })} />
                <Input className={inputClass} placeholder="問題タイトル / 論点" value={questionForm.title} onChange={(e) => setQuestionForm({ ...questionForm, title: e.target.value })} />
                <Select value={questionForm.isCorrect ? "true" : "false"} onValueChange={(v) => setQuestionForm({ ...questionForm, isCorrect: v === "true" })}>
                  <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="true">正解</SelectItem><SelectItem value="false">不正解</SelectItem></SelectContent>
                </Select>
                <Select value={questionForm.mistakeReason} onValueChange={(v) => setQuestionForm({ ...questionForm, mistakeReason: v })}>
                  <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                  <SelectContent>{MISTAKE_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
                <Textarea className={inputClass} placeholder="解説メモ / なぜ間違えたか" value={questionForm.memo} onChange={(e) => setQuestionForm({ ...questionForm, memo: e.target.value })} />
                <Button className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-500" onClick={addQuestion}><Brain className="mr-2 h-4 w-4" />追加</Button>
              </div>
            </GlassCard>
            <ListCard title="問題演習ログ" items={questions} type="question" onDelete={removeQuestion} />
          </TabsContent>

          <TabsContent value="review">
            <GlassCard>
              <h2 className="text-xl font-bold">今日復習する問題</h2>
              <div className="mt-4 space-y-3">
                {reviewQuestions.length === 0 && <p className="text-slate-400">今日の復習対象はありません。</p>}
                {reviewQuestions.map((q) => (
                  <div key={q.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{q.title}</p>
                        <p className="text-sm text-slate-400">{q.category} / {q.mistakeReason} / 復習日: {q.reviewDate}</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{q.memo}</p>
                      </div>
                      <Button variant="outline" className="rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => markReviewed(q.id)}>復習済み</Button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function SideNavItem({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${active ? "bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/20" : "text-slate-300 hover:bg-white/10"}`}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={`rounded-3xl border border-white/10 bg-white/[0.06] text-slate-100 shadow-2xl shadow-black/20 backdrop-blur-xl ${className}`}>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <GlassCard>
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      {children}
    </GlassCard>
  );
}

function MetricCard({ Icon, label, value, accent }: { Icon: React.ElementType; label: string; value: string; accent: string }) {
  return (
    <GlassCard>
      <div className="flex items-center gap-4">
        <div className={`rounded-2xl bg-gradient-to-br ${accent} p-3 shadow-lg`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-3xl font-black">{value}</p>
        </div>
      </div>
    </GlassCard>
  );
}

function CategorySelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
      <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function ListCard({ title, items, type, onDelete }: { title: string; items: Array<StudyLog | QuestionLog>; type: "log" | "question"; onDelete: (id: string) => void }) {
  return (
    <GlassCard>
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.length === 0 && <p className="text-slate-400">まだ記録がありません。</p>}
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{type === "log" ? (item as StudyLog).material : (item as QuestionLog).title}</p>
                <p className="text-sm text-slate-400">
                  {item.date} / {item.category}
                  {type === "log" ? ` / ${(item as StudyLog).minutes}分 / 理解度${(item as StudyLog).understanding}%` : ` / ${(item as QuestionLog).isCorrect ? "正解" : "不正解"} / ${(item as QuestionLog).mistakeReason}`}
                </p>
                {type === "question" && <p className="text-sm text-slate-400">復習日: {(item as QuestionLog).reviewDate}</p>}
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{item.memo}</p>
              </div>
              <Button variant="ghost" size="icon" className="text-slate-300 hover:bg-white/10 hover:text-white" onClick={() => onDelete(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
