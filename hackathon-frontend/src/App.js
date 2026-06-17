import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { fireAuth } from "./firebase";
import LoginButton from "./LoginButton";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://rantao-hackathon-backend-1000732984276.us-central1.run.app";

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Yu Gothic", Arial, sans-serif',
    color: "#1f2937",
    padding: "40px 20px",
  },
  container: {
    maxWidth: "920px",
    margin: "0 auto",
  },
  header: {
    backgroundColor: "white",
    borderRadius: "22px",
    padding: "30px",
    marginBottom: "24px",
    boxShadow: "0 12px 35px rgba(79, 70, 229, 0.10)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    border: "1px solid #eef2ff",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    letterSpacing: "-0.04em",
    color: "#312e81",
  },
  subtitle: {
    margin: "10px 0 0",
    color: "#6b7280",
    fontSize: "15px",
    lineHeight: "1.7",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "20px",
    padding: "26px",
    marginBottom: "24px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.06)",
    border: "1px solid #e5e7eb",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: "18px",
    fontSize: "24px",
    color: "#111827",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 15px",
    marginBottom: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    fontSize: "15px",
    outline: "none",
    backgroundColor: "white",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    height: "130px",
    padding: "13px 15px",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    fontSize: "15px",
    resize: "vertical",
    outline: "none",
    backgroundColor: "white",
  },
  buttonRow: {
    display: "flex",
    gap: "10px",
    marginTop: "14px",
    flexWrap: "wrap",
  },
  aiButton: {
    padding: "11px 17px",
    border: "1px solid #c7d2fe",
    borderRadius: "12px",
    backgroundColor: "#eef2ff",
    color: "#4338ca",
    fontWeight: "700",
    cursor: "pointer",
  },
  submitButton: {
    padding: "11px 17px",
    border: "none",
    borderRadius: "12px",
    backgroundColor: "#4f46e5",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
  },
  disabledButton: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
  message: {
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "13px 16px",
    marginBottom: "24px",
    color: "#374151",
    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.04)",
  },
  aiResultBase: {
    borderRadius: "16px",
    padding: "16px",
    marginTop: "18px",
    width: "100%",
    boxSizing: "border-box",
  },
  questionCard: {
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "18px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.05)",
  },
  questionTitle: {
    marginTop: 0,
    marginBottom: "8px",
    fontSize: "20px",
    color: "#111827",
  },
  questionBody: {
    color: "#374151",
    lineHeight: "1.7",
    whiteSpace: "pre-wrap",
  },
  answerBox: {
    backgroundColor: "#f9fafb",
    padding: "12px 14px",
    marginBottom: "8px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },
  badge: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "700",
    marginBottom: "10px",
  },
};

function App() {
  const [user, setUser] = useState(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [questions, setQuestions] = useState([]);

  const [answerTexts, setAnswerTexts] = useState({});

  const [aiResult, setAiResult] = useState(null);
  const [isCheckingAI, setIsCheckingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fireAuth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`${API_URL}/questions`);

      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }

      const data = await response.json();

      const questionsWithAnswers = await Promise.all(
        data.map(async (question) => {
          const answerResponse = await fetch(
            `${API_URL}/questions/${question.id}/answers`
          );

          if (!answerResponse.ok) {
            throw new Error("Failed to fetch answers");
          }

          const answers = await answerResponse.json();

          return {
            ...question,
            answers: answers,
          };
        })
      );

      setQuestions(questionsWithAnswers);
    } catch (error) {
      console.error(error);
      setMessage("質問の読み込み中にエラーが発生しました。");
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const runAIQuestionCheck = async () => {
    if (!user) {
      setMessage("AIチェックを使うにはログインしてください。");
      return null;
    }

    if (!title.trim() || !body.trim()) {
      setMessage("タイトルと質問内容を入力してください。");
      return null;
    }

    const token = await user.getIdToken();

    const response = await fetch(`${API_URL}/ai/check-question`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: title,
        body: body,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to check question with AI");
    }

    const data = await response.json();
    setAiResult(data);

    return data;
  };

  const checkQuestionWithAI = async () => {
    try {
      setIsCheckingAI(true);
      setMessage("AIが質問内容を確認しています...");

      const data = await runAIQuestionCheck();

      if (!data) {
        return;
      }

      if (data.is_appropriate === false) {
        setMessage("AIがこの質問を要確認として判定しました。投稿前に内容を確認してください。");
      } else {
        setMessage("AIチェックが完了しました。この質問は投稿できそうです。");
      }
    } catch (error) {
      console.error(error);
      setMessage("AIチェック中にエラーが発生しました。");
    } finally {
      setIsCheckingAI(false);
    }
  };

  const submitQuestion = async (e) => {
    e.preventDefault();

    if (!user) {
      setMessage("質問を投稿するにはログインしてください。");
      return;
    }

    if (!title.trim() || !body.trim()) {
      setMessage("タイトルと質問内容を入力してください。");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("投稿前にAIが質問内容を確認しています...");

      const aiData = await runAIQuestionCheck();

      if (!aiData) {
        return;
      }

      if (aiData.is_appropriate === false) {
        setMessage("AIがこの質問を要確認として判定したため、投稿されませんでした。");
        return;
      }

      const token = await user.getIdToken();

      const response = await fetch(`${API_URL}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title,
          body: body,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit question");
      }

      setTitle("");
      setBody("");
      setAiResult(null);
      setMessage("質問を投稿しました！");
      fetchQuestions();
    } catch (error) {
      console.error(error);
      setMessage("質問の投稿中にエラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitAnswer = async (questionId) => {
    if (!user) {
      setMessage("回答を投稿するにはログインしてください。");
      return;
    }

    const answerBody = answerTexts[questionId];

    if (!answerBody || answerBody.trim() === "") {
      setMessage("回答内容を入力してください。");
      return;
    }

    try {
      const token = await user.getIdToken();

      const response = await fetch(`${API_URL}/questions/${questionId}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          body: answerBody,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit answer");
      }

      setAnswerTexts({
        ...answerTexts,
        [questionId]: "",
      });

      setMessage("回答を投稿しました！");
      fetchQuestions();
    } catch (error) {
      console.error(error);
      setMessage("回答の投稿中にエラーが発生しました。");
    }
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setAiResult(null);
  };

  const handleBodyChange = (e) => {
    setBody(e.target.value);
    setAiResult(null);
  };

  const getCategoryLabel = (category) => {
    const labels = {
      class: "授業",
      research: "研究",
      life: "学生生活",
      admin: "事務・手続き",
      career: "進路・キャリア",
      other: "その他",
    };

    return labels[category] || category || "未分類";
  };

  const isActionDisabled = !user || isCheckingAI || isSubmitting;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>東大知恵袋 — 先輩に聞こう！</h1>
            <p style={styles.subtitle}>
              授業、研究、学生生活、進路のことなど、ちょっと聞きにくいことも気軽に質問できる場所です。
              投稿前にAIが内容を確認します。
            </p>
          </div>

          <LoginButton user={user} />
        </header>

        <form onSubmit={submitQuestion} style={styles.card}>
          <h2 style={styles.sectionTitle}>質問する</h2>

          {!user && (
            <p style={{ color: "#dc2626", fontWeight: "600" }}>
              質問や回答を投稿するにはログインしてください。
            </p>
          )}

          <input
            value={title}
            onChange={handleTitleChange}
            placeholder="質問のタイトル"
            disabled={!user}
            style={styles.input}
          />

          <textarea
            value={body}
            onChange={handleBodyChange}
            placeholder="質問の内容を詳しく書いてください"
            disabled={!user}
            style={styles.textarea}
          />

          <div style={styles.buttonRow}>
            <button
              type="button"
              onClick={checkQuestionWithAI}
              disabled={isActionDisabled}
              style={{
                ...styles.aiButton,
                ...(isActionDisabled ? styles.disabledButton : {}),
              }}
            >
              {isCheckingAI ? "AI確認中..." : "AIで確認する"}
            </button>

            <button
              type="submit"
              disabled={isActionDisabled}
              style={{
                ...styles.submitButton,
                ...(isActionDisabled ? styles.disabledButton : {}),
              }}
            >
              {isSubmitting ? "投稿中..." : "質問を投稿する"}
            </button>
          </div>

          {aiResult && (
            <div
              style={{
                ...styles.aiResultBase,
                border: aiResult.is_appropriate
                  ? "1px solid #86efac"
                  : "1px solid #fca5a5",
                backgroundColor: aiResult.is_appropriate ? "#f0fdf4" : "#fef2f2",
              }}
            >
              <span
                style={{
                  ...styles.badge,
                  backgroundColor: aiResult.is_appropriate ? "#dcfce7" : "#fee2e2",
                  color: aiResult.is_appropriate ? "#166534" : "#991b1b",
                }}
              >
                {aiResult.is_appropriate ? "AI判定：投稿OK" : "AI判定：要確認"}
              </span>

              <p>
                <strong>判定理由：</strong>
                {aiResult.appropriateness_reason}
              </p>

              <p>
                <strong>分かりやすさ：</strong>
                {aiResult.is_clear ? "十分わかりやすい" : "少し分かりにくい可能性があります"}
              </p>

              <p>
                <strong>補足：</strong>
                {aiResult.clarity_reason}
              </p>

              <p>
                <strong>カテゴリー：</strong>
                {getCategoryLabel(aiResult.category)}
              </p>

              {aiResult.warning && (
                <p>
                  <strong>注意：</strong>
                  {aiResult.warning}
                </p>
              )}
            </div>
          )}
        </form>

        {message && <div style={styles.message}>{message}</div>}

        <h2 style={styles.sectionTitle}>最近の質問</h2>

        {questions.length === 0 ? (
          <div style={styles.card}>
            <p style={{ color: "#6b7280", margin: 0 }}>
              まだ質問がありません。最初の質問を投稿してみましょう！
            </p>
          </div>
        ) : (
          questions.map((q) => (
            <div key={q.id} style={styles.questionCard}>
              <h3 style={styles.questionTitle}>{q.title}</h3>
              <p style={styles.questionBody}>{q.body}</p>

              <h4 style={{ marginBottom: "10px" }}>回答</h4>

              {q.answers && q.answers.length > 0 ? (
                q.answers.map((answer) => (
                  <div key={answer.id} style={styles.answerBox}>
                    <p style={{ margin: 0, lineHeight: "1.6" }}>{answer.body}</p>
                  </div>
                ))
              ) : (
                <p style={{ color: "#9ca3af" }}>まだ回答はありません。</p>
              )}

              {user ? (
                <>
                  <textarea
                    value={answerTexts[q.id] || ""}
                    onChange={(e) =>
                      setAnswerTexts({
                        ...answerTexts,
                        [q.id]: e.target.value,
                      })
                    }
                    placeholder="回答を書く..."
                    style={{
                      ...styles.textarea,
                      height: "90px",
                      marginTop: "10px",
                    }}
                  />

                  <button
                    onClick={() => submitAnswer(q.id)}
                    style={{
                      ...styles.submitButton,
                      marginTop: "10px",
                    }}
                  >
                    回答を投稿する
                  </button>
                </>
              ) : (
                <p style={{ color: "#9ca3af" }}>
                  回答するにはログインしてください。
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;