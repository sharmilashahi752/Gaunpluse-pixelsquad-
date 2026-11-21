from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Any, Union

from graph_builder import GraphValidationError
from schemas import (
    AIChatRequest,
    AIChatResponse,
    AIInsightsResponse,
    SimulationRequest,
    SimulationResult,
    RepairComparisonRequest,
    RepairComparisonResult,
)
from simulator import run_simulation, compare_repairs
from agent import GaunPulseAIAgent

app = FastAPI(
    title="GaunPulse Intelligence Service",
    description="Graph-theoretic rural lifeline simulation, repair prioritization, and AI decision-support engine for Nepal.",
    version="1.0.0",
)

ai_agent = GaunPulseAIAgent()

# Enable CORS for local development & dashboard calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", summary="Health check")
def health():
    return {
        "status": "ok",
        "service": "gaunpulse-intelligence",
        "engine": "networkx",
        "version": "1.0.0",
    }


@app.post(
    "/simulate",
    response_model=SimulationResult,
    summary="Simulate infrastructure failure impact",
    description=(
        "Simulates the impact of blocking one or more roads or bridges across a village's "
        "infrastructure lifeline graph using NetworkX shortest-path calculations."
    ),
)
def simulate_endpoint(payload: Union[SimulationRequest, dict[str, Any]]):
    try:
        # If passed raw dict, parse with SimulationRequest
        if isinstance(payload, dict):
            req = SimulationRequest(**payload)
        else:
            req = payload

        # Extract nodes and edges (handling legacy network envelope if present)
        nodes = req.nodes
        edges = req.edges
        if not nodes and req.network and "nodes" in req.network:
            nodes = req.network["nodes"]
        if not edges and req.network and "edges" in req.network:
            edges = req.network["edges"]

        result = run_simulation(
            nodes=nodes,
            edges=edges,
            blocked_edge_ids=req.blocked_edge_ids,
            facilities=req.facilities,
            settlements=req.settlements,
            failed_edge_id=req.failed_edge_id,
            baseline_blocked_edge_ids=req.baseline_blocked_edge_ids,
            routing_metric=req.routing_metric,
            data_quality=req.data_quality,
            graph_version=req.graph_version,
        )
        return result
    except GraphValidationError as exc:
        raise HTTPException(status_code=422, detail=f"Graph validation failed: {str(exc)}") from exc
    except (ValueError, KeyError, TypeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(exc)}") from exc


@app.post(
    "/compare-repairs",
    response_model=RepairComparisonResult,
    summary="Compare two repair interventions ('What If We Fix This First?')",
    description=(
        "Compares two competing repair options against current baseline infrastructure damage, "
        "calculating households reconnected, facilities restored, and travel-time improvements."
    ),
)
def compare_repairs_endpoint(payload: RepairComparisonRequest):
    try:
        result = compare_repairs(
            nodes=payload.nodes,
            edges=payload.edges,
            currently_blocked_edge_ids=payload.currently_blocked_edge_ids,
            scenario_a_name=payload.scenario_a.name,
            scenario_a_repair_ids=payload.scenario_a.repair_edge_ids,
            scenario_b_name=payload.scenario_b.name,
            scenario_b_repair_ids=payload.scenario_b.repair_edge_ids,
            facilities=payload.facilities,
            settlements=payload.settlements,
            routing_metric=payload.routing_metric,
            data_quality=payload.data_quality,
            graph_version=payload.graph_version,
        )
        return result
    except GraphValidationError as exc:
        raise HTTPException(status_code=422, detail=f"Graph validation failed: {str(exc)}") from exc
    except (ValueError, KeyError, TypeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Repair comparison error: {str(exc)}") from exc


@app.post(
    "/ai/chat",
    response_model=AIChatResponse,
    summary="Chat with GaunPulse AI Agent",
    description="Ask natural-language questions in Nepali or English about village lifelines, simulations, or draft action plans.",
)
async def ai_chat_endpoint(payload: AIChatRequest):
    try:
        return await ai_agent.chat(payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI Agent error: {str(exc)}") from exc


@app.get(
    "/ai/insights",
    response_model=AIInsightsResponse,
    summary="Get proactive AI insights for dashboard",
)
async def ai_insights_endpoint(village_id: int = 1):
    try:
        return await ai_agent.get_insights(village_id=village_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI Insights error: {str(exc)}") from exc


@app.post(
    "/ai/insights",
    response_model=AIInsightsResponse,
    summary="Get proactive AI insights with optional preloaded data",
)
async def ai_insights_post_endpoint(payload: dict[str, Any]):
    try:
        village_id = payload.get("village_id", 1)
        issues_list = payload.get("issues_data")
        return await ai_agent.get_insights(village_id=village_id, issues_list=issues_list)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI Insights error: {str(exc)}") from exc
