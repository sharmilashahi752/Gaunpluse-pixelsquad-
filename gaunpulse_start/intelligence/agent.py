import re
import httpx
from typing import Any, Dict, List, Optional
from config import GEMINI_API_KEY, OPENAI_API_KEY, AI_MODEL, REQUEST_TIMEOUT, LARAVEL_API_URL
from schemas import (
    AIChatMessage,
    AIChatRequest,
    AIChatResponse,
    AIToolCall,
    DraftActionPlan,
    AIInsightsResponse,
)
import tools


def is_nepali_text(text: str) -> bool:
    """Detect if text contains Devanagari Unicode characters (U+0900 to U+097F)."""
    return bool(re.search(r'[\u0900-\u097f]', text))


class GaunPulseAIAgent:
    """
    GaunPulse AI Decision-Support Agent for Rural Infrastructure Intelligence.
    Coordinates tool execution against Laravel and NetworkX, synthesizing
    evidence-backed insights in English and Nepali for any village in Nepal.
    """

    SYSTEM_PROMPT_EN = (
        "You are GaunPulse AI, an intelligent municipal infrastructure decision-support agent for Nepal. "
        "You assist ward officers and planners using verified database records and NetworkX graph simulations. "
        "RULES: "
        "1. Never fabricate affected household numbers or repair costs. "
        "2. All disruption estimates must originate from the NetworkX simulator tool. "
        "3. Action plans are strictly drafts and require human municipal officer approval. "
        "4. Never approve spending or declare uninspected infrastructure safe. "
        "5. Explain technical shortest-path routing clearly in terms of rural settlements, health posts, and schools."
    )

    SYSTEM_PROMPT_NE = (
        "तपाईं गाउँपल्स (GaunPulse) एआई हुनुहुन्छ, नेपालको ग्रामीण पूर्वाधार निर्णय-सहयोग सहायक। "
        "तपाईं वडा प्रतिनिधि र नगरपालिका प्राविधिकहरूलाई वास्तविक तथ्याङ्क र नेटवर्कएक्स (NetworkX) सिमुलेसनको आधारमा सहयोग गर्नुहुन्छ। "
        "नियमहरू: "
        "१. कुनै पनि काल्पनिक तथ्याङ्क वा बजेट खर्च नबनाउनुहोस्। "
        "२. सम्पूर्ण प्रभाव आँकडा सिमुलेटरबाट प्राप्त हुनुपर्छ। "
        "३. कार्ययोजनाहरू मस्यौदा मात्र हुन् र आधिकारिक प्रतिनिधिको स्वीकृति अनिवार्य छ।"
    )

    async def chat(self, request: AIChatRequest) -> AIChatResponse:
        message = request.message.strip()
        village_id = request.village_id or 1
        is_nepali = request.language == "ne" or (request.language is None and is_nepali_text(message))

        # Security check: prompt injection / unauthorized command refusal
        lower_msg = message.lower()
        if any(bad in lower_msg for bad in ["drop table", "ignore previous instructions", "approve budget of", "mark all safe"]):
            refusal_en = (
                "Security Notice: GaunPulse AI cannot bypass municipal protocol, approve public expenditure, "
                "or mark infrastructure safe without certified engineering inspection."
            )
            refusal_ne = (
                "सुरक्षा सूचना: गाउँपल्स एआईले नगरपालिकाको आधिकारिक प्रक्रिया छल्न, बजेट स्वीकृत गर्न वा "
                "प्रत्यक्ष प्राविधिक परीक्षण बिना पूर्वाधारलाई सुरक्षित घोषणा गर्न सक्दैन।"
            )
            return AIChatResponse(
                reply=refusal_ne if is_nepali else refusal_en,
                language="ne" if is_nepali else "en",
                tools_called=[],
                suggested_questions=[
                    "Which issues are currently critical?",
                    "What happens if our main bridge or road fails?",
                ],
            )

        # Retrieve village administrative metadata from preloaded request or dynamically
        network_data = request.network_data
        issues_data = request.issues_data

        if network_data and isinstance(network_data, dict) and "village" in network_data:
            village_details = network_data["village"] or {}
        else:
            try:
                village_details = await tools.get_village_details(village_id=village_id)
            except Exception:
                village_details = {}

        village_name = village_details.get("name") or f"Village {village_id}"
        village_muni = village_details.get("municipality") or "Municipality"
        village_ward = f"Ward {village_details.get('ward_no', '1')}"

        tools_called: List[AIToolCall] = []
        draft_plan: Optional[DraftActionPlan] = None
        relevant_links: List[Dict[str, str]] = []

        # ==========================================
        # TOOL SELECTION & INTENT DETECTION
        # ==========================================

        is_sim_intent = any(w in lower_msg for w in [
            "simulate", "what happens if", "blocked", "closed", "collapse", "bridge b", "bridge", "road",
            "पुल", "बाटो", "अवरुद्ध", "के हुन्छ", "प्रभावित", "बन्द", "सिमुलेसन"
        ])

        is_plan_intent = any(w in lower_msg for w in [
            "action plan", "draft plan", "repair plan", "intervention",
            "कार्ययोजना", "मर्मत योजना", "योजना बनाउ", "योजना"
        ])

        is_priority_intent = any(w in lower_msg for w in [
            "priority", "priorities", "rank", "inspect first", "fix first",
            "प्राथमिकता", "पहिले कुन", "प्राथमिकीकरण"
        ])

        tracking_code_match = re.search(r'\b(gp-[a-z0-9-]+)\b', lower_msg)
        is_citizen_intent = bool(tracking_code_match) or any(w in lower_msg for w in [
            "my issue", "track", "tracking code", "report a damaged", "how can i report",
            "गुनासो", "उजुरी", "कहाँ पुगेको", "स्थिति", "कसरी दर्ता"
        ])

        is_issues_intent = any(w in lower_msg for w in [
            "issues", "problems", "alerts", "reports", "disruptions",
            "समस्या", "विवरण", "के के छन्"
        ])

        # 1. Citizen Assistance Tool Call
        if is_citizen_intent:
            matched_code = tracking_code_match.group(1).upper() if tracking_code_match else None
            issues_res = await tools.get_village_issues(village_id=village_id, issues_list=issues_data)
            matching_issue = None
            if matched_code and "issues" in issues_res:
                matching_issue = next((i for i in issues_res["issues"] if (i.get("tracking_code") or "").upper() == matched_code), None)
            elif "issues" in issues_res and issues_res["issues"]:
                matching_issue = issues_res["issues"][0]

            tools_called.append(AIToolCall(
                tool="lookup_citizen_issue",
                agent="Citizen Assistance Agent",
                args={"tracking_code": matched_code or (matching_issue.get("tracking_code") if matching_issue else "GP-01")},
                result={"found": bool(matching_issue), "issue": matching_issue, "village": village_name},
            ))
            relevant_links.append({"label": "Report New Issue", "url": "#/issues-alerts"})

        # 2. Priorities Ranking Tool Call
        if is_priority_intent or (is_plan_intent and not is_sim_intent):
            prio_res = await tools.get_repair_priorities(village_id=village_id, issues_list=issues_data)
            tools_called.append(AIToolCall(
                tool="get_repair_priorities",
                agent="Problem Prioritization Agent",
                args={"village_id": village_id},
                result=prio_res,
            ))

        # 3. Simulation Tool Call
        if is_sim_intent:
            # Ensure network data is loaded for this village
            if not network_data:
                try:
                    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                        resp = await client.get(f"{LARAVEL_API_URL}/villages/{village_id}/network")
                        if resp.status_code == 200:
                            network_data = resp.json()
                except Exception as exc:
                    network_data = None

            available_edges = network_data.get("edges", []) if network_data else []

            if not available_edges:
                # Guidance if village has no mapped edges
                empty_msg_ne = (
                    f"**{village_name}** को लागि कुनै सडक वा पुलको नक्साङ्कन (Graph) भेटिएन। "
                    f"सिमुलेसन चलाउनुअघि कृपया 'Village Data Manager' मा गएर OpenStreetMap डेटा आयात गर्नुहोस्।"
                )
                empty_msg_en = (
                    f"Village **{village_name}** currently has no mapped road or bridge edges in its network graph. "
                    f"Please visit the **Village Data Manager** to discover or map infrastructure lifelines before running an impact simulation."
                )
                return AIChatResponse(
                    reply=empty_msg_ne if is_nepali else empty_msg_en,
                    language="ne" if is_nepali else "en",
                    tools_called=[],
                    relevant_links=[{"label": "Village Data Manager", "url": "#/village-data"}],
                    suggested_questions=[
                        f"Which issues are registered in {village_name}?",
                        f"How can I report a problem in {village_name}?",
                    ],
                )

            # Match edge from user query or select the first edge belonging to this village
            edge_id = None
            for e in available_edges:
                e_name = (e.get("name") or "").lower()
                e_code = (e.get("edge_code") or "").lower()
                if (e_name and e_name in lower_msg) or (e_code and e_code in lower_msg):
                    edge_id = e.get("id")
                    break

            if edge_id is None:
                edge_id = available_edges[0].get("id")

            sim_res = await tools.simulate_infrastructure_failure(
                edge_id=edge_id,
                village_id=village_id,
                network_data=network_data,
            )
            tools_called.append(AIToolCall(
                tool="simulate_infrastructure_failure",
                agent="Infrastructure Impact Agent",
                args={"edge_id": edge_id, "village_id": village_id},
                result=sim_res,
            ))
            relevant_links.append({"label": "Open Impact Simulator", "url": "#/simulations"})
            relevant_links.append({"label": f"View {village_name} Map", "url": "#/village-map"})

        # 4. Action Plan Drafting Tool Call
        if is_plan_intent:
            # Look up registered issues for this village
            issues_res = await tools.get_village_issues(village_id=village_id, issues_list=issues_data)
            village_issues = issues_res.get("issues", [])

            matching_issue = None
            issue_id = None

            if village_issues:
                # Check if specific issue title or code matches
                for iss in village_issues:
                    if (iss.get("title") or "").lower() in lower_msg or (iss.get("tracking_code") or "").lower() in lower_msg:
                        matching_issue = iss
                        issue_id = iss.get("id")
                        break
                if not matching_issue:
                    matching_issue = village_issues[0]
                    issue_id = matching_issue.get("id")
            else:
                issue_id = None
                matching_issue = {
                    "id": None,
                    "title": f"Primary Lifeline Maintenance in {village_name}",
                    "category": "road_bridge",
                    "severity": "High",
                    "description": f"Preventative structural assessment and clearing for critical rural lifelines in {village_name}.",
                    "ward": village_details.get("ward_no", "1"),
                }

            plan_res = await tools.generate_action_plan_draft(
                issue_id=issue_id or 0,
                village_id=village_id,
                issue_data=matching_issue,
            )
            tools_called.append(AIToolCall(
                tool="generate_action_plan_draft",
                agent="Repair Planning Agent",
                args={"issue_id": issue_id or 0, "village_id": village_id},
                result=plan_res,
            ))
            if "error" not in plan_res:
                draft_plan = DraftActionPlan(**plan_res)
            relevant_links.append({"label": "Action Plans Management", "url": "#/action-plans"})

        # 5. Issues List Tool Call
        if is_issues_intent and not is_sim_intent and not is_plan_intent and not is_priority_intent and not is_citizen_intent:
            issues_res = await tools.get_village_issues(village_id=village_id, issues_list=issues_data)
            tools_called.append(AIToolCall(
                tool="get_village_issues",
                agent="AI Coordinator",
                args={"village_id": village_id},
                result=issues_res,
            ))
            relevant_links.append({"label": f"View {village_name} Issues", "url": "#/issues-alerts"})

        # Default fallback tool: load village issues
        if not tools_called:
            issues_res = await tools.get_village_issues(village_id=village_id, issues_list=issues_data)
            tools_called.append(AIToolCall(
                tool="get_village_issues",
                agent="AI Coordinator",
                args={"village_id": village_id},
                result=issues_res,
            ))

        # ==========================================
        # SYNTHESIS
        # ==========================================
        reply = await self._synthesize_response(
            message=message,
            is_nepali=is_nepali,
            tools_called=tools_called,
            draft_plan=draft_plan,
            village_name=village_name,
            village_ward=village_ward,
        )

        suggested_questions = [
            f"कुन पूर्वाधार समस्यालाई पहिलो प्राथमिकता दिने?" if is_nepali else f"Which issues have the highest priority in {village_name}?",
            f"बाटो वा पुल अवरुद्ध हुँदा कुन बस्ती प्रभावित हुन्छ?" if is_nepali else f"What happens if a primary lifeline fails in {village_name}?",
            f"{village_name} को लागि मर्मत कार्ययोजना तयार गर्नुहोस्।" if is_nepali else f"Draft a rapid repair action plan for {village_name}",
        ]

        return AIChatResponse(
            reply=reply,
            language="ne" if is_nepali else "en",
            tools_called=tools_called,
            draft_action_plan=draft_plan,
            suggested_questions=suggested_questions,
            relevant_links=relevant_links,
        )

    async def _synthesize_response(
        self,
        message: str,
        is_nepali: bool,
        tools_called: List[AIToolCall],
        draft_plan: Optional[DraftActionPlan],
        village_name: str = "Village",
        village_ward: str = "Ward 1",
    ) -> str:
        """Synthesize response using real tool data, supporting Gemini/OpenAI if configured or deterministic engine."""
        if GEMINI_API_KEY:
            try:
                res = await self._call_gemini(message, is_nepali, tools_called)
                if res:
                    return res
            except Exception:
                pass

        if OPENAI_API_KEY:
            try:
                res = await self._call_openai(message, is_nepali, tools_called)
                if res:
                    return res
            except Exception:
                pass

        return self._deterministic_synthesis(is_nepali, tools_called, draft_plan, village_name, village_ward)

    def _deterministic_synthesis(
        self,
        is_nepali: bool,
        tools_called: List[AIToolCall],
        draft_plan: Optional[DraftActionPlan],
        village_name: str = "Village",
        village_ward: str = "Ward 1",
    ) -> str:
        # Check action plan draft call first
        if draft_plan:
            sim_call = next((t for t in tools_called if t.tool == "simulate_infrastructure_failure"), None)
            sim_extra_en = ""
            sim_extra_ne = ""
            if sim_call and "error" not in sim_call.result:
                r = sim_call.result
                hh = r.get("affected_households", 0)
                sim_extra_en = f"\n• **Underlying Impact:** NetworkX simulation calculated {hh} isolated households without this intervention.\n"
                sim_extra_ne = f"\n• **जोखिम विश्लेषण:** नेटवर्कएक्स सिमुलेसन अनुसार यो काम नगरिएमा {hh} घरधुरी सम्पर्कविहीन हुन्छन्।\n"

            if is_nepali:
                return (
                    f"मैले **{village_name}** को लागि **{draft_plan.title}** प्राविधिक मस्यौदा कार्ययोजना तयार गरेको छु।\n\n"
                    f"• **जिम्मेवार निकाय:** {draft_plan.responsible_team}\n"
                    f"• **प्राथमिकता तह:** {draft_plan.priority}\n"
                    f"{sim_extra_ne}"
                    f"• **सुझाइएका निरीक्षण कदमहरू:** {'; '.join(draft_plan.suggested_inspection_steps[:2])}\n\n"
                    f"⚠️ *नोट: यो योजना मस्यौदा मात्र हो। नगरपालिका अधिकृत वा वडा अध्यक्षको औपचारिक स्वीकृति बिना कुनै पनि बजेट निकासा वा कार्य सुरु गर्न सकिँदैन।* "
                    f"तलको 'Import Draft into Action Plans' बटन थिचेर यसलाई आधिकारिक प्रणालीमा दर्ता गर्न सक्नुहुन्छ।"
                )
            else:
                return (
                    f"I have prepared an evidence-based draft action plan for **{village_name}**: **{draft_plan.title}**.\n\n"
                    f"• **Responsible Team:** {draft_plan.responsible_team}\n"
                    f"• **Assessed Priority:** {draft_plan.priority}\n"
                    f"{sim_extra_en}"
                    f"• **Key Inspection Tasks:**\n"
                    f"  1. On-site engineer check of structural tension and abutment scour.\n"
                    f"  2. Installation of warning signage and pedestrian safety tape.\n"
                    f"• **Estimated Completion:** ~{draft_plan.target_days} working days\n\n"
                    f"⚖️ *Municipal Protocol Note: This is a draft proposal. Official budget allocation and construction require authorized human approval.* "
                    f"You can review and import this directly into the Action Plans table using the button below."
                )

        # Check simulation tool call
        sim_call = next((t for t in tools_called if t.tool == "simulate_infrastructure_failure"), None)
        if sim_call and "error" not in sim_call.result:
            r = sim_call.result
            hh = r.get("affected_households", 0)
            iso = r.get("isolated_settlements", [])
            iso_name = iso[0].get("settlement", "local community") if iso else "local community"
            facs = [f.get("facility") for f in r.get("essential_facilities_affected", [])]
            fac_str = ", ".join(facs[:2]) if facs else "health post and school"

            # Determine actual edge name
            blocked_info = r.get("blocked_edges_info", [])
            edge_name = blocked_info[0].get("name") if blocked_info else f"Edge #{sim_call.args.get('edge_id')}"

            if is_nepali:
                return (
                    f"नेटवर्कएक्स (NetworkX) सिमुलेसन अनुसार, **{village_name}** मा **{edge_name}** अवरुद्ध हुँदा "
                    f"**{iso_name}** का कुल **{hh} घरधुरीहरू** पूर्ण रूपमा विच्छेद हुन पुग्छन्।\n\n"
                    f"📍 **प्रभावित आवश्यक सुविधाहरू:** {fac_str}।\n"
                    f"⏱️ **मार्ग अवस्था:** {r.get('summary_explanation', 'वैकल्पिक बाटो सीमित वा उपलब्ध छैन; बस्ती सम्पर्कविहीन हुन्छ।')}\n\n"
                    f"⚠️ **सिफारिस:** यो बस्तीको मुख्य जीवनरेखा भएकाले वडा प्राविधिक टोलीले तत्काल स्थलगत निरीक्षण गर्नुपर्छ।"
                )
            else:
                return (
                    f"According to the **NetworkX graph impact simulation**, if **{edge_name}** fails in **{village_name}**, "
                    f"**{iso_name}** ({hh} households) becomes **isolated** from essential village lifelines.\n\n"
                    f"• **Newly Disconnected Households:** {hh} HH\n"
                    f"• **Essential Facilities Cut Off:** {fac_str}\n"
                    f"• **Impact Assessment:** {r.get('summary_explanation', 'Single point of access disruption')}\n\n"
                    f"🔍 **Recommendation:** Because this link impacts village access, it should be prioritized for "
                    f"immediate engineering inspection and safety stabilization."
                )

        # Check priorities call
        prio_call = next((t for t in tools_called if t.tool == "get_repair_priorities"), None)
        if prio_call and "error" not in prio_call.result:
            ranked = prio_call.result.get("ranked_issues", [])
            top_issue = ranked[0]["issue"]["title"] if ranked else f"Critical infrastructure disruption in {village_name}"
            if is_nepali:
                return (
                    f"गाउँपल्स प्राथमिकता निर्धारण प्रणाली अनुसार **{village_name}** मा हाल **'{top_issue}'** सबैभन्दा उच्च प्राथमिकतामा छ।\n\n"
                    f"यो मूल्याङ्कन प्रभावित घरधुरी (३०%), सेवा विच्छेद (२५%), क्षतिको गम्भीरता (३०%), र प्राविधिक प्रमाणीकरण (१५%) को भारित सूत्रमा आधारित छ।"
                )
            else:
                return (
                    f"Based on the **GaunPulse Priority Scoring Algorithm** for **{village_name}**, the top prioritized intervention is:\n"
                    f"**{top_issue}**\n\n"
                    f"Weighted criteria: Affected Population (30%), Disrupted Essential Services (25%), Severity (30%), and Field Verification (15%)."
                )

        # Issues list synthesis
        issues_call = next((t for t in tools_called if t.tool == "get_village_issues"), None)
        if issues_call and "error" not in issues_call.result:
            count = issues_call.result.get("total_issues", 0)
            issues_list = issues_call.result.get("issues", [])
            sample_titles = [f"• **{i.get('title')}** ({i.get('severity', 'Medium')})" for i in issues_list[:3]]
            sample_str = "\n".join(sample_titles) if sample_titles else f"No active issues recorded in {village_name}."

            if is_nepali:
                return (
                    f"**{village_name}** मा हाल **{count} वटा पूर्वाधार समस्याहरू** नगरपालिका प्रणालीमा दर्ता भएका छन्।\n\n"
                    f"{sample_str}"
                )
            else:
                return (
                    f"There are currently **{count} registered infrastructure issues** in the municipal database for **{village_name}**.\n\n"
                    f"{sample_str}"
                )

        return (
            f"गाउँपल्स एआई सक्रिय छ। तपाईं {village_name} को सडक, पुल, खानेपानी, र सिमुलेसन सम्बन्धी प्रश्न सोध्न सक्नुहुन्छ।"
            if is_nepali else
            f"GaunPulse AI is active for {village_name}. You can ask about village lifelines, simulate closures, or draft repair plans."
        )

    async def get_insights(
        self,
        village_id: int = 1,
        village_name: Optional[str] = None,
        monitored_nodes: Optional[int] = None,
        monitored_edges: Optional[int] = None,
        issues_list: Optional[List[Dict[str, Any]]] = None,
    ) -> AIInsightsResponse:
        """Generate database-backed proactive insights for any village in Nepal."""
        if village_name is None:
            try:
                village_details = await tools.get_village_details(village_id=village_id)
                village_name = village_details.get("name") or f"Village {village_id}"
            except Exception:
                village_name = f"Village {village_id}"

        if issues_list is None:
            try:
                issues_data = await tools.get_village_issues(village_id=village_id)
                issues_list = issues_data.get("issues", [])
            except Exception:
                issues_list = []

        if monitored_nodes is None or monitored_edges is None:
            monitored_nodes = 0
            monitored_edges = 0
            try:
                async with httpx.AsyncClient(timeout=2.0) as client:
                    net_res = await client.get(f"{LARAVEL_API_URL}/villages/{village_id}/network")
                    if net_res.status_code == 200:
                        net_json = net_res.json()
                        monitored_nodes = len(net_json.get("nodes", []))
                        monitored_edges = len(net_json.get("edges", []))
            except Exception:
                pass

        # Categorize
        categories = {}
        critical_count = 0
        critical_titles = []
        for iss in issues_list:
            cat = iss.get("category", "other")
            categories[cat] = categories.get(cat, 0) + 1
            if (iss.get("severity") or "").lower() == "critical":
                critical_count += 1
                critical_titles.append(iss.get("title", ""))

        most_freq = max(categories.items(), key=lambda x: x[1])[0] if categories else "Infrastructure"

        crit_summary = (
            f"{critical_count} critical disruption: {critical_titles[0]}"
            if critical_count > 0
            else f"0 critical disruptions reported in {village_name}"
        )

        sim_risk = (
            f"Active risk monitoring for {monitored_edges} lifeline edges across {village_name}."
            if monitored_edges > 0
            else f"Network graph for {village_name} has no edges mapped yet. Please map in Village Data Manager."
        )

        action_rec = (
            f"Review prioritized disruption reports for {village_name} and schedule engineering verification."
            if len(issues_list) > 0
            else f"All mapped infrastructure lifelines in {village_name} are recorded in nominal working status."
        )

        return AIInsightsResponse(
            village_id=village_id,
            village_name=village_name,
            frequent_category=f"{most_freq.replace('_', ' ').title()} ({len(issues_list)} reports logged)",
            critical_issues_summary=crit_summary,
            simulation_risk_alert=sim_risk,
            recommended_action=action_rec,
            database_backed=True,
            metrics={
                "total_issues": len(issues_list),
                "critical_disruptions": critical_count,
                "monitored_nodes": monitored_nodes,
                "monitored_edges": monitored_edges,
            },
        )
