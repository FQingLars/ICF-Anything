use rusqlite::{Connection, Statement};
use serde::Serialize;
use std::path::Path;

#[derive(Debug, Serialize)]
pub struct PainScaleInfo {
    pub scale: i32,
    pub name: String,
    pub description: String,
}

#[derive(Debug, Serialize)]
pub struct ProcedureDetail {
    pub id: i32,
    pub name: String,
    pub machine: String,
    pub parameters: String,
    pub time: String,
    pub day_course: String,
}

#[derive(Debug, Serialize)]
pub struct ResultRow {
    pub diagnosis: String,
    pub icf: String,
    pub pain: PainScaleInfo,
    pub procedure: ProcedureDetail,
}

pub fn init_db(path: &Path, embedded: &[u8]) -> Result<(), String> {
    std::fs::write(path, embedded).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn search_diagnoses(path: &Path, query: &str) -> Result<Vec<String>, String> {
    if query.trim().is_empty() {
        return Ok(Vec::new());
    }

    let conn: Connection = Connection::open(path).map_err(|e| e.to_string())?;
    let pattern: String = format!("%{}%", query);

    let mut stmt: Statement = conn
        .prepare("SELECT DISTINCT Diagnosis FROM DiaICFToProcedures WHERE Diagnosis LIKE ?1 LIMIT 20")
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
            "SELECT DISTINCT dp.Diagnosis, dp.ICF, s.Scale, sp.Pain, sp.Description,
                    pr.ProcedureID, pr.Procedure, pr.Machine, pr.Parameters, pr.Time, pr.DayCourse
             FROM DiaICFToProcedures dp
             JOIN ICFToScale s ON dp.ICF = s.ICF
             JOIN ScaleToPain sp ON s.Scale = sp.Scale
             JOIN Procedures pr ON dp.ProcedureID = pr.ProcedureID
             WHERE dp.Diagnosis = ?1",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([diagnosis], |row| {
            Ok(ResultRow {
                diagnosis: row.get(0)?,
                icf: row.get(1)?,
                pain: PainScaleInfo {
                    scale: row.get(2)?,
                    name: row.get(3)?,
                    description: row.get(4)?,
                },
                procedure: ProcedureDetail {
                    id: row.get(5)?,
                    name: row.get(6)?,
                    machine: row.get(7)?,
                    parameters: row.get(8)?,
                    time: row.get(9)?,
                    day_course: row.get(10)?,
                },
            })
        })
        .map_err(|e| e.to_string())?;
    let mut results: Vec<ResultRow> = Vec::new();

    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }
    Ok(results)
}
