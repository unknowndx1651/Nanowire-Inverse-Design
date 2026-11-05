import sys
import os
import uuid
import threading
import numpy as np
import pandas as pd 

sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

from simulator import simulate_design
from design_finder import find_design_for_target


app = FastAPI(title="Nanowire Inverse Design API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "initial_dataset.csv")
BASELINE_DF = None


@app.on_event("startup")
def load_baseline_dataset():
    global BASELINE_DF
    BASELINE_DF = pd.read_csv(DATA_PATH)
    print(f"Loaded baseline dataset: {len(BASELINE_DF)} designs")


JOBS = {}


def safe_float(x):
    if x is None:
        return None
    x = float(x)
    if np.isinf(x) or np.isnan(x):
        return None
    return x


def json_safe(obj):
    """
    Recursively walk a response payload and replace any NaN/inf float
    (including numpy scalar types) with None, so a stray non-finite
    value anywhere in the pipeline -- e.g. from an occasional degenerate
    GP/classifier fit -- can never crash JSON serialization. This is a
    defense-in-depth sweep applied right before every response is
    returned, on top of the targeted safe_float() calls elsewhere.
    """
    if isinstance(obj, dict):
        return {k: json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [json_safe(v) for v in obj]
    if isinstance(obj, (np.floating, float)):
        f = float(obj)
        return None if (np.isnan(f) or np.isinf(f)) else f
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.bool_,)):
        return bool(obj)
    return obj


def serialize_properties(props):
    if props is None:
        return None
    return {
        "sheet_resistance": safe_float(props["sheet_resistance"]),
        "transparency": safe_float(props["transparency"]),
        "strain_tolerance": safe_float(props["strain_tolerance"]),
        "percolates": bool(props["percolates"]),
    }


def serialize_network(network):
    if network is None:
        return None
    return np.asarray(network).tolist()


def serialize_history(history_df):
    """
    One record per evaluated design, in evaluation order. The baseline
    dataset rows come first, followed by this run's new designs, so the
    last `n_new_simulations` records are the ones this run produced.
    """
    if history_df is None:
        return []

    numeric_cols = [
        "density", "length_mean", "diameter", "orientation_S", "junction_resistance",
        "sheet_resistance", "transparency", "strain_tolerance",
    ]

    records = []
    for row in history_df.to_dict(orient="records"):
        rec = {c: safe_float(row.get(c)) for c in numeric_cols}
        seed = row.get("seed")
        rec["seed"] = None if seed is None or pd.isna(seed) else int(seed)
        rec["percolates"] = bool(row.get("percolates"))
        records.append(rec)
    return records

class SimulateRequest(BaseModel):
    density: float = Field(..., gt=0)
    length_mean: float = Field(..., gt=0)
    diameter: float = Field(..., gt=0)
    orientation_S: float = Field(..., ge=0, le=1)
    junction_resistance: float = Field(..., gt=0)
    seed: Optional[int] = None


class OptimizeRequest(BaseModel):
    objective: str = Field("sheet_resistance",
                            pattern="^(sheet_resistance|transparency|strain_tolerance)$")
    max_sheet_resistance: Optional[float] = None
    min_transparency: Optional[float] = None
    min_strain_tolerance: Optional[float] = None
    budget: int = Field(50, ge=1, le=200)


@app.post("/simulate")
def simulate(req: SimulateRequest):
    result = simulate_design(
        density=req.density, length_mean=req.length_mean, diameter=req.diameter,
        orientation_S=req.orientation_S, junction_resistance=req.junction_resistance,
        seed=req.seed,
    )
    return json_safe({
        "properties": serialize_properties(result),
        "network": serialize_network(result["network"]),
        "n_wires": result["n_wires"],
    })


def _run_optimization_job(job_id, req: OptimizeRequest):
    def progress_callback(iteration, budget, history_df):
        JOBS[job_id]["progress"] = {"iteration": iteration, "budget": budget}

    try:
        result = find_design_for_target(
            BASELINE_DF, budget=req.budget, objective=req.objective,
            max_sheet_resistance=req.max_sheet_resistance,
            min_transparency=req.min_transparency,
            min_strain_tolerance=req.min_strain_tolerance,
            seed=0,
            progress_callback=progress_callback,
        )
        JOBS[job_id]["status"] = "done"
        JOBS[job_id]["result"] = result
    except Exception as e:
        JOBS[job_id]["status"] = "failed"
        JOBS[job_id]["error"] = str(e)


@app.post("/optimize")
def optimize(req: OptimizeRequest):
    job_id = str(uuid.uuid4())
    JOBS[job_id] = {
        "status": "running",
        "progress": {"iteration": 0, "budget": req.budget},
        "result": None,
        "error": None,
    }

    thread = threading.Thread(target=_run_optimization_job, args=(job_id, req), daemon=True)
    thread.start()

    return {"job_id": job_id}


@app.get("/optimization/{job_id}")
def get_optimization_status(job_id: str):
    job = JOBS.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Unknown job_id")
    return json_safe({"status": job["status"], "progress": job["progress"], "error": job["error"]})


@app.get("/results/{job_id}")
def get_results(job_id: str):
    job = JOBS.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Unknown job_id")
    if job["status"] == "running":
        return json_safe({"status": "running", "progress": job["progress"]})
    if job["status"] == "failed":
        return json_safe({"status": "failed", "error": job["error"]})

    result = job["result"]
    return json_safe({
        "status": "done",
        "feasible": result["feasible"],
        "design": result["design"],
        "properties": serialize_properties(result["properties"]),
        "network": serialize_network(result["network"]),
        "n_new_simulations": result["n_new_simulations"],
        "history": serialize_history(result["history_df"]),
    })