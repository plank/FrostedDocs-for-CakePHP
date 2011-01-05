<?php
require 'config.php';
$url = '';

if(!empty($_GET['url'])):
	$url = $_GET['url'];
	$url = str_replace($app_domain, $cake_domain, $url);
endif;

$handle = fopen($url, 'r');
if($handle):
	while(!feof($handle)):
		$buffer = fgets($handle, 4096);
		echo $buffer;
	endwhile;
	fclose($handle);
endif;
?>