<?php
require 'config.php';

$handle = fopen($cake_domain, 'r');
if($handle):
	while(!feof($handle)):
		$buffer = fgets($handle, 4096);
		echo $buffer;
	endwhile;
	fclose($handle);
endif;
?>