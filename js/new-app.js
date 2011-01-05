/*
*	Useful Variables
*	================
*	Used as configs, flags, and an array to store our menu
*/
var CONFIG = {
	cake_url:   'http://book.cakephp.org',
	local_url:  'http://localhost'
};

var FLAGS = {
	ajax_complete: false,
	menu_loaded: false,
	started: false
};

var ajaxQueue = $({});

var MENU = [];



/*
*	Application Code
*	================
*	The actual application code starts here
*/
$(document).ready(function() {
	
	$('#start').click(function(e) {
		
		populate_menu();

		return false;
	});
	
	$('#pause').click(function(e) {
		ajaxQueue.stop();
		return false;
	});
	
});


/*
*	Logic Code
*	==========
*	Various code called from the application code
*/
var populate_menu = function(node) {
	
	$('#debug').html( dump(MENU) );
	
	
	// If we were not provided with a node argument
	if(!node) {
	
		// retrieve the parent links
		if(MENU.length == 0) {
			$.ajaxQueue({
				url: 'load.php?url='+CONFIG['cake_url'],
				data: null,
				type: 'GET',
				success: function(data) {
					var parent_links = $(data).find('#toc ul a');
					console.log(data);
					$.each(parent_links, function(index, item) {
						var fixed_url = item['href'].replace(CONFIG['local_url'], CONFIG['cake_url']);
						var node = {title: item['text'], href: fixed_url, scanned: false, children: [] };
						MENU.push(node);
					
					});
					var parent_items = jQuery.extend(true, {}, MENU);
					console.log(parent_items, 'parent links');
				}
			});
		}
	
		// recurisvly process the child links
		else {
			$.each(MENU, function(index, item) {
				$.ajaxQueue({
					url: 'load.php?url='+item['href'],
					data: null,
					type: 'GET',
					success: function(data) {
						var child_links = $(data).find('#toc a.selected').next('ul').children('li').children('a');
						$.each(child_links, function(index, child_link) {
							console.log(item, 'child');
							var fixed_url = child_link['href'].replace(CONFIG['local_url'], CONFIG['cake_url']);
							var child_node = {title: child_link['text'], href: fixed_url, scanned: false, children: [] };
							console.log(child_node, child_node['title']);
							item['children'].push(child_node);
							populate_menu(child_node); // starts the recursive deepth search...
						});
					}
				});
			});
		}
	
		generate_menu();
	
	}
	
	// If we were supplied with a node argument
	else{
		$.ajaxQueue({
			url: 'load.php?url='+node['href'],
			data: null,
			type: 'GET',
			success: function(data) {

				var child_links = $(data).find('#toc a.selected').next('ul').children('li').children('a');

				// if this node has childern
				if( child_links.length != 0 ) {
					// recursively process the nodes
					$.each(child_links, function(index, item) {
						var fixed_url = item['href'].replace(CONFIG['local_url'], CONFIG['cake_url']);
						var child_node = {title: item['text'], href: fixed_url, scanned: false, children: [] };
						console.log(child_node, child_node['title']);
						node['children'].push(child_node);
						populate_menu(child_node);
					});

				}
				else {
					// move down to the next node
				}

			}
		});
	}
	
};

var generate_menu = function() {
	var output = [];
	$.each(MENU, function(index, menu_item) {
		output.push(paint_menu(menu_item));
	});
	$('#nav').html( output.join('') );
};

var paint_menu = function(item, recursive) {

	var output = [];

	if(recursive) {
		output.push('<li>');
	}
	
	output.push("<ul>");
	
	output.push("<li>"+item['title']+"</li>");
	
	if(item.children.length > 0) {
		$.each(item.children, function(index, child_item) {
			output.push(paint_menu(child_item, true));
		});
	}
	
	output.push("</ul>");

	if(recursive) {
		output.push('</li>');
	}
	
	return output.join('');
	
};

$.ajaxQueue = function(ajaxOpts) {
    // hold the original complete function
    var oldComplete = ajaxOpts.complete;

    // queue our ajax request
    ajaxQueue.queue(function(next) {

      // create a complete callback to fire the next event in the queue
      ajaxOpts.complete = function() {
        // fire the original complete if it was there
        if (oldComplete) oldComplete.apply(this, arguments);

        next(); // run the next query in the queue
      };

      // run the query
      $.ajax(ajaxOpts);
    });
  };