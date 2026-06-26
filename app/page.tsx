"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type Priority = "high" | "medium" | "low";
type Category = "work" | "private" | "other";

type Todo = {
  id: string;
  text: string;
  done: boolean;
  priority: Priority;
  category: Category;
  due: string | null; // YYYY-MM-DD
  createdAt: number;
};

const STORAGE_KEY = "todos";

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
];

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "work", label: "仕事" },
  { value: "private", label: "プライベート" },
  { value: "other", label: "その他" },
];

const priorityLabel = (p: Priority) =>
  PRIORITIES.find((x) => x.value === p)?.label ?? "";
const categoryLabel = (c: Category) =>
  CATEGORIES.find((x) => x.value === c)?.label ?? "";

// 締め切りの表示用フォーマット
function formatDue(due: string): { text: string; overdue: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(due + "T00:00:00");
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);

  let text: string;
  if (diff === 0) text = "今日";
  else if (diff === 1) text = "明日";
  else if (diff === -1) text = "昨日";
  else if (diff < 0) text = `${Math.abs(diff)}日超過`;
  else text = `${d.getMonth() + 1}/${d.getDate()}`;

  return { text, overdue: diff < 0 };
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState<Category>("work");
  const [due, setDue] = useState("");
  const [loaded, setLoaded] = useState(false);

  // フィルター
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");

  // 起動時にローカルストレージから読み込み
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<Todo>[];
        // 古いデータにも対応できるよう既定値を補完
        setTodos(
          parsed.map((t) => ({
            id: t.id ?? crypto.randomUUID(),
            text: t.text ?? "",
            done: t.done ?? false,
            priority: t.priority ?? "medium",
            category: t.category ?? "other",
            due: t.due ?? null,
            createdAt: t.createdAt ?? Date.now(),
          }))
        );
      } catch {
        // 壊れたデータは無視
      }
    }
    setLoaded(true);
  }, []);

  // 変更を保存（初回読み込み後のみ）
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }
  }, [todos, loaded]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      done: false,
      priority,
      category,
      due: due || null,
      createdAt: Date.now(),
    };
    setTodos((prev) => [newTodo, ...prev]);
    setInput("");
    setDue("");
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  // フィルター適用後のリスト
  const visibleTodos = useMemo(() => {
    return todos.filter(
      (t) =>
        (filterCategory === "all" || t.category === filterCategory) &&
        (filterPriority === "all" || t.priority === filterPriority)
    );
  }, [todos, filterCategory, filterPriority]);

  // 完了率（フィルター後の表示分を対象）
  const total = visibleTodos.length;
  const completed = visibleTodos.filter((t) => t.done).length;
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

  // ドーナツグラフ用
  const R = 34;
  const C = 2 * Math.PI * R;
  const dash = (rate / 100) * C;

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Todo</h1>
          <p className={styles.subtitle}>今日やることを書き出そう</p>
        </header>

        {/* 完了率グラフ */}
        <section className={styles.progressCard}>
          <svg className={styles.donut} viewBox="0 0 80 80" aria-hidden="true">
            <circle
              className={styles.donutTrack}
              cx="40"
              cy="40"
              r={R}
              fill="none"
            />
            <circle
              className={styles.donutValue}
              cx="40"
              cy="40"
              r={R}
              fill="none"
              strokeDasharray={`${dash} ${C}`}
              transform="rotate(-90 40 40)"
            />
            <text x="40" y="40" className={styles.donutText}>
              {rate}%
            </text>
          </svg>
          <div className={styles.progressInfo}>
            <p className={styles.progressLabel}>完了率</p>
            <p className={styles.progressCount}>
              {completed} / {total} 件
            </p>
          </div>
        </section>

        {/* 入力フォーム */}
        <form className={styles.form} onSubmit={addTodo}>
          <div className={styles.inputRow}>
            <input
              className={styles.input}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="新しいタスクを入力..."
              aria-label="新しいタスク"
            />
            <button
              className={styles.addButton}
              type="submit"
              disabled={!input.trim()}
              aria-label="タスクを追加"
            >
              +
            </button>
          </div>

          <div className={styles.optionRow}>
            <select
              className={styles.select}
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              aria-label="優先度"
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  優先度: {p.label}
                </option>
              ))}
            </select>

            <select
              className={styles.select}
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              aria-label="カテゴリ"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <input
              className={styles.select}
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              aria-label="締め切り日"
            />
          </div>
        </form>

        {/* フィルター */}
        <div className={styles.filterBar}>
          <select
            className={styles.filterSelect}
            value={filterCategory}
            onChange={(e) =>
              setFilterCategory(e.target.value as Category | "all")
            }
            aria-label="カテゴリで絞り込み"
          >
            <option value="all">すべてのカテゴリ</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={filterPriority}
            onChange={(e) =>
              setFilterPriority(e.target.value as Priority | "all")
            }
            aria-label="優先度で絞り込み"
          >
            <option value="all">すべての優先度</option>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                優先度: {p.label}
              </option>
            ))}
          </select>
        </div>

        {visibleTodos.length === 0 ? (
          <p className={styles.empty}>
            {todos.length === 0
              ? "タスクはまだありません"
              : "条件に合うタスクがありません"}
          </p>
        ) : (
          <ul className={styles.list}>
            {visibleTodos.map((todo) => {
              const dueInfo = todo.due ? formatDue(todo.due) : null;
              return (
                <li
                  key={todo.id}
                  className={`${styles.item} ${todo.done ? styles.itemDone : ""}`}
                >
                  <button
                    className={`${styles.checkbox} ${
                      todo.done ? styles.checkboxChecked : ""
                    }`}
                    onClick={() => toggleTodo(todo.id)}
                    aria-label={todo.done ? "未完了に戻す" : "完了にする"}
                  >
                    {todo.done && <span className={styles.checkmark}>✓</span>}
                  </button>

                  <div className={styles.body}>
                    <span
                      className={`${styles.text} ${
                        todo.done ? styles.textDone : ""
                      }`}
                    >
                      {todo.text}
                    </span>
                    <div className={styles.meta}>
                      <span
                        className={`${styles.tag} ${styles.priTag}`}
                        data-priority={todo.priority}
                      >
                        {priorityLabel(todo.priority)}
                      </span>
                      <span className={styles.tag}>
                        {categoryLabel(todo.category)}
                      </span>
                      {dueInfo && (
                        <span
                          className={`${styles.tag} ${styles.dueTag} ${
                            dueInfo.overdue && !todo.done ? styles.dueOverdue : ""
                          }`}
                        >
                          📅 {dueInfo.text}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    className={styles.deleteButton}
                    onClick={() => deleteTodo(todo.id)}
                    aria-label="タスクを削除"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
