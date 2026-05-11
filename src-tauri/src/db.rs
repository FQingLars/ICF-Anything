use rusqlite::{Connection, Statement};
use serde::Serialize;
use std::path::Path;

#[derive(Debug, Serialize)]
pub struct ResultRow {
    pub diagnosis: String,
    pub icf: String,
    pub scale: Option<String>,
    pub procedures: Option<String>,
}

pub fn init_db(path: &Path, embedded: &[u8]) -> Result<(), String> {
    if !path.exists() {
        std::fs::write(path, embedded).map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn search_diagnoses(path: &Path, query: &str) -> Result<Vec<String>, String> {
    if query.trim().is_empty() {
        return Ok(Vec::new());
    }

    let conn: Connection = Connection::open(path).map_err(|e| e.to_string())?;
    let pattern: String = format!("%{}%", query);

    let mut stmt: Statement = conn
        .prepare("SELECT DISTINCT Diagnosis FROM DiaToICF WHERE Diagnosis LIKE ?1 LIMIT 20")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([&pattern], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    let mut results: Vec<String> = Vec::new();

    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }
    Ok(results)
}

pub fn get_results(path: &Path, diagnosis: &str) -> Result<Vec<ResultRow>, String> {
    let conn: Connection = Connection::open(path).map_err(|e| e.to_string())?;

    let mut stmt: Statement = conn
        .prepare(
            "SELECT d.Diagnosis, d.ICF, s.Scale, p.Procedures
             FROM DiaToICF d
             LEFT JOIN ICFToScale s ON d.ICF = s.ICF
             LEFT JOIN ICFToProcs p ON d.ICF = p.ICF AND d.Diagnosis = p.Diagnosis
             WHERE d.Diagnosis = ?1",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([diagnosis], |row| {
            Ok(ResultRow {
                diagnosis: row.get(0)?,
                icf: row.get(1)?,
                scale: row.get(2)?,
                procedures: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut results: Vec<ResultRow> = Vec::new();

    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }
    Ok(results)
}
