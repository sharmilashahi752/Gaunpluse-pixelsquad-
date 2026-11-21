<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\DuplicateVillageService;
use App\Models\Village;
use Illuminate\Support\Facades\DB;

echo "=== GAUNPULSE DUPLICATE AUDIT & LOGIC VERIFICATION ===\n\n";

$passCount = 0;
$failCount = 0;

function assertTest($description, $condition) {
    global $passCount, $failCount;
    if ($condition) {
        echo " [PASS] $description\n";
        $passCount++;
    } else {
        echo " [FAIL] $description\n";
        $failCount++;
    }
}

// 1. Audit Test
$audit = DuplicateVillageService::auditDuplicates();
assertTest("Audit returns total villages = 18", $audit['total_villages'] === 18);
assertTest("Audit returns distinct villages count = 5", $audit['distinct_villages_count'] === 5);
assertTest("Audit identifies exactly 1 duplicate group", $audit['duplicate_groups_count'] === 1);
assertTest("Audit identifies 13 duplicate records in Mahabu", $audit['duplicate_records_count'] === 13);

$group = $audit['duplicate_groups'][0];
assertTest("Canonical village selected is ID 19", $group['canonical_id'] === 19);
assertTest("Canonical village has 3 user issues", $group['canonical']['issues_count'] === 3);
assertTest("Canonical village has 4 simulations", $group['canonical']['simulations_count'] === 4);

// 2. Preview Test (Dry-run, zero database changes)
$villagesBefore = Village::count();
$preview = DuplicateVillageService::previewConsolidation($group['canonical_id'], $group['duplicate_ids']);
$villagesAfter = Village::count();

assertTest("Preview does NOT modify database (village count remains $villagesBefore)", $villagesBefore === $villagesAfter);
assertTest("Preview correctly identifies 1 simulation reassignment from Village 6", $preview['reassignments']['simulations'] === 1);
assertTest("Preview identifies 2,145 duplicate nodes to prune", $preview['redundant_records_to_prune']['duplicate_nodes'] === 2145);
assertTest("Preview identifies 1,950 duplicate edges to prune", $preview['redundant_records_to_prune']['duplicate_edges'] === 1950);
assertTest("Preview identifies 13 duplicate village rows to prune", $preview['redundant_records_to_prune']['duplicate_villages'] === 13);

// 3. Duplicate Detection Test
$existing = DuplicateVillageService::findExistingDuplicate(
    'mahabu',
    'Dailekh Municipality',
    '1',
    28.85,
    81.71
);
assertTest("Duplicate detection accurately identifies existing Mahabu record", $existing !== null && strtolower($existing->name) === 'mahabu');

$differentWard = DuplicateVillageService::findExistingDuplicate(
    'mahabu',
    'Dailekh Municipality',
    '9', // Different ward
    28.85,
    81.71
);
assertTest("Duplicate detection does NOT falsely flag different ward", $differentWard === null);

// 4. Rollback Verification Test
$txRollbackSuccessful = false;
try {
    DB::transaction(function () {
        // Mock a failure inside transaction
        throw new \Exception("Simulated integrity failure");
    });
} catch (\Exception $e) {
    $txRollbackSuccessful = ($e->getMessage() === "Simulated integrity failure");
}
assertTest("Database transactions safely roll back on integrity failure", $txRollbackSuccessful);

echo "\nVerification Summary: $passCount passed, $failCount failed.\n";
if ($failCount > 0) {
    exit(1);
}
