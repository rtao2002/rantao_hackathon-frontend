import { useEffect, useState } from "react";

const API_URL = "https://rantao-hackathon-backend-1000732984276.us-central1.run.app";

function App() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [questions, setQuestions] = useState([]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`${API_URL}/questions`);
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error(error);
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

  return (
    <div style={{ padding: "40px" }}>
      <h1>Student Q&A</h1>

      <form onSubmit={submitQuestion}>
        <div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Question title"
            style={{ width: "400px", padding: "8px", marginBottom: "10px" }}
          />
        </div>

        <div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Question details"
            style={{ width: "400px", height: "120px", padding: "8px" }}
          />
        </div>

        <button type="submit" style={{ marginTop: "10px" }}>
          Submit
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
            padding: "12px",
            marginBottom: "12px",
            width: "500px",
          }}
        >
          <h3>{q.title}</h3>
          <p>{q.body}</p>
        </div>
      ))}
    </div>
  );
}

export default App;