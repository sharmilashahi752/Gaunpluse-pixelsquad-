<?php
namespace App\Services;
use App\Models\Issue;
use App\Models\PriorityScore;
use App\Models\Simulation;
class PriorityScoringService
{
    public const WEIGHTS = ['severity'=>0.30,'population'=>0.30,'service'=>0.25,'verification'=>0.15];
    public function score(Issue $issue, ?Simulation $simulation = null): PriorityScore
    {
        $severity = ['low'=>25,'medium'=>50,'high'=>75,'critical'=>100][$issue->severity] ?? 0;
        $verification = ['submitted'=>20,'under_review'=>40,'verified'=>100,'in_progress'=>100,'resolved'=>100,'rejected'=>0][$issue->status] ?? 0;
        $result = $simulation?->result;
        $population = isset($result['affected_population']) ? min(100, round($result['affected_population'] / 10, 2)) : null;
        $serviceCount = $result ? array_sum($result['newly_unreachable_by_service'] ?? []) : null;
        $service = $serviceCount === null ? null : min(100, $serviceCount * 35);
        $complete = $population !== null && $service !== null;
        $total = $complete ? round($severity*.30 + $population*.30 + $service*.25 + $verification*.15, 2) : null;
        $explanation = $complete
            ? "Illustrative score: severity {$severity}, population impact {$population}, service disruption {$service}, verification confidence {$verification}."
            : 'Incomplete evidence: run an impact simulation with documented population data before calculating a total score.';
        return PriorityScore::updateOrCreate(
            ['issue_id'=>$issue->id],
            ['simulation_id'=>$simulation?->id,'severity_score'=>$severity,'population_score'=>$population,'service_score'=>$service,'verification_score'=>$verification,'total_score'=>$total,'explanation'=>$explanation]
        );
    }
    public function label(?float $score): string
    {
        if ($score === null) return 'Incomplete evidence';
        return $score >= 80 ? 'Critical' : ($score >= 60 ? 'High' : ($score >= 40 ? 'Medium' : 'Low'));
    }
}
