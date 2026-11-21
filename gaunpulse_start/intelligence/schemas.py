from typing import Any, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, model_validator


class NodeSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra='allow')

    id: Union[int, str]
    name: Optional[str] = None
    node_code: Optional[str] = None
    type: Optional[str] = Field(default=None, alias='node_type')
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    households: Optional[int] = 0
    population: Optional[int] = None
    settlement_group_id: Optional[int] = None
    description: Optional[str] = None


class EdgeSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra='allow')

    id: Union[int, str]
    name: Optional[str] = None
    edge_code: Optional[str] = None
    source: Optional[Union[int, str, dict[str, Any]]] = Field(default=None, alias='from')
    source_node_id: Optional[Union[int, str]] = None
    target: Optional[Union[int, str, dict[str, Any]]] = Field(default=None, alias='to')
    target_node_id: Optional[Union[int, str]] = None
    type: Optional[str] = Field(default='road', alias='infrastructure_type')
    surface_type: Optional[str] = None
    status: Optional[str] = 'operational'
    length_meters: Optional[float] = None
    minutes: Optional[float] = Field(default=None, alias='travel_minutes')
    is_critical: Optional[bool] = False
    notes: Optional[str] = None

    @model_validator(mode='after')
    def resolve_nodes(self):
        if isinstance(self.source, dict):
            self.source = self.source.get('id')
        if isinstance(self.target, dict):
            self.target = self.target.get('id')
        if self.source is None and self.source_node_id is not None:
            self.source = self.source_node_id
        if self.target is None and self.target_node_id is not None:
            self.target = self.target_node_id
        return self


class FacilitySchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra='allow')

    id: Optional[Union[int, str]] = None
    name: str
    type: Optional[str] = Field(default='facility', alias='facility_type')
    node_id: Optional[Union[int, str]] = None
    operational_status: Optional[str] = 'operational'


class SettlementSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra='allow')

    id: Optional[Union[int, str]] = None
    name: str
    local_name: Optional[str] = None
    households: Optional[int] = 0
    population: Optional[int] = 0
    node_id: Optional[Union[int, str]] = None


class SimulationRequest(BaseModel):
    nodes: Optional[list[Union[NodeSchema, dict[str, Any]]]] = Field(default_factory=list)
    edges: Optional[list[Union[EdgeSchema, dict[str, Any]]]] = Field(default_factory=list)
    facilities: Optional[list[Union[FacilitySchema, dict[str, Any]]]] = Field(default_factory=list)
    settlements: Optional[list[Union[SettlementSchema, dict[str, Any]]]] = Field(default_factory=list)
    blocked_edge_ids: Optional[list[Union[int, str]]] = Field(default_factory=list)
    failed_edge_id: Optional[Union[int, str]] = None
    network: Optional[dict[str, Any]] = None

    @model_validator(mode='after')
    def handle_legacy_or_wrapped(self):
        # Support legacy network envelope
        if self.network and isinstance(self.network, dict):
            if not self.nodes and 'nodes' in self.network:
                self.nodes = self.network['nodes']
            if not self.edges and 'edges' in self.network:
                self.edges = self.network['edges']
        if self.failed_edge_id is not None and str(self.failed_edge_id) not in [str(x) for x in self.blocked_edge_ids]:
            self.blocked_edge_ids.append(self.failed_edge_id)
        if not self.blocked_edge_ids and self.failed_edge_id is None:
            # Allow empty blocked list for baseline-only calculation
            pass
        return self


class AccessComparison(BaseModel):
    settlement: str
    settlement_id: Union[int, str]
    facility: str
    facility_id: Union[int, str]
    facility_type: str
    before_minutes: Optional[float] = None
    after_minutes: Optional[float] = None
    travel_time_change: Optional[float] = None
    status: str  # 'unreachable', 'detour', 'unchanged', 'already_disconnected'
    baseline_path: list[Union[int, str]] = Field(default_factory=list)
    alternative_path: Optional[list[Union[int, str]]] = None


class SimulationResult(BaseModel):
    failed_edge_id: Optional[Union[int, str]] = None
    blocked_edge_ids: list[Union[int, str]]
    blocked_edges_info: list[dict[str, Any]] = Field(default_factory=list)
    affected_households: int
    newly_disconnected_households: int
    already_disconnected_households: int
    isolated_settlements: list[dict[str, Any]] = Field(default_factory=list)
    detour_settlements: list[dict[str, Any]] = Field(default_factory=list)
    essential_facilities_affected: list[dict[str, Any]] = Field(default_factory=list)
    access_comparisons: list[AccessComparison]
    summary_explanation: str
    data_quality: str = 'fictional_demo'
    calculation_timestamp: str


class RepairScenarioModel(BaseModel):
    name: str
    repair_edge_ids: list[Union[int, str]]


class RepairComparisonRequest(BaseModel):
    nodes: Optional[list[Union[NodeSchema, dict[str, Any]]]] = Field(default_factory=list)
    edges: Optional[list[Union[EdgeSchema, dict[str, Any]]]] = Field(default_factory=list)
    facilities: Optional[list[Union[FacilitySchema, dict[str, Any]]]] = Field(default_factory=list)
    settlements: Optional[list[Union[SettlementSchema, dict[str, Any]]]] = Field(default_factory=list)
    currently_blocked_edge_ids: list[Union[int, str]]
    scenario_a: RepairScenarioModel
    scenario_b: RepairScenarioModel


class RepairScenarioOutcome(BaseModel):
    scenario_name: str
    repaired_edge_ids: list[Union[int, str]]
    households_regaining_access: int
    facilities_restored: int
    travel_time_improvement_minutes: float
    remaining_blocked_edges: list[Union[int, str]]
    remaining_affected_households: int
    unreachable_routes_count: int


class RepairComparisonResult(BaseModel):
    baseline_blocked_edges: list[Union[int, str]]
    scenario_a: RepairScenarioOutcome
    scenario_b: RepairScenarioOutcome
    comparison_summary: str
    cost_status: str = 'unknown - do not rank on cost without verified estimates'
    recommendation_note: str = (
        'A municipality officer must make the final decision based on local community priorities, '
        'seasonal accessibility, and geotechnical safety rather than automated cost scoring.'
    )
    calculation_timestamp: str


# ==========================================
# PART 5: AI AGENT SCHEMAS
# ==========================================

class AIChatMessage(BaseModel):
    role: str  # 'user', 'assistant', 'system'
    content: str


class AIChatRequest(BaseModel):
    village_id: int = 1
    message: str
    conversation_history: list[AIChatMessage] = Field(default_factory=list)
    language: Optional[str] = None  # 'en', 'ne', or None (auto-detect)
    network_data: Optional[dict[str, Any]] = None
    issues_data: Optional[list[dict[str, Any]]] = None


class AIToolCall(BaseModel):
    tool: str
    args: dict[str, Any]
    result: Any
    agent: Optional[str] = None


class DraftActionPlan(BaseModel):
    title: str
    issue_id: Optional[int] = None
    village_id: int = 1
    ward: str = "Ward 4"
    priority: str = "High"
    responsible_team: str = "Municipal Infrastructure Unit"
    problem_summary: str
    evidence: str
    suggested_inspection_steps: list[str] = Field(default_factory=list)
    accessibility_considerations: str
    proposed_responsibilities: str
    follow_up_tasks: list[str] = Field(default_factory=list)
    uncertainties: str
    target_days: int = 7


class AIChatResponse(BaseModel):
    reply: str
    language: str = "en"
    tools_called: list[AIToolCall] = Field(default_factory=list)
    draft_action_plan: Optional[DraftActionPlan] = None
    suggested_questions: list[str] = Field(default_factory=list)
    relevant_links: list[dict[str, str]] = Field(default_factory=list)


class AIInsightsResponse(BaseModel):
    village_id: int
    village_name: str
    frequent_category: str
    critical_issues_summary: str
    simulation_risk_alert: str
    recommended_action: str
    database_backed: bool = True
    metrics: dict[str, Any] = Field(default_factory=dict)

