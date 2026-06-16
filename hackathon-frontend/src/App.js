import { useEffect, useState } from "react";

const API_URL = "https://rantao-hackathon-backend-1000732984276.us-central1.run.app";

function App() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [questions, setQuestions] = useState([]);

  const [answerTexts, setAnswerTexts] = useState({});

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`${API_URL}/questions`);
      const data = await response.json();

      const questionsWithAnswers = await Promise.all(
        data.map(async (question) => {
          const answerResponse = await fetch(
            `${API_URL}/questions/${question.id}/answers`
          );
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

  const submitQuestion = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      setMessage("Question submitted!");
      fetchQuestions();
    } catch (error) {
      console.error(error);
      setMessage("Error submitting question");
    }
  };

  const submitAnswer = async (questionId) => {
    const answerBody = answerTexts[questionId];

    if (!answerBody || answerBody.trim() === "") {
      setMessage("Please write an answer first");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/questions/${questionId}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

  return (
    <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Student Q&A</h1>

      <form onSubmit={submitQuestion}>
        <div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Question title"
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
            onChange={(e) => setBody(e.target.value)}
            placeholder="Question details"
            style={{
              width: "500px",
              height: "120px",
              padding: "8px",
            }}
          />
        </div>

        <button type="submit" style={{ marginTop: "10px" }}>
          Submit Question
        </button>
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
        </div>
      ))}
    </div>
  );
}

export default App;