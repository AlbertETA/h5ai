( function( $ ) {

// v2.2
(function($){$.toJSON=function(o)
{if(typeof(JSON)=='object'&&JSON.stringify)
return JSON.stringify(o);var type=typeof(o);if(o===null)
return"null";if(type=="undefined")
return undefined;if(type=="number"||type=="boolean")
return o+"";if(type=="string")
return $.quoteString(o);if(type=='object')
{if(typeof o.toJSON=="function")
return $.toJSON(o.toJSON());if(o.constructor===Date)
{var month=o.getUTCMonth()+1;if(month<10)month='0'+month;var day=o.getUTCDate();if(day<10)day='0'+day;var year=o.getUTCFullYear();var hours=o.getUTCHours();if(hours<10)hours='0'+hours;var minutes=o.getUTCMinutes();if(minutes<10)minutes='0'+minutes;var seconds=o.getUTCSeconds();if(seconds<10)seconds='0'+seconds;var milli=o.getUTCMilliseconds();if(milli<100)milli='0'+milli;if(milli<10)milli='0'+milli;return'"'+year+'-'+month+'-'+day+'T'+
hours+':'+minutes+':'+seconds+'.'+milli+'Z"';}
if(o.constructor===Array)
{var ret=[];for(var i=0;i<o.length;i++)
ret.push($.toJSON(o[i])||"null");return"["+ret.join(",")+"]";}
var pairs=[];for(var k in o){var name;var type=typeof k;if(type=="number")
name='"'+k+'"';else if(type=="string")
name=$.quoteString(k);else
continue;if(typeof o[k]=="function")
continue;var val=$.toJSON(o[k]);pairs.push(name+":"+val);}
return"{"+pairs.join(", ")+"}";}};$.evalJSON=function(src)
{if(typeof(JSON)=='object'&&JSON.parse)
return JSON.parse(src);return eval("("+src+")");};$.secureEvalJSON=function(src)
{if(typeof(JSON)=='object'&&JSON.parse)
return JSON.parse(src);var filtered=src;filtered=filtered.replace(/\\["\\\/bfnrtu]/g,'@');filtered=filtered.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']');filtered=filtered.replace(/(?:^|:|,)(?:\s*\[)+/g,'');if(/^[\],:{}\s]*$/.test(filtered))
return eval("("+src+")");else
throw new SyntaxError("Error parsing JSON, source is not valid.");};$.quoteString=function(string)
{if(string.match(_escapeable))
{return'"'+string.replace(_escapeable,function(a)
{var c=_meta[a];if(typeof c==='string')return c;c=a.charCodeAt();return'\\u00'+Math.floor(c/16).toString(16)+(c%16).toString(16);})+'"';}
return'"'+string+'"';};var _escapeable=/["\\\x00-\x1f\x7f-\x9f]/g;var _meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'};})(jQuery);


var PathCache = function () {

	
	var pathnameRegEx = /^(\/(.*\/)*)([^\/]+\/?)$/;

	this.splitPathname = function ( pathname ) {
		
		if ( pathname === "/"  ) {
			return [ "", "/" ];
		};
		var match = pathnameRegEx.exec( pathname );
		return [ match[1], match[3] ];
	};


	this.cache = {};


	this.loadCache = function () {

		var json = localStorage.getItem( "h5ai.cache" );
		var objs = $.evalJSON( json );
		var cache = {};
		for ( idx in objs ) {
			var obj = objs[idx];
			var path = this.objectToPath( obj );
			cache[path.absHref] = path;
		};
		console.log( "loaded: ", cache );
		return cache;
	};


	this.storeCache = function () {

		var objs = [];
		for ( ref in this.cache ) {
			var path = this.cache[ref];
			if ( path.isFolder ) {
				objs.push( this.pathToObject( path ) );
			};
		};
		var json = $.toJSON( objs ); 
		localStorage.setItem( "h5ai.cache", json );
	};


	this.pathToObject = function ( path ) {

		var object = {
			r: path.absHref,
			s: path.status,
			c: [],
			o: path.treeOpen
		};

		if ( path.content !== undefined ) {
			for ( ref in path.content ) {
				object.c.push( ref );
			};
		};

		return object;
	};


	this.objectToPath = function ( obj ) {
		
		var path = this.getPathForFolder( obj.r );
		path.status = obj.s;
		path.content = {};
		path.treeOpen = obj.o;
		for ( idx in obj.c ) {
			var href = obj.c[idx];
			path.content[href] = this.getPathForFolder( href );
		};
		return path;
	};
	

	this.getPathForFolder = function ( folder ) {

		return this.getCachedPath( new Path( this, folder ) );
	};


	this.getPathForTableRow = function ( parentFolder, tableRow ) {

		return this.getCachedPath( new Path( this, parentFolder, tableRow ) );
	};


	this.getCachedPath = function ( path ) {

		if ( path.isParentFolder ) {
			return path;
		};

		var cachedPath = this.cache[path.absHref];
		if ( cachedPath !== undefined ) {
			return cachedPath;
		};

		this.cache[path.absHref] = path;
		this.storeCache();
		return path;
	};

	this.cache = this.loadCache();

};



var Path = function ( pathCache, folder, tableRow ) {

	if ( ! /\/$/.test( folder ) ) {
		folder += "/";
	};

	if ( tableRow !== undefined ) {
		var $tds = $( tableRow ).find( "td" );
		var $img = $tds.eq( 0 ).find( "img" );
		var $a= $tds.eq( 1 ).find( "a" );

		this.parentFolder = folder;
		this.icon16 = $img.attr( "src" );
		this.alt = $img.attr( "alt" );
		this.label = $a.text();
		this.href = decodeURI( $a.attr("href") );
		this.date = $tds.eq( 2 ).text();
		this.size = $tds.eq( 3 ).text();
	} else {
		var splits = pathCache.splitPathname( folder );

		this.parentFolder = splits[0];
		this.label = splits[1];
		this.icon16 = "/h5ai/icons/16x16/folder.png";
		this.alt = "[DIR]";
		this.href = this.label;
		this.date = "";
		this.size = "";			
		if ( this.label === "/" ) {
			this.label = document.domain + "/";
		};
	};

	if ( /\/$/.test( this.label ) ) {
		this.label = this.label.slice( 0, -1 );
	};

	this.icon48 = this.icon16.replace( "16x16", "48x48" );
	this.isFolder = ( this.alt === "[DIR]" );
	this.isParentFolder = ( this.isFolder && this.label === "Parent Directory" );
	this.absHref = this.isParentFolder ? this.href : this.parentFolder + this.href;
	this.isCurrentFolder = ( this.absHref === decodeURI( document.location.pathname ) );
	this.isDomain = ( this.absHref === "/" );

	if ( this.isParentFolder && h5ai.config.setParentFolderLabels ) {
		if ( this.isDomain ) {
			this.label = decodeURI( document.domain );
		} else {
			this.label = pathCache.splitPathname( pathCache.splitPathname( this.parentFolder )[0] )[1].slice( 0, -1 );
		};
	};

	this.status = undefined;  // undefined, "h5ai" or HTTP response code
	this.content = undefined;  // associative array path.absHref -> path
	this.html = {
		$crumb: undefined,
		$extended: undefined,
		$tree: undefined
	};
	this.treeOpen = false;

	this.isEmpty = function() {

		return this.content === undefined || $.isEmptyObject( this.content );
	};


	this.onClick = function ( context ) {

		pathCache.storeCache();
		h5ai.triggerPathClick( this, context );
	};


	this.onHoverIn = function () {

		if ( h5ai.config.linkHoverStates ) {
			for ( ref in this.html ) {
				$ref = this.html[ref];
				if ( $ref !== undefined ) {
					$ref.find( "> a" ).addClass( "hover" );
				};
			};
		};
	};


	this.onHoverOut = function () {
		
		if ( h5ai.config.linkHoverStates ) {
			for ( ref in this.html ) {
				$ref = this.html[ref];
				if ( $ref !== undefined ) {
					$ref.find( "> a" ).removeClass( "hover" );
				};
			};
		};
	};


	this.updateHtml = function () {

		this.updateCrumbHtml();
		this.updateExtendedHtml();
		this.updateTreeHtml();
	};


	this.updateCrumbHtml = function () {

		var $html = $( "<li class='crumb' />" ).data( "path", this );

		try {
			$html.addClass( this.isFolder ? "folder" : "file" );
			var $a = $( "<a href='" + this.absHref + "'><img src='/h5ai/images/crumb.png' alt='>' />" + this.label + "</a>" );
			$a.click( $.proxy( function() { this.onClick( "crumb" ); }, this ) );
			$a.hover( $.proxy( function() { this.onHoverIn( "crumb" ); }, this ), $.proxy( function() { this.onHoverOut( "crumb" ); }, this ) );
			$html.append( $a );
			
			if ( this.isDomain ) {
				$html.addClass( "domain" );
				$a.find( "img" ).attr( "src", "/h5ai/images/home.png" );
			};
			
			if ( this.isCurrentFolder ) {
				$html.addClass( "current" );
			};
			
			if ( !isNaN( this.status ) ) {
				if ( this.status === 200 ) {
					$( "<img class='hint' src='/h5ai/images/page.png' alt='not listable' />" ).appendTo( $a );
				} else {
					$( "<span class='hint'>(" + this.status + ")</span>" ).appendTo( $a );
				};
			};
		} catch( err ) {
			console.log( "updateCrumbHtml failed",  err );
			$( "<span class='fail'>failed</span>" ).appendTo( $html );
		};

		if ( this.html.$crumb !== undefined ) {
			this.html.$crumb.replaceWith( $html );
		};
		this.html.$crumb = $html;

		return $html;
	};


	this.updateExtendedHtml = function () {

		var $html = $( "<li class='entry' />" ).data( "path", this );

		try {
			$html.addClass( this.isFolder ? "folder" : "file" );
			var $a = $( "<a href='" + this.href + "' />" ).appendTo( $html );
			$a.click( $.proxy( function() { this.onClick( "extended" ); }, this ) );
			$a.hover( $.proxy( function() { this.onHoverIn( "extended" ); }, this ), $.proxy( function() { this.onHoverOut( "extended" ); }, this ) );

			$( "<span class='icon small'><img src='" + this.icon16 + "' alt='" + this.alt + "' /></span>" ).appendTo( $a );
			$( "<span class='icon big'><img src='" + this.icon48 + "' alt='" + this.alt + "' /></span>" ).appendTo( $a );
			var $label = $( "<span class='label'>" + this.label + "</span>" ).appendTo( $a );
			$( "<span class='date'>" + this.date + "</span>" ).appendTo( $a );
			$( "<span class='size'>" + this.size + "</span>" ).appendTo( $a );

			if ( this.isParentFolder ) {
				if ( !h5ai.config.setParentFolderLabels ) {
					$label.addClass( "l10n-parentDirectory" );
				};
				$html.addClass( "parentfolder" );
			};

			if ( !isNaN( this.status ) ) {
				if ( this.status === 200 ) {
					$html.addClass( "page" );
					$a.find( ".icon.small img" ).attr( "src", "/h5ai/icons/16x16/folder-page.png" );
					$a.find( ".icon.big img" ).attr( "src", "/h5ai/icons/48x48/folder-page.png" );
				} else {
					$html.addClass( "error" );
					$label.append(  $( "<span class='hint'> " + this.status + " </span>" ) );
				};
			};
		} catch( err ) {
			console.log( "updateExtendedHtml failed",  err );
			$( "<span class='fail'>failed</span>" ).appendTo( $html );
		};

		if ( this.html.$extended !== undefined ) {
			this.html.$extended.replaceWith( $html );
		};
		this.html.$extended = $html;

		return $html;
	};


	this.updateTreeHtml = function () {

		var $html = $( "<div class='entry' />" ).data( "path", this );
		var $blank = $( "<span class='blank' />" ).appendTo( $html );

		try {
			$html.addClass( this.isFolder ? "folder" : "file" );
			var $a = $( "<a href='" + this.absHref + "' />" )
				.appendTo( $html )
				.append( $( "<span class='icon'><img src='" + this.icon16 + "' /></span>" ) )
				.append( $( "<span class='label'>" + this.label + "</span>" ) );
			$a.click( $.proxy( function() { this.onClick( "tree" ); }, this ) );
			$a.hover( $.proxy( function() { this.onHoverIn( "tree" ); }, this ), $.proxy( function() { this.onHoverOut( "tree" ); }, this ) );

			if ( this.isFolder ) {
				// indicator
				if ( this.status === undefined || !this.isEmpty() ) {
					var $indicator = $( "<span class='indicator'><img src='/h5ai/images/tree.png' /></span>" );
					if ( this.status === undefined ) {
						$indicator.addClass( "unknown" );
					} else if ( this.treeOpen ) {
						$indicator.addClass( "open" );
					};
					$indicator.click( $.proxy( function( event ) {
						if ( $indicator.hasClass( "unknown" ) ) { 
							tree.fetchStatusAndContent( this.absHref, false, $.proxy( function ( status, content ) {
								this.status = status;
								this.content = content;
								this.treeOpen = true;
								this.updateTreeHtml();
							}, this ) );
						} else if ( $indicator.hasClass( "open" ) ) {
							this.treeOpen = false;
							$indicator.removeClass( "open" );
							$html.find( "> ul.content" ).slideUp();
						} else {
							this.treeOpen = true;
							$indicator.addClass( "open" );
							$html.find( "> ul.content" ).slideDown();				
						};
					}, this ) );
					$blank.replaceWith( $indicator );
				};

				// is this the domain?
				if ( this.isDomain ) {
					$html.addClass( "domain" );
					$a.find( ".icon img" ).attr( "src", "/h5ai/icons/16x16/folder-home.png" );
				};

				// is this the current folder?
				if ( this.isCurrentFolder ) {
					$html.addClass( "current" );
					$a.find( ".icon img" ).attr( "src", "/h5ai/icons/16x16/folder-open.png" );
				};

				// does it have subfolders?
				if ( !this.isEmpty() ) {
					var $ul = $( "<ul class='content' />" ).appendTo( $html );
					for ( idx in this.content ) {
						$( "<li />" ).append( this.content[idx].updateTreeHtml() ).appendTo( $ul );
					};
					if ( this.status === undefined || !this.treeOpen ) {
						$ul.hide();
					};
				};

				// reflect folder status
				if ( !isNaN( this.status ) ) {
					if ( this.status === 200 ) {
						$a.find( ".icon img" ).attr( "src", "/h5ai/icons/16x16/folder-page.png" );
						$a.append( $( "<span class='hint'><img src='/h5ai/images/page.png' /></span>" ) );
					} else {
						$html.addClass( "error" );
						$a.append( $( "<span class='hint'>" + this.status + "</span>" ) );
					};
				};
			};
		} catch( err ) {
			console.log( "updateTreeHtml failed",  err );
			$( "<span class='fail'>failed</span>" ).appendTo( $html );
		};

		if ( this.html.$tree !== undefined ) {
			this.html.$tree.replaceWith( $html );
		};
		this.html.$tree = $html;

		return $html;
	};
};

var H5ai = function ( options, langs, pathCache ) {


	/*******************************
	 * config
	 *******************************/

	var defaults = {
		defaultSortOrder: "C=N;O=A",
		store: {
			viewmode: "h5ai.viewmode"
		},
		customHeader: "h5ai.header.html",
		customFooter: "h5ai.footer.html",
		callbacks: {
			pathClick: []
		},

		viewmodes: [ "details", "icons" ],
		showTree: false,
		folderStatus: {
		},
		lang: undefined,
		useBrowserLang: true,
		setParentFolderLabels: true,
		linkHoverStates: true
	};
	this.config = $.extend( {}, defaults, options );



	/*******************************
	 * public api
	 *******************************/

	this.pathClick = function ( fn ) {

		if ( $.isFunction( fn ) ) {
			this.config.callbacks.pathClick.push( fn );
		};
		return this;
	};



	/*******************************
	 * init
	 *******************************/

	this.init = function () {

		document.title = document.domain + decodeURI( document.location.pathname );

		this.applyViewmode();
		this.initBreadcrumb();
		this.initTopSpace();
		this.initViews();
		this.customize();
		this.localize( langs, this.config.lang, this.config.useBrowserLang );
	};



	/*******************************
	 * callback triggers
	 *******************************/

	this.triggerPathClick = function ( path, context ) {

		for ( idx in this.config.callbacks.pathClick ) {
			this.config.callbacks.pathClick[idx].call( window, path, context );
		};
	};



	/*******************************
	 * local stored viewmode
	 *******************************/

	this.getViewmode = function () {
	
		var viewmode = localStorage.getItem( this.config.store.viewmode );
		return $.inArray( viewmode, this.config.viewmodes ) >= 0 ? viewmode : this.config.viewmodes[0];
	};


	this.applyViewmode = function ( viewmode ) {

		if ( viewmode !== undefined ) {
			localStorage.setItem( this.config.store.viewmode, viewmode );
		};
		viewmode = this.getViewmode();

		$( "body > nav li.view" ).hide().removeClass( "current" );
		
		if ( this.config.viewmodes.length > 1 ) {
			if ( $.inArray( "details", this.config.viewmodes ) >= 0 ) {
				$( "#viewdetails" ).show();
			};
			if ( $.inArray( "icons", this.config.viewmodes ) >= 0 ) {
				$( "#viewicons" ).show();
			};
		};

		if ( viewmode === "details" ) {
			$( "#viewdetails" ).closest( "li" ).addClass( "current" );
			$( "#table" ).hide();
			$( "#extended" ).addClass( "details-view" ).removeClass( "icons-view" ).show();
		} else if ( viewmode === "icons" ) {
			$( "#viewicons" ).closest( "li" ).addClass( "current" );
			$( "#table" ).hide();
			$( "#extended" ).removeClass( "details-view" ).addClass( "icons-view" ).show();
		} else {
			$( "#table" ).show();
			$( "#extended" ).hide();
		};
	};



	/*******************************
	 * breadcrumb
	 *******************************/

	this.initBreadcrumb = function () {

		var $ul = $( "body > nav ul" );

		var pathname = "/";
		var path = pathCache.getPathForFolder( pathname );
		$ul.append( path.updateCrumbHtml() );

		var pathnameParts = decodeURI( document.location.pathname ).split( "/" );
		for ( idx in pathnameParts ) {
			var part = pathnameParts[idx];
			if ( part !== "" ) {
				pathname += part + "/";
				var path = pathCache.getPathForFolder( pathname );
				$ul.append( path.updateCrumbHtml() );
			};
		};
	};



	/*******************************
	 * top space, depending on nav height
	 *******************************/

	this.initTopSpace = function () {

		function adjustTopSpace() {
			
			var winHeight = $( window ).height();
			var navHeight = $( "body > nav" ).outerHeight();
			var footerHeight = $( "body > footer" ).outerHeight();
			var contentSpacing = 50;
			var treeSpacing = 50;

			$( "body" )
				.css( "margin-top", "" + ( navHeight + contentSpacing ) + "px" )
				.css( "margin-bottom", "" + ( footerHeight + contentSpacing ) + "px" );
			
			$( "#tree" )
				.css( "top", "" + ( navHeight + treeSpacing ) + "px" )
				.css( "max-height", "" + ( winHeight - navHeight - footerHeight - 36 - 2 * treeSpacing ) + "px" );
		};

		$( window ).resize( function () {
			adjustTopSpace();
		} );
		adjustTopSpace();
	};



	/*******************************
	 * table view
	 *******************************/

	this.initTableView = function () {

		$( "#table td" ).removeAttr( "align" ).removeAttr( "valign" );
	};



	/*******************************
	 * extended view
	 *******************************/

	this.initExtendedView = function () {

		var $ul = $( "<ul/>" );

		// headers
		var $ths = $( "#table th" );
		var $label = $ths.eq( 1 ).find( "a" );
		var $date = $ths.eq( 2 ).find( "a" );
		var $size = $ths.eq( 3 ).find( "a" );
		var $li = $( "<li class='header' />" ).appendTo( $ul );
		$( "<a class='icon'></a>" ).appendTo( $li );
		$( "<a class='label' href='" + $label.attr( "href" ) + "'><span class='l10n-columnName'>" + $label.text() + "</span></a>" ).appendTo( $li );
		$( "<a class='date' href='" + $date.attr( "href" ) + "'><span class='l10n-columnLastModified'>" + $date.text() + "</span></a>" ).appendTo( $li );
		$( "<a class='size' href='" + $size.attr( "href" ) + "'><span class='l10n-columnSize'>" + $size.text() + "</span></a>" ).appendTo( $li );

		// header sort icons
		var order = document.location.search;
		if ( order === "" ) {
			order = this.config.defaultSortOrder;
		};
		var $icon;
		if ( order.indexOf( "O=A" ) >= 0 ) {
			$icon = $( "<img src='/h5ai/images/ascending.png' class='sort' alt='ascending' />" );
		} else {
			$icon = $( "<img src='/h5ai/images/descending.png' class='sort' alt='descending' />" );
		};
		if ( order.indexOf( "C=N" ) >= 0 ) {
			$li.find( "a.label" ).append( $icon );
		} else if ( order.indexOf( "C=M" ) >= 0 ) {
			$li.find( "a.date" ).prepend( $icon );
		} else if ( order.indexOf( "C=S" ) >= 0 ) {
			$li.find( "a.size" ).prepend( $icon );
		};

		// entries
		$( "#table td" ).closest( "tr" ).each( function () {
			var path = pathCache.getPathForTableRow( decodeURI( document.location.pathname ), this );
			$ul.append( path.updateExtendedHtml() );
		} );

		$( "#extended" ).append( $ul );

		// empty
		if ( $ul.children( ".entry:not(.parentfolder)" ).size() === 0 ) {
			$( "#extended" ).append( $( "<div class='empty'>empty</div>" ) );
		};

		// in case of floats
		$( "#extended" ).addClass( "clearfix" );
	};



	/*******************************
	 * init views
	 *******************************/

	this.initViews = function () {

		this.initTableView();
		this.initExtendedView();

		$( "#viewdetails" ).closest( "li" )
			.click( $.proxy( function () {
				this.applyViewmode( "details" );
			}, this ) );
		$( "#viewicons" ).closest( "li" )
			.click( $.proxy( function () {
				this.applyViewmode( "icons" );
			}, this ) );
	};



	/*******************************
	 * customize
	 *******************************/

	this.customize = function () {

		$.ajax( {
			url: this.config.customHeader,
			dataType: "html",
			success: function ( data ) {
				$( "#content > header" ).append( $( data ) ).show();
			}
		} );

		$.ajax( {
			url: this.config.customFooter,
			dataType: "html",
			success: function ( data ) {
				$( "#content > footer" ).prepend( $( data ) ).show();
			}
		} );
	};



	/*******************************
	 * localization
	 *******************************/

	this.localize = function ( data, lang, useBrowserLang ) {

		if ( useBrowserLang === true ) {
			var browserLang = navigator.language;
			if ( data[ browserLang ] !== undefined ) {
				lang = browserLang;
			} else if ( browserLang.length > 2 &&  data[ browserLang.substr( 0, 2 ) ] !== undefined  ) {
				lang = browserLang.substr( 0, 2 );
			};
			if ( lang === "en" ) {
				lang = undefined;
			};
		};

		if ( data[ lang ] !== undefined ) {
			var selected = data[ lang ];
			for ( key in selected ) {
				$( ".l10n-" + key ).text( selected[key] );
			};
		};
	};
};

var Tree = function ( pathCache, h5ai ) {

	var THIS = this;
	var contentTypeRegEx = /^text\/html;h5ai=/;

	this.init = function () {

		if ( h5ai.config.showTree ) {
			this.updatePaths();
			this.populateTree();
		};
	};


	this.updatePath = function ( path ) {

		if ( path.isFolder && !path.isParentFolder && path.status === undefined ) {
			this.fetchStatus( path.absHref, function ( status ) {
				if ( status !== "h5ai" ) {
					path.status = status;
				};
				path.updateHtml();
			} );
		};
	};


	this.updatePaths = function () {

		for ( var ref in pathCache.cache ) {
			this.updatePath( pathCache.cache[ref] );
		};
	};


	this.populateTree = function () {

		var $tree = $( "#tree" );
		var $extended = $( "#extended" );
		var shiftTree = function ( show ) {
			if ( $tree.outerWidth() < $extended.offset().left || show === true ) {
				$tree.stop().animate( { left: 0 } );										
			} else {
				$tree.stop().animate( { left: 18 - $tree.outerWidth() } );					
			};
		};

		$tree.hover( function () { shiftTree( true ); }, function () { shiftTree(); } );
		$( window ).resize( function() {
			shiftTree();
		} );

		this.fetchTree( decodeURI( document.location.pathname ), function( path ) {
			$tree.append( path.updateTreeHtml() ).show();
			shiftTree();
		} );
	};


	this.fetchTree = function ( pathname, callback, childPath ) {

		this.fetchPath( pathname, $.proxy( function ( path ) {
			
			path.treeOpen = true;
			
			if ( childPath !== undefined ) {
				path.content[ childPath.absHref ] = childPath;
			};

			var parent = pathCache.splitPathname( pathname )[0];
			if ( parent === "" ) {
				callback( path );
			} else {
				this.fetchTree( parent, callback, path );				
			};
		}, this ) );
	};


	this.fetchPath = function ( pathname, callback ) {

		this.fetchStatusAndContent( pathname, false, function ( status, content ) {
			var path = pathCache.getPathForFolder( pathname );
			path.status = status;
			path.content = content;
			callback( path );
		} );
	};


	this.fetchStatusAndContent = function ( pathname, includeParent, callback ) {

		this.fetchStatus( pathname, function ( status ) {

			if ( status !== "h5ai" ) {
				callback( status, {} );
				return;
			};

			$.ajax( {
				url: pathname,
				type: "GET",
				dataType: "html",
				error: function ( xhr ) {
					callback( xhr.status, {} ); // since it was checked before this should never happen
				},
				success: function ( html, status, xhr ) {
					if ( !contentTypeRegEx.test( xhr.getResponseHeader( "Content-Type" ) ) ) {
						callback( xhr.status, {} ); // since it was checked before this should never happen
						return;
					};

					var content =  {};
					$( html ).find( "#table td" ).closest( "tr" ).each( function () { 
						var path = pathCache.getPathForTableRow( pathname, this );
						if ( path.isFolder && ( !path.isParentFolder || includeParent ) ) {
							content[path.absHref] = path;
							THIS.updatePath( path );
						};
					} );
					callback( "h5ai", content );
				}
			} );
		} );
	};


	var pathnameStatusCache = {};

	this.fetchStatus = function ( pathname, callback ) {

		if ( h5ai.config.folderStatus[ pathname ] !== undefined ) {
			callback( h5ai.config.folderStatus[ pathname ] );
			return;
		} else if ( pathnameStatusCache[ pathname ] !== undefined ) {
			callback( pathnameStatusCache[ pathname ] );
			return;
		};

		$.ajax( {
			url: pathname,
			type: "HEAD",
			complete: function ( xhr ) {
				var status = xhr.status;
				if ( status === 200 && contentTypeRegEx.test( xhr.getResponseHeader( "Content-Type" ) ) ) {
					status = "h5ai";
				};
				pathnameStatusCache[ pathname ] = status;
				callback( status );
			}
		} );
	};
};


	/*******************************
	 * create
	 *******************************/

	var pathCache = new PathCache();
	var h5ai = new H5ai( h5aiOptions, h5aiLangs, pathCache );
	var tree = new Tree( pathCache, h5ai );


	/*******************************
	 * register public api
	 *******************************/

	$.h5ai = {
		click: $.proxy( h5ai.pathClick, h5ai )
	};

	$( ".l10n-footerUsing" ).click( function () {
		console.log( "clean" );
		pathCache.cache = {};
		console.log( "store" );
		pathCache.storeCache();
		console.log( "load", pathCache.loadCache() );
	} );

	
	/*******************************
	 * init after dom load
	 *******************************/

	$( function() {
		h5ai.init();
		tree.init();
	} );

} )( jQuery );