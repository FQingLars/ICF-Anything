import { useState, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface ResultRow {
  diagnosis: string;
  icf: string;
  scale: string | null;
  procedures: string | null;
}

function App() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  const searchDiagnoses = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    try {
      const res = await invoke<string[]>("search_diagnoses", { query: q });
      setSuggestions(res);
      setShowDropdown(res.length > 0);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedDiagnosis(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      searchDiagnoses(value);
    }, 300);
  };

  const selectDiagnosis = async (diagnosis: string) => {
    setQuery(diagnosis);
    setSelectedDiagnosis(diagnosis);
    setShowDropdown(false);
    try {
      const res = await invoke<ResultRow[]>("get_results", { diagnosis });
      setResults(res);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="container">
      <h1>ICF-Anything</h1>
      <div className="search-section">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && suggestions.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder="Введите диагноз..."
          className="search-input"
        />
        {showDropdown && (
          <ul className="suggestions">
            {suggestions.map((s, i) => (
              <li key={i} onMouseDown={() => selectDiagnosis(s)}>
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
      {results.length > 0 && (
        <table className="results-table">
          <thead>
            <tr>
              <th>Diagnosis</th>
              <th>ICF</th>
              <th>Scale</th>
              <th>Procedures</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i}>
                <td>{r.diagnosis}</td>
                <td>{r.icf}</td>
                <td>{r.scale || "-"}</td>
                <td>{r.procedures || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {selectedDiagnosis && results.length === 0 && (
        <p className="no-results">Нет результатов для выбранного диагноза</p>
      )}
    </main>
  );
}

export default App;
