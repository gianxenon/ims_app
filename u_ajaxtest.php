<?php
 

include_once("../common/classes/connection.php");
include_once("../common/classes/recordset.php");

$_SESSION['branch'] =  "NPULCS";
$_SESSION['company'] = "ICS";

if (!empty($_POST)) extract($_POST);
if (!empty($_GET)) extract($_GET);

$httpVars = array_merge($_POST, $_GET);
include_once("../common/classes/connection.php");
include_once("../common/classes/recordset.php");
include_once("../common/classes/grid.php");    

include_once("../common/utility/utilities.php");
include_once("./utils/login.php");
include_once("./classes/masterdataschema_br.php");
include_once("./classes/documentlinesschema_br.php");
include_once("./classes/documentschema_br.php");

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"); 


$actionReturn = true;

// Set date
if (substr($_SERVER['REMOTE_ADDR'],0,11)=="192.168.254" || $_SERVER['REMOTE_ADDR']=="127.0.0.1") {
    $date = "2018-06-21";
} else {
    $date = date('Y-m-d');
}	
$datefr = getMonthStartDB($date);
$dateto = getMonthEndDB($date);

 
$input = json_decode(file_get_contents("php://input"), true);
$type = $input["type"]   ;

 
switch ($type) {
    case "CheckConnection":
		$objs["connection"] = array();
		array_push($objs["connection"],array("status"=>$input));
		echo json_encode($objs);
    break;
 
	case "fetchitems":
		$objRs = new recordset(NULL, $objConnection);

		$company      = isset($input["company"]) ? trim($input["company"]) : $_SESSION["company"];
		$branch       = isset($input["branch"]) ? trim($input["branch"]) : $_SESSION["branch"];

		$company = addslashes($company);
		$branch  = addslashes($branch);

		$sql = "CALL ics.sp_fetchitems('$company','$branch')";
		$objRs->queryopen($sql); 
		$rows = array();
		while ($objRs->queryfetchrow("NAME")) {
			$rows[] = array(
				"code" => isset($objRs->fields["code"]) ? $objRs->fields["code"] : (isset($objRs->fields["CODE"]) ? $objRs->fields["CODE"] : ""),
				"name" => isset($objRs->fields["name"]) ? $objRs->fields["name"] : (isset($objRs->fields["NAME"]) ? $objRs->fields["NAME"] : "")
			);
		}

		echo json_encode($rows);
    break;

	case "fetchcustomers":
		$objRs = new recordset(NULL, $objConnection);

		$company = isset($input["company"]) ? trim($input["company"]) : "";
		$branch  = isset($input["branch"]) ? trim($input["branch"]) : "";

		$company = addslashes($company);
		$branch  = addslashes($branch);

		$sql = "CALL ics.sp_fetchcustomers('{$company}','{$branch}')";
		$objRs->queryopen($sql);

		$rows = array();
		while ($objRs->queryfetchrow("NAME")) {
			$rows[] = array(
				"CUSTNO"    => isset($objRs->fields["CUSTNO"]) ? $objRs->fields["CUSTNO"] : "",
				"CUSTNAME"  => isset($objRs->fields["CUSTNAME"]) ? $objRs->fields["CUSTNAME"] : "",
				"CUSTGROUP" => isset($objRs->fields["CUSTGROUP"]) ? $objRs->fields["CUSTGROUP"] : "",
				"GROUPNAME" => isset($objRs->fields["GROUPNAME"]) ? $objRs->fields["GROUPNAME"] : ""
			);
		}

		echo json_encode($rows);
    break;

	case "getbranches":
		$objRs = new recordset(NULL, $objConnection);

		$userid = isset($input["userid"]) ? trim($input["userid"]) : "";
		$userid = addslashes($userid);

		$sql = "CALL ics.sp_getbranches('{$userid}')";
		// or query directly with WHERE userbranches.userid = '{$userid}'

		$objRs->queryopen($sql);

		$rows = array();
		while ($objRs->queryfetchrow("NAME")) {
			$rows[] = array(
				"COMPANYCODE" => $objRs->fields["COMPANYCODE"],
				"BRANCHCODE"  => $objRs->fields["BRANCHCODE"],
				"BRANCHNAME"  => $objRs->fields["BRANCHNAME"]
			);
		}

		echo json_encode($rows);
    break; 
	case "fetchprofile":
		$token = isset($input["token"]) ? trim($input["token"]) : "";
		if ($token == "") {
			echo json_encode(array("error" => "Missing token"));
			break;
		} 
		$userid = "gbgindoy";
		$userid = addslashes($userid);

		$objRs = new recordset(NULL, $objConnection);
		$sql = "CALL ics.sp_getuserprofile('{$userid}')";
		$objRs->queryopen($sql);

		if ($objRs->queryfetchrow("NAME")) {
			$response = array(
				"user" => array(
					"USERID"   => $objRs->fields["USERID"],
					"USERNAME" => $objRs->fields["USERNAME"],
					"GROUPID"  => $objRs->fields["GROUPID"],
					"ROLEID"   => $objRs->fields["ROLEID"],
					"ISVALID"  => $objRs->fields["ISVALID"],
					"LOCKOUT"  => $objRs->fields["LOCKOUT"],
					"EMAIL"    => $objRs->fields["EMAIL"],
					"MOBILENO" => $objRs->fields["MOBILENO"] 
				)
			);
			echo json_encode($response);
		} else {
			echo json_encode(array("error" => "User not found"));
		}
    break; 
	case "fetchorders":
		$objRs = new recordset(NULL,$objConnection);
		$objRs2 = new recordset(NULL,$objConnection);
		$obju_CSPicknPacks = new documentlinesschema_br(null,$objConnection,"u_cssatwitems"); 
		$objRs->queryopen("select a.u_custname as customerGroup ,a.u_shipto as shipto,a.u_date as  orderDate ,a.docid as docid , a.docno as docno , a.u_date as deliveryDate , a.docstatus as docStatus from u_cssatws a where a.branch = 'npulcs'  ");
		$orders = array(); 
		while($objRs->queryfetchrow("NAME")) { 
			$orderObj = array(
				"customerGroup" => $objRs->fields["customerGroup"],
				"shipTo" => $objRs->fields["shipto"],
				"orderDate" => $objRs->fields["orderDate"],
				"docid" => (int)$objRs->fields["docid"],
				"docno" => $objRs->fields["docno"],
				"docDate" => $objRs->fields["orderDate"],
				"deliveryDate" => $objRs->fields["deliveryDate"]  ,
				"docStatus" => $objRs->fields["docStatus"],
				"items" => array()
			);

			// add item
			$objRs2->queryopen("select b.lineid as lineId ,b.u_itemno as itemCode , b.u_itemname as description,b.u_quantity as qty,b.u_weight as wt ,c.u_numperuom as numperuom , c.u_uom  as uom , b.u_linestatus as lineStatus from u_cssatwitems b  inner join u_cssitems c on c.code = b.u_itemno and c.branch =b.BRANCH  and b.branch =c.branch where b.branch = 'npulcs' and b.docid = ".$objRs->fields["docid"]." order by b.LINEID ");
			while($objRs2->queryfetchrow("NAME")) { 
				$orderObj["items"][] = array(
				"lineId" => (int)$objRs2->fields["lineId"],
				"docid" => (int)$objRs2->fields["docid"],
				"itemCode" => $objRs2->fields["itemCode"],
				"description" => $objRs2->fields["description"],
				"qty" => (float)$objRs2->fields["qty"],
				"numperuom" => (float)$objRs2->fields["numperuom"],
				"wt" => (float)$objRs2->fields["wt"],
				"uom" => $objRs2->fields["uom"] ,
				"lineStatus" => $objRs2->fields["lineStatus"]); 
			}
			if ($orderObj !== null) {
					$orders[] = $orderObj;
			}  
		} 
    	//Return plain array for Zod schema
   	 	echo json_encode($orders);
    break; 
	case "fetchroomsummary":
			$objRs = new recordset(NULL, $objConnection);

			$company = isset($input["company"]) ? trim($input["company"]) : "ics";
			$branch  = isset($input["branch"]) ? trim($input["branch"]) : "npulcs";

			$company = addslashes($company);
			$branch  = addslashes($branch);

			// Call stored procedure instead of embedding long SQL
			$sql = "CALL ics.sp_getroomsummary('{$company}','{$branch}')";
			$objRs->queryopen($sql);

			$rows = array();
			while ($objRs->queryfetchrow("NAME")) {
				$rows[] = array(
					"RoomCode" => $objRs->fields["RoomCode"],
					"BarcodeTotalQty" => (float)$objRs->fields["BarcodeTotalQty"], 
					"TotalPalletCount" => (float)$objRs->fields["TotalPalletCount"],
					"TotalPalletUsedQty" => (float)$objRs->fields["TotalPalletUsedQty"],
					"TotalWeight" => (float)$objRs->fields["TotalWeight"],
					"TotalHeadPacks" => (float)$objRs->fields["TotalHeadPacks"]
				);
			}

			echo json_encode($rows);
	break;
	case "fetchinventorytable":
			$objRs = new recordset(NULL, $objConnection);

			$company      = isset($input["company"]) ? trim($input["company"]) : $_SESSION["company"];
			$branch       = isset($input["branch"]) ? trim($input["branch"]) : $_SESSION["branch"];
			$showdetails  = isset($input["showdetails"]) ? (int)$input["showdetails"] : 0;
			$withpendings = isset($input["withpendings"]) ? (int)$input["withpendings"] : 1;

			$batch        = isset($input["batch"]) ? trim($input["batch"]) : "";
			$tagno        = isset($input["tagno"]) ? trim($input["tagno"]) : "";
			$location     = isset($input["location"]) ? trim($input["location"]) : "";
			$receivedtype = isset($input["receivedtype"]) ? trim($input["receivedtype"]) : "";
			$custno       = isset($input["custno"]) ? trim($input["custno"]) : "";
			$itemno       = isset($input["itemno"]) ? trim($input["itemno"]) : "";
			$prd_from     = isset($input["prd_from"]) ? trim($input["prd_from"]) : "";
			$prd_to       = isset($input["prd_to"]) ? trim($input["prd_to"]) : "";
			$exp_from     = isset($input["exp_from"]) ? trim($input["exp_from"]) : "";
			$exp_to       = isset($input["exp_to"]) ? trim($input["exp_to"]) : "";
			$rec_from     = isset($input["rec_from"]) ? trim($input["rec_from"]) : "";
			$rec_to       = isset($input["rec_to"]) ? trim($input["rec_to"]) : "";

			$company      = addslashes($company);
			$branch       = addslashes($branch);
			$batch        = addslashes($batch);
			$tagno        = addslashes($tagno);
			$location     = addslashes($location);
			$receivedtype = addslashes($receivedtype);
			$custno       = addslashes($custno);
			$itemno       = addslashes($itemno);

			$prd_from_sql = ($prd_from !== "") ? "'" . addslashes($prd_from) . "'" : "NULL";
			$prd_to_sql   = ($prd_to !== "")   ? "'" . addslashes($prd_to) . "'"   : "NULL";
			$exp_from_sql = ($exp_from !== "") ? "'" . addslashes($exp_from) . "'" : "NULL";
			$exp_to_sql   = ($exp_to !== "")   ? "'" . addslashes($exp_to) . "'"   : "NULL";
			$rec_from_sql = ($rec_from !== "") ? "'" . addslashes($rec_from) . "'" : "NULL";
			$rec_to_sql   = ($rec_to !== "")   ? "'" . addslashes($rec_to) . "'"   : "NULL";

			$sql = "CALL ics.sp_inventory_table(
				'{$company}',
				'{$branch}',
				{$showdetails},
				{$withpendings},
				'{$batch}',
				'{$tagno}',
				'{$location}',
				'{$receivedtype}',
				'{$custno}',
				'{$itemno}',
				{$prd_from_sql},
				{$prd_to_sql},
				{$exp_from_sql},
				{$exp_to_sql},
				{$rec_from_sql},
				{$rec_to_sql}
			)";

			$objRs->queryopen($sql);

			$rows = array();
			while ($objRs->queryfetchrow("NAME")) {
				$rows[] = array(
					"U_RECDATE"      => $objRs->fields["U_RECDATE"],
					"U_CUSTNO"       => $objRs->fields["U_CUSTNO"],
					"U_CUSTNAME"     => $objRs->fields["U_CUSTNAME"],
					"U_RECEIVEDTYPE" => $objRs->fields["U_RECEIVEDTYPE"],
					"U_ITEMNO"       => $objRs->fields["U_ITEMNO"],
					"U_ITEMNAME"     => $objRs->fields["U_ITEMNAME"],
					"U_BATCH"        => $objRs->fields["U_BATCH"],
					"U_TAGNO"        => $objRs->fields["U_TAGNO"],   // important for BARCODE
					"U_LOCATION"     => $objRs->fields["U_LOCATION"],
					"U_QUANTITY"     => $objRs->fields["U_QUANTITY"],
					"TOTALQUANTITY"  => $objRs->fields["TOTALQUANTITY"],
					"U_WEIGHT"       => $objRs->fields["U_WEIGHT"],
					"U_NUMPERHEADS"  => $objRs->fields["U_NUMPERHEADS"],
					"U_TOTALNUMPERHEADS"  => $objRs->fields["U_NUMPERHEADS"],
					"TOTALWEIGHT"    => $objRs->fields["TOTALWEIGHT"],
					"U_UOM"          => $objRs->fields["U_UOM"],
					"PD"  => $objRs->fields["PD"],
					"CU"  => $objRs->fields["CU"],
					"expiry_status"  => $objRs->fields["expiry_status"],
					
				);
			}

			echo json_encode($rows);
	break; 
	//Validations
	case "receivingvalidate":
		$objRs = new recordset(NULL, $objConnection);
		$objRs2 = new recordset(NULL, $objConnection);

		$company = isset($input["company"]) ? trim($input["company"]) : "";
		$branch  = isset($input["branch"]) ? trim($input["branch"]) : "";
		$docid   = isset($input["docid"]) ? trim($input["docid"]) : "";

		$company = addslashes($company);
		$branch  = addslashes($branch);
		$docid   = ($docid === "") ? "NULL" : intval($docid);

		$lines = isset($input["lines"]) && is_array($input["lines"]) ? $input["lines"] : array();

		$errors = array();

		foreach ($lines as $idx => $line) {
			$batch    = isset($line["u_batch"]) ? trim($line["u_batch"]) : "";
			$location = isset($line["u_location"]) ? trim($line["u_location"]) : "";
			$tagno    = isset($line["u_tagno"]) ? trim($line["u_tagno"]) : "";

			$batch    = addslashes($batch);
			$location = addslashes($location);
			$tagno    = addslashes($tagno);

			$sql = "CALL ics.sp_receiving_validate_line('{$company}','{$branch}','{$batch}','{$location}','{$tagno}',{$docid})";
			$objRs->queryopen($sql);

			while ($objRs->queryfetchrow("NAME")) {
				$errors[] = array(
					"lineNo" => $idx + 1,
					"field" => isset($objRs->fields["field_name"]) ? $objRs->fields["field_name"] : "",
					"code" => isset($objRs->fields["error_code"]) ? $objRs->fields["error_code"] : "",
					"message" => isset($objRs->fields["error_message"]) ? $objRs->fields["error_message"] : ""
				);
			}
		}

		echo json_encode(array(
			"ok" => count($errors) === 0,
			"errors" => $errors
		));
    break; 
	
	case "fetchlocations":
		$objRs = new recordset(NULL, $objConnection);

		$company = isset($input["company"]) ? trim($input["company"]) : "";
		$branch  = isset($input["branch"]) ? trim($input["branch"]) : "";

		$company = addslashes($company);
		$branch  = addslashes($branch);

		$sql = "CALL ics.sp_fetchlocations('{$company}','{$branch}')";
		$objRs->queryopen($sql);

		$rows = array();
		while ($objRs->queryfetchrow("NAME")) {
			$rows[] = array(
				"CODE" => isset($objRs->fields["CODE"]) ? $objRs->fields["CODE"] : $objRs->fields["code"]
			);
		}

		echo json_encode($rows);
	break;
	case "fetchpalletaddresses":
		$objRs = new recordset(NULL, $objConnection);

		$company = isset($input["company"]) ? trim($input["company"]) : "";
		$branch  = isset($input["branch"]) ? trim($input["branch"]) : "";

		$company = addslashes($company);
		$branch  = addslashes($branch);

		$sql = "CALL ics.sp_fetchpalletaddresses('{$company}','{$branch}')";
		$objRs->queryopen($sql);

		$rows = array();
		while ($objRs->queryfetchrow("NAME")) {
			$rows[] = array(
				"CODE" => isset($objRs->fields["CODE"]) ? $objRs->fields["CODE"] : $objRs->fields["code"]
			);
		}

		echo json_encode($rows);
	break;

	case "validatelocation":
		$objRs = new recordset(NULL, $objConnection);

		$company  = isset($input["company"]) ? trim($input["company"]) : "";
		$branch   = isset($input["branch"]) ? trim($input["branch"]) : "";
		$location = isset($input["location"]) ? trim($input["location"]) : "";

		$company  = addslashes($company);
		$branch   = addslashes($branch);
		$location = addslashes($location);

		if ($company == "" || $branch == "" || $location == "") {
			echo json_encode(array(
				"valid" => false,
				"exists" => false,
				"isOccupied" => false,
				"message" => "Missing company, branch, or location."
			));
			break;
		}

		$sql = "CALL ics.sp_validate_location('{$company}','{$branch}','{$location}')";
		$objRs->queryopen($sql);

		$valid = 0;
		$exists = 0;
		$isOccupied = 0;
		$message = "Invalid location validation response.";

		if ($objRs->queryfetchrow("NAME")) {
			$valid      = isset($objRs->fields["valid"]) ? (int)$objRs->fields["valid"] : (int)$objRs->fields["VALID"];
			$exists     = isset($objRs->fields["exists"]) ? (int)$objRs->fields["exists"] : (int)$objRs->fields["EXISTS"];
			$isOccupied = isset($objRs->fields["isOccupied"]) ? (int)$objRs->fields["isOccupied"] : (int)$objRs->fields["ISOCCUPIED"];
			$message    = isset($objRs->fields["message"]) ? $objRs->fields["message"] : $objRs->fields["MESSAGE"];
		}

		echo json_encode(array(
			"valid" => $valid == 1,
			"exists" => $exists == 1,
			"isOccupied" => $isOccupied == 1,
			"message" => $message
		));
	break;


	default:
    	$actionReturn = raiseError("Invalid Type [$type].");
    break;	
}
