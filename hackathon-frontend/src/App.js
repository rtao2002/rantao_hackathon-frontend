import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { fireAuth } from "./firebase";
import LoginButton from "./LoginButton";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://rantao-hackathon-backend-1000732984276.us-central1.run.app";

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
      setMessage("Error loading questions");
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const runAIQuestionCheck = async () => {
    if (!user) {
      setMessage("Please login before using AI check.");
      return null;
    }

    if (!title.trim() || !body.trim()) {
      setMessage("Please enter both a title and question details first.");
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
      setMessage("AI is checking your question...");

      const data = await runAIQuestionCheck();

      if (!data) {
        return;
      }

      if (data.is_appropriate === false) {
        setMessage("AI flagged this question. Please review before submitting.");
      } else {
        setMessage("AI check completed. This question looks okay.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Error checking question with AI.");
    } finally {
      setIsCheckingAI(false);
    }
  };

  const submitQuestion = async (e) => {
    e.preventDefault();

    if (!user) {
      setMessage("Please login before submitting a question.");
      return;
    }

    if (!title.trim() || !body.trim()) {
      setMessage("Please enter both a title and question details.");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("Checking question with AI before submitting...");

      const aiData = await runAIQuestionCheck();

      if (!aiData) {
        return;
      }

      if (aiData.is_appropriate === false) {
        setMessage("AI flagged this question, so it was not submitted.");
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
      setMessage("Question submitted!");
      fetchQuestions();
    } catch (error) {
      console.error(error);
      setMessage("Error submitting question");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitAnswer = async (questionId) => {
    if (!user) {
      setMessage("Please login before submitting an answer.");
      return;
    }

    const answerBody = answerTexts[questionId];

    if (!answerBody || answerBody.trim() === "") {
      setMessage("Please write an answer first");
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

      setMessage("Answer submitted!");
      fetchQuestions();
    } catch (error) {
      console.error(error);
      setMessage("Error submitting answer");
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

  return (
    <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Student Q&A</h1>

      <LoginButton user={user} />

      <hr />

      <form onSubmit={submitQuestion}>
        <h2>Ask a Question</h2>

        {!user && (
          <p style={{ color: "red" }}>
            Please login before submitting a question.
          </p>
        )}

        <div>
          <input
            value={title}
            onChange={handleTitleChange}
            placeholder="Question title"
            disabled={!user}
            style={{
              width: "500px",
              padding: "8px",
              marginBottom: "10px",
            }}
          />
        </div>

        <div>
          <textarea
            value={body}
            onChange={handleBodyChange}
            placeholder="Question details"
            disabled={!user}
            style={{
              width: "500px",
              height: "120px",
              padding: "8px",
            }}
          />
        </div>

        <button
          type="button"
          onClick={checkQuestionWithAI}
          disabled={!user || isCheckingAI || isSubmitting}
          style={{ marginTop: "10px", marginRight: "8px" }}
        >
          {isCheckingAI ? "Checking..." : "Check with AI"}
        </button>

        <button
          type="submit"
          disabled={!user || isSubmitting || isCheckingAI}
          style={{ marginTop: "10px" }}
        >
          {isSubmitting ? "Submitting..." : "Submit Question"}
        </button>

        {aiResult && (
          <div
            style={{
              border: aiResult.is_appropriate
                ? "1px solid #9bd19b"
                : "1px solid #e39b9b",
              borderRadius: "8px",
              padding: "12px",
              marginTop: "16px",
              width: "500px",
              backgroundColor: aiResult.is_appropriate ? "#f4fff4" : "#fff4f4",
            }}
          >
            <h3>AI Check Result</h3>

            <p>
              <strong>Status:</strong>{" "}
              {aiResult.is_appropriate ? "Looks okay" : "Flagged"}
            </p>

            <p>
              <strong>Appropriateness:</strong>{" "}
              {aiResult.appropriateness_reason}
            </p>

            <p>
              <strong>Clarity:</strong>{" "}
              {aiResult.is_clear ? "Clear enough" : "Could be clearer"}
            </p>

            <p>
              <strong>Clarity reason:</strong> {aiResult.clarity_reason}
            </p>

            <p>
              <strong>Category:</strong> {aiResult.category}
            </p>

            {aiResult.warning && (
              <p>
                <strong>Warning:</strong> {aiResult.warning}
              </p>
            )}
          </div>
        )}
      </form>

      <p>{message}</p>

      <hr />

      <h2>Questions</h2>

      {questions.map((q) => (
        <div
          key={q.id}
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "20px",
            width: "600px",
          }}
        >
          <h3>{q.title}</h3>
          <p>{q.body}</p>

          <h4>Answers</h4>

          {q.answers && q.answers.length > 0 ? (
            q.answers.map((answer) => (
              <div
                key={answer.id}
                style={{
                  backgroundColor: "#f5f5f5",
                  padding: "10px",
                  marginBottom: "8px",
                  borderRadius: "6px",
                }}
              >
                <p style={{ margin: 0 }}>{answer.body}</p>
              </div>
            ))
          ) : (
            <p style={{ color: "gray" }}>No answers yet.</p>
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
                placeholder="Write an answer..."
                style={{
                  width: "100%",
                  height: "80px",
                  padding: "8px",
                  marginTop: "10px",
                }}
              />

              <button
                onClick={() => submitAnswer(q.id)}
                style={{ marginTop: "8px" }}
              >
                Submit Answer
              </button>
            </>
          ) : (
            <p style={{ color: "gray" }}>
              Please login to submit an answer.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default App;