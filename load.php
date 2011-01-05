<?php
require 'simple_html_dom.php';
if(!empty($_GET['url'])) {
	$url = $_GET['url'];
	
	$html = file_get_html($url);
	$menu = $html->find('#side', 0);
	echo($menu);
	// $handle = fopen($url, 'r');
	// if($handle):
	// 	while(!feof($handle)):
	// 		$buffer = fgets($handle, 4096);
	// 		echo $buffer;
	// 	endwhile;
	// 	fclose($handle);
	// endif;
}
?>