(function($) {
  // jQuery on an empty object, we are going to use this as our Queue
  var ajaxQueue = $({});

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

})(jQuery);

var config = {
	cake_domain: 'http://book.cakephp.org',
	local_domain: 'http://localhost'
};

var navigation = [];
var timer = false;

$('document').ready(function() {
	
	init();
	
});

// Initialize our application
var init = function() {
	$.ajaxQueue({url:'load.php?url='+config['cake_domain'], data: null, type: 'GET', success: function(data) {
		
		// Scrape the parent items
		var links = $(data).find('#toc ul a');
		
		console.log(navigation, 'top level');
		
		// Loop through the parents
		$.each(links, function(index, item) {
			
			// Add each parent to our navigation array
			var fixed_url = item['href'].replace(config['local_domain'], config['cake_domain']);
			
			var node = {title: item['text'], href: fixed_url, scanned: false };
			
			get_children(node);
			
			navigation.push( node );
			
			console.log(navigation, 'process nav');
			
		});
		console.log(navigation, 'final nav');
		
	}});
};

// Returns true if the navigation array has unscanned links
var get_children = function(node) {
	
	$.ajaxQueue({url:'load.php?url='+node.href, data: null, type: 'GET', success: function(data) {
		
		var collector = [];
		var child_items = $(data).find('#toc a.selected').next('ul').children('li').children('a');
		$.each(child_items, function(index, item) {
						
			var fixed_url = item['href'].replace(config['local_domain'], config['cake_domain']);
			var child_node = {title: item['text'], href: fixed_url, scanned: false };
			
			console.log(child_node, 'processing child');
			
			get_children(child_node);
			
			collector.push(child_node);
		});
		
		node['children'] = collector;
		node['scanned'] = true;
	}});
	
};