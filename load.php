<?php

require 'simple_html_dom.php';

if(!empty($_GET['url'])) {
	
	$url = $_GET['url'];
	$html = file_get_html($url);
	
	if(!empty($_GET['menu'])) {
		$output = $html->find('#side', 0);
	}
	else{
		$output = $html->find('#body .view', 0);
	}
	
	echo($output);
	
}
?>