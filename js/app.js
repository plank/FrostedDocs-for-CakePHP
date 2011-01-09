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
var currentRequest = false;

var MENU = [];
var PAGES = {};


/*
*	Application Code
*	================
*	The actual application code starts here
*/
$(document).ready(function() {
	
	// INIT
	if(localStorage.getItem('menu')) {
		MENU = JSON.parse(localStorage.getItem('menu'));
		paint_menu();
	}
	
	// $('body').css('height', $(window).height());
	
	// CLICK EVENTS
	$('#start').click(function(e) {
		localStorage.removeItem('menu');
		$('#nav').empty();
		MENU = [];
		populate_menu();
		return false;
	});
	
	$('#pause').click(function(e) {
		ajaxQueue.clearQueue();
		currentRequest.abort();
		return false;
	});
	
	$('#save').click(function() {
		localStorage.setItem('menu', JSON.stringify(MENU));
		return false;
	});
	
	$('#load').click(function() {
		$.getJSON('menu.json', {}, function(data) {
			localStorage.setItem('menu', JSON.stringify(data));
			MENU = JSON.parse(localStorage.getItem('menu'));
			paint_menu();
		});
		
		return false;
	});
	
	$('#clear').click(function() {
		localStorage.clear();
		$('#nav').empty();
		MENU = [];
		return false;
	});
	
	$('#nav a, #search-results a').live('click', function() {
		
		var this_href = this.href;
		
		$('.current').removeClass('current');
		
		var parents = $(this).parents('li').each(function() {
			$(this).addClass('current');
		});
		
		$(this).next('ul.child').slideDown(100).addClass('open');
		
		$("#nav li:not(.current) ul").slideUp(100);
		
		
		if(!localStorage.getItem(this_href)) {
			$('#nav a.current').removeClass('current');
			$(this).addClass('current');
			$.ajax({
				url: 'load.php?url='+this.href,
				data: null,
				type: 'GET',
				beforeSend: function() {
					$('#nav a.current').append(" <span class='loading'> - loading...</span>");
				},
				success: function(data) {
					$('#nav a.current').find("span").remove();
					$('#doc').html(data);
					var images = $('#doc').find('img');
					$.each(images, function(index, image) {
						var src = image.src;
						var new_src = src.replace(CONFIG['local_url'], CONFIG['cake_url']);
						image.src = new_src; //'http://book.cakephp.org'+image.src;
					});
					localStorage.setItem(this_href, data);
				}
			});
		}
		else{
			$('#nav a.current').removeClass('current');
			$(this).addClass('current');
			$('#doc').html(localStorage.getItem(this_href));
			var images = $('#doc').find('img');
			$.each(images, function(index, image) {
				var src = image.src;
				var new_src = src.replace(CONFIG['local_url'], CONFIG['cake_url']);
				image.src = new_src; //'http://book.cakephp.org'+image.src;
			});
		}
		return false;
	});
	
	// SEARCH EVENTS
	$('#search').keyup(function() {
		if( $(this).val() == '' ) {
			$('#search-results').fadeOut(150, function() {
				$(this).empty();
				$('#nav').fadeIn(150);
			});			
		}
		else {
			$('#nav').fadeOut(150);
			$('#search-results').show();
			search_menu( $(this).val() );
		}		
	});
	
	$(document).keyup(function(e) {
		
		console.log(e);
		
		// escape key
		if(e.keyCode == 27) {
			if( $('#search').is(':focus') ) {
				$('#search').val('').trigger('keyup');				
			}
		}
		
	});
	
});

// AJAX spinner
$(document).ajaxSend(function() {
    $('#loader').fadeIn(100);
});
$(document).ajaxStop(function() {
    $('#loader').fadeOut(50);
});

/*
*	Logic Code
*	==========
*	Various code called from the application code
*/
var populate_menu = function(node) {
	
	paint_menu();
	
	// If we were not provided with a node argument
	if(!node) {
	
		// retrieve the parent links
		if(MENU.length == 0) {
			$.ajaxQueue({
				url: 'load.php?menu=1&url='+CONFIG['cake_url'],
				data: null,
				type: 'GET',
				success: function(data) {
					var parent_links = $(data).find('#toc ul a');
					$.each(parent_links, function(index, item) {
						var fixed_url = item['href'].replace(CONFIG['local_url'], CONFIG['cake_url']);
						var node = {title: item['text'], href: fixed_url, scanned: false, children: []};
						MENU.push(node);
					});
					populate_menu();
				}
			});
		}
	
		// recurisvly process the child links
		else {
			$.each(MENU, function(index, item) {
				$.ajaxQueue({
					url: 'load.php?menu=1&url='+item['href'],
					data: null,
					type: 'GET',
					success: function(data) {
						var child_links = $(data).find('#toc a.selected').next('ul').children('li').children('a');
						$.each(child_links, function(index, child_link) {
							var fixed_url = child_link['href'].replace(CONFIG['local_url'], CONFIG['cake_url']);
							var child_node = {title: child_link['text'], href: fixed_url, scanned: false, children: []};
							item['children'].push(child_node);
							populate_menu(child_node); // starts the recursive deepth search...
						});
					}
				});
			});
		}
	
	}
	
	// If we were supplied with a node argument
	else{
		$.ajaxQueue({
			url: 'load.php?menu=1&url='+node['href'],
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
						node['children'].push(child_node);
						populate_menu(child_node);
					});

				}
			}
		});
	}
	
	paint_menu();
	
};

var search_menu = function(query) {
	$('#search-results').empty();
	var nodes = $('#nav a').clone();
	var matches = [];
	$.each(nodes, function(index, item) {
		var scored_node = { 
			score: item.text.toLowerCase().score(query.toLowerCase()),
			node: item };	
		matches.push(scored_node);
	});
	matches.sort(compare_scores);
	results = matches.slice(0,10);
	$.each(results, function(index, item) {
		if(item.score > 0) {
			$('#search-results').append("<li><a href='"+item.node.href+"'>"+item.node.text+"</a></li>");
		}
	});	
}

var compare_scores = function(a,b) {
	return b.score - a.score;
}

var paint_menu = function() {
	var output = [];
	$.each(MENU, function(index, item) {
		output.push(generate_menu(item));
	});
	$('#nav').html( output.join('') );
};

var generate_menu = function(item, last_item) {
			
	var output = []; // output buffer
	var child_count = item['children'].length - 1;
	
	output.push("<li><a href='"+item['href']+"'>"+item['title']+"</a>");
	if(child_count > 0) {
		output.push("<ul style='display: none;' class='child'>");
		$.each(item['children'], function(index, child_item) {
			if(index == child_count) {
				output.push( generate_menu(child_item, true) );
			}
			else {
				output.push( generate_menu(child_item))
			}	
		});
		output.push("</ul>");
	}
	else{
		// if(last_item) {
		// 			output.push("</ul>");
		// 		}
		output.push("</li>");
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
      currentRequest = $.ajax(ajaxOpts);
    });
  };