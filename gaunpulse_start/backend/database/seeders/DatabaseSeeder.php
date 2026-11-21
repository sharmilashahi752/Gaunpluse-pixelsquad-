<?php

namespace Database\Seeders;

use App\Models\Edge;
use App\Models\Facility;
use App\Models\Issue;
use App\Models\Node;
use App\Models\SettlementGroup;
use App\Models\User;
use App\Models\Village;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(['email'=>'admin@gaunpulse.test'],['name'=>'Asha Gurung','role'=>'admin','password'=>Hash::make(env('GAUNPULSE_ADMIN_PASSWORD','ChangeMe123!'))]);
        $village=Village::updateOrCreate(['name'=>'Sundar Khola Demo Village'],['municipality'=>'GaunPulse Demo Rural Municipality','district'=>'Kaski','province'=>'Gandaki','latitude'=>28.23860,'longitude'=>83.99465,'is_demo'=>true]);

        $nodeData=[
            ['Besi Settlement','settlement',28.23905,83.98975],['Seti Bridge West','junction',28.23900,83.99105],
            ['Chautara Junction','junction',28.23855,83.99415],['Danda Settlement','settlement',28.24110,83.99345],
            ['Khola Settlement','settlement',28.23665,83.99410],['Shree Jana School','school',28.23965,83.99635],
            ['Sundar Health Post','health_post',28.23785,83.99710],['Community Water Point','water_point',28.23620,83.99625],
            ['North Ridge Junction','junction',28.24115,83.99545],['South Trail Junction','junction',28.23575,83.99505],
        ];
        $nodes=[];
        foreach($nodeData as [$name,$type,$lat,$lng]) $nodes[] = Node::updateOrCreate(['village_id'=>$village->id,'name'=>$name],['type'=>$type,'latitude'=>$lat,'longitude'=>$lng]);

        $edgeData=[
            [0,1,'Seti Khola Strategic Bridge','bridge',0.18],[1,2,'Besi-Chautara Road','road',0.42],
            [3,2,'Danda Direct Road','road',0.31],[4,2,'Khola Main Road','road',0.28],
            [2,5,'School Access Road','road',0.24],[2,6,'Health Post Road','road',0.36],
            [2,7,'Water Point Trail','road',0.29],[3,8,'North Ridge Road','road',0.25],
            [8,2,'North Loop Connector','road',0.37],[4,9,'South Trail','road',0.22],
            [9,2,'South Loop Connector','road',0.41],
        ];
        $edges=[];
        foreach($edgeData as [$s,$t,$name,$type,$distance]) $edges[] = Edge::updateOrCreate(['village_id'=>$village->id,'name'=>$name],['source_node_id'=>$nodes[$s]->id,'target_node_id'=>$nodes[$t]->id,'type'=>$type,'status'=>'operational','distance'=>$distance]);

        SettlementGroup::updateOrCreate(['village_id'=>$village->id,'name'=>'Besi Tole'],['node_id'=>$nodes[0]->id,'estimated_population'=>265]);
        SettlementGroup::updateOrCreate(['village_id'=>$village->id,'name'=>'Danda Tole'],['node_id'=>$nodes[3]->id,'estimated_population'=>180]);
        SettlementGroup::updateOrCreate(['village_id'=>$village->id,'name'=>'Khola Tole'],['node_id'=>$nodes[4]->id,'estimated_population'=>145]);
        Facility::updateOrCreate(['village_id'=>$village->id,'name'=>'Shree Jana Basic School'],['node_id'=>$nodes[5]->id,'type'=>'school']);
        Facility::updateOrCreate(['village_id'=>$village->id,'name'=>'Sundar Community Health Post'],['node_id'=>$nodes[6]->id,'type'=>'health_post']);
        Facility::updateOrCreate(['village_id'=>$village->id,'name'=>'Khola Community Water Point'],['node_id'=>$nodes[7]->id,'type'=>'water_point']);

        $issues=[
            ['Cracks widening on Seti bridge deck','damaged_bridge','Residents observed widening cracks and loose side railings after last week’s rain.','critical','verified',$edges[0],28.23902,83.99040],
            ['Landslide debris on Danda road','damaged_road','A section of the direct road is narrowed by fresh landslide debris.','high','under_review',$edges[2],28.24010,83.99380],
            ['School access drain has collapsed','school_access','The roadside drain collapsed and makes the school approach difficult during rain.','medium','submitted',$edges[4],28.23920,83.99520],
            ['Low pressure at community tap','water_supply','Water pressure has remained very low for three mornings and queues are growing.','high','in_progress',$edges[6],28.23638,83.99600],
            ['Loose gravel near health post turn','health_post_access','Loose gravel is creating a slipping hazard near the health post approach.','medium','resolved',$edges[5],28.23815,83.99645],
        ];
        foreach($issues as [$title,$category,$description,$severity,$status,$edge,$lat,$lng]) Issue::updateOrCreate(['village_id'=>$village->id,'title'=>$title],['edge_id'=>$edge->id,'category'=>$category,'description'=>$description,'severity'=>$severity,'status'=>$status,'latitude'=>$lat,'longitude'=>$lng]);
    }
}
