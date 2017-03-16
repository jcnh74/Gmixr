<?php

/*
@author Iain Mullan (@iainmullan)
@date 14/05/2014

Updated swap.php to add refresh token and changes Spotify have made with their api location etc.
In iOS app update your kTokenSwapServiceURL and kTokenRefreshServiceURL to call this script.
*/

//Change these details to match your own (these are from Spotify sample):
define('k_client_id', "8ddda79a38e74b2f9ba8c62d2280baac");
define('k_client_secret', "628394760c614723bd3e3de734449dbc");
define('k_client_callback_url', "gmixr://callback");

if (isset($_POST['code'])) {
	//Exchange authorization code for access token to access API
	$auth_code = $_POST['code'];
	$params = array(
		"grant_type" => "authorization_code",
		"client_id" => k_client_id,
		"client_secret" => k_client_secret,
		"redirect_uri" => k_client_callback_url,
		"code" => $auth_code		
	);
	
	$ch = curl_init("https://accounts.spotify.com/api/token"); 
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch,CURLOPT_POSTFIELDS, http_build_query($params));
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); 
	$response = curl_exec($ch); 
	curl_close($ch); 
	echo $response;		

} else if(isset($_POST['refresh_token'])) {
	//Renew expired access token from refresh token
	$refresh_token = $_POST['refresh_token'];
	$params = array(
		"grant_type" => "refresh_token",
		"client_id" => k_client_id,
		"client_secret" => k_client_secret,
		"refresh_token" => $refresh_token		
	);
	
	$ch = curl_init("https://accounts.spotify.com/api/token"); 
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch,CURLOPT_POSTFIELDS, http_build_query($params));
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); 
	$response = curl_exec($ch); 
	curl_close($ch); 
	echo $response;		
}

?>
