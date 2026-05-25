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
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  const searchDiagnoses = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    try {
      setError(null);
      const res = await invoke<string[]>("search_diagnoses", { query: q });
      setSuggestions(res);
      setShowDropdown(res.length > 0);
    } catch (e) {
      setError(String(e));
      console.error(e);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedDiagnosis(null);
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      searchDiagnoses(value);
    }, 300);
  };

  const selectDiagnosis = async (diagnosis: string) => {
    setQuery(diagnosis);
    setSelectedDiagnosis(diagnosis);
    setShowDropdown(false);
    setError(null);
    try {
      const res = await invoke<ResultRow[]>("get_results", { diagnosis });
      setResults(res);
    } catch (e) {
      setError(String(e));
      console.error(e);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>ICF-Anything</h1>
        <p className="header-sub">Поиск по Международной классификации функционирования</p>
      </header>

      <div className="card">
        <div className="search-section">
          <div className="search-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={() => query && suggestions.length > 0 && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="Введите диагноз..."
              className="search-input"
            />
          </div>
          {showDropdown && (
            <ul className="suggestions">
              {suggestions.map((s, i) => (
                <li key={i} onMouseDown={() => selectDiagnosis(s)}>
                  {s}
                </li>
              ))}
            </ul>
          )}
          {error && <p className="error-message">{error}</p>}
        </div>

        {results.length > 0 && <hr className="section-divider" />}

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
          <div className="no-results">
            <svg className="no-results-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>Нет результатов для выбранного диагноза</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
