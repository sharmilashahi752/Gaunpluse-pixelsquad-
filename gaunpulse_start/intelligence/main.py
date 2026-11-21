from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Any
from simulator import simulate

app = FastAPI(title='GaunPulse Intelligence Service')

class SimulationRequest(BaseModel):
    network: dict[str, Any]
    failed_edge_id: str

@app.get('/health')
def health():
    return {'status': 'ok'}

@app.post('/simulate')
def run_simulation(payload: SimulationRequest):
    try:
        return simulate(payload.network, payload.failed_edge_id)
    except (ValueError, KeyError, TypeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
