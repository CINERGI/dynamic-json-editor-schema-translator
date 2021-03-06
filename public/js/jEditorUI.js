
var showEdits = function () {
    var xft = JSON.stringify(root);
   
    var w = window.open();
    $(w.document.body).html(xft);

}

var showFullPack = function () {
    var xft = JSON.stringify(gCKAN_package);
  
    var w = window.open();
    $(w.document.body).html(xft);

}

var showSave = function () {

    apply_edits(jData, gCKAN_package, gCKAN_mdpackage);
    save_fullpackage()
}


function save_fullpackage() {
  var inp = JSON.stringify(gCKAN_package);
  console.log(inp);

  if ( !inp ) {
    alert('nothing to save');
    return;
  }
  $.ajax({ 
    type: 'POST',
    url: '/save_fullpackage',
    data: inp,
    dataType: "json",
    contentType: "application/json",  
    success: function(data) {
      console.log('success');
      res = data.result;
      var pstack = 'Save Package :' + JSON.stringify(res,undefined,2);
      $("#myEd").html(pstack);

      },
    error: function (jqXHR, status, err) { alert('Save Error : ' + status + ' ' + err)}

  });
}

function search_package(curPage) {
  var inp = $("#searchid").val();
  var pgSize = $("#pgsz").val(); 
  (curPage) ? offpg = curPage : offpg = $("#offpg").val();
  var pages = $("#pages").val();
  var startAt = (offpg - 1)*pgSize;

  if (startAt < 0 ) {
    offset = 0;
  }
  var pData = { id : inp };
  var hurl = 'http://test.geothermaldata.org/api/3/action/package_search?q='+inp+'&start='+startAt+'&rows='+pgSize;

  $.ajax({
    type: 'GET',
    url: hurl,

    dataType: 'json',
    contentType: "application/json",
    error: function (xhr, ajaxOptions, thrownError){
      console.log(xhr.statusText);
      console.log(thrownError);
    },
    success: function(data, status) {
      res = data.result;
      var pkg = '<div><p>Search Package Results</p>';
      for (i = 0; i < res.results.length; i++) {
            pkg_item = res.results[i];
            var pkgName = pkg_item.name;
            var pkgTitle = pkg_item.title;
            pkg_string = JSON.stringify(pkg_item, undefined, 1);
            pkg_string = pkg_string.substring(1,pkg_string.length-1);
            pkg = pkg + '<a href="#" id="'+ pkgName + '"onclick="javascript:get_package(this);"><p>'+pkgTitle+'</p></a>';

          }
      pkg = pkg + '</div>';
      $("#pages").val(Math.round(res.count/pgSize));
      $("#ckan_list").html(pkg);
      }
  });
 };

var cp = false;

function show_packlist(pageSet) {
 
  var srch = $("#searchid").val();
  if (srch.length > -1 ) {
     if ( pageSet == "next" ) {
        var offpg = $("#offpg").val();
        var cp = parseInt(offpg) + 1;
        $("#offpg").val(cp);
        search_package(cp);
     } else {
       var offpg = $("#offpg").val();
        var cp = parseInt(offpg) - 1;
        $("#offpg").val(cp);
        search_package(cp);
     }
  } else {

    var link = 'http://test.geothermaldata.org/api/3/action/package_show?id='; 
    var inp = $("#pgsz").val();

    if ( pageSet == "next" ) {
      var cp = parseInt($("#offpg").val()) + 1;
      var offset = cp*parseInt(inp); 
    } else {
      var cp = parseInt($("#offpg").val()) - 1;
      var offset = cp*parseInt(inp);
    }
    $("#offpg").val(cp); 
    var pData = { limit : inp };
      $.ajax({
      type: 'GET',
      url: 'http://test.geothermaldata.org/api/3/action/package_list?limit='+inp+'&offset='+offset,
      dataType: "json",
      contentType: "application/json",
      success: function(data) {
        res = data.result;
        var pstack = "<div><p>Package List</p>";
        for (i = 0; i < res.length; i++) {
              pkg_item = res[i];
              pkg_string = JSON.stringify(pkg_item, undefined, 1);
              pkg_string = pkg_string.substring(1,pkg_string.length-1);
              pstack = pstack + '<a href="#" id="'+ pkg_string + '"onclick="javascript:get_package(this);"><p>'+pkg_string+'</p></a>';
            }
            pstack = pstack + '</div>';
        $("#ckan_list").html(pstack);
        }
    });
  }
};

var setMode = function() {
  if ( dMode == "Navigate" ) { 
      dMode = "Edit";
      $("#btnSRD").
       dMode = "Navigate";
       $("#btnSRD").text = "Navigate";
     } else {
      dMode = "Edit";
       $("#btnSRD").text = "Edit";
     }
}

function paintTree(zoomScale) {
   reset(zoomScale);
}

function selectSchema(eg) {

    gD3_Schema = eg.options[eg.selectedIndex].id
    d3.select("svg").remove();
    // If its already got a dataset use it, else build an empty schema

    if ( typeof(gCKAN_pid) !== "undefined" &&  gCKAN_pid.length > 1) {
        loadD3();
    } else {
      d3.json(gD3_Schema, function(error, treeData) {
        if (error) {
          alert('Schema : ' + gD3_Schema + ' indicated ' + error);
        } else {
          visu(error, treeData);
          reset();
       }
      });
  }
}

function get_package(obj) {

   // First pull in the whole package 
   gCKAN_pid = obj.id;
   get_full_package(obj);   
   loadD3();

}

function loadD3() {
    var tempSchema;
    ( gD3_Schema.lastIndexOf("/") ) ? tempSchema = gD3_Schema.substring(gD3_Schema.lastIndexOf("/")+1) : tempSchema = gD3_Schema;
    var mdurl = '/md_extract?pid='+gCKAN_pid+'&schema='+tempSchema;
    console.log(mdurl);

    d3.json(mdurl, function(error, treeData) {
      if ( typeof(treeData.status) !== "undefined" &&  treeData.status == "No md_package!" ) {
         alert("Metadata Source is missing the md_package: " + gCKAN_pid);
          var pixName = gCKAN_package.title;
          $("#myEd").html("<h3>"+ pixName + " [ New ]</h3>");
          d3.json( gD3_Schema, function(error, treeData) {
          d3.select("svg").remove();
          d3.selectAll('.d3-context-menu').remove();
          visu(error, treeData);
          reset();
        });       
      } else {

        d3.select("svg").remove();
        d3.selectAll('.d3-context-menu').remove();
        visu(error, treeData);
        reset();
      }
    });

}

function get_full_package(obj) {
  var pxid = obj.id;
  console.log('/md_get_package?pid='+pxid);
  var mdurl = '/md_get_package?pid='+pxid;
   
  $.ajax({
    type: 'GET',
    url: mdurl,
    dataType: "json",
    contentType: "application/json",
    success: function(data) {
       gCKAN_package = data;
       localMdPackage();
       if  ( typeof(gCKAN_package.title) !== "undefined" ) {
          $("#myEd").html("<h3>"+ gCKAN_package.title + "</h3>");
        } else {
           $("#myEd").html("<h3>"+ pxid + "</h3>");
        } 
      }
  });
}

var localMdPackage = function() {
  if ( gCKAN_package ) {
     var doMDP = false;
    for (i = 0; i < gCKAN_package.extras.length; i++) {
      console.log( "extras names " + gCKAN_package.extras[i].key);
      if (gCKAN_package.extras[i].key === 'md_package') {

         gCKAN_mdpackage = JSON.parse(gCKAN_package.extras[i].value);
         doMDP = true;
      }
    } 
  }
  if (!doMDP) {
    console.log('Local MD package not found !');
  }
}

var externalRef = function (listurl, params) {
  return ' hey there';

  $.ajax({
    type: 'GET',
    url: listurl,
    data:  JSON.stringify(params),
    dataType: "json",
    contentType: "application/json",
    success: function(data) {
      console.log(data);
      return data;
      }
    });
}

function getData() {
  $.ajax({
    type: 'GET',
    url: '/md_data',
    dataType: "json",
    contentType: "application/json",
    success: function(data) {
      console.log(data);
      d3.select("svg").remove();
      d3.json(data, function(error, treeData) {
          visu(error, treeData);
          reset();
      });
      $("#myEd").html(JSON.stringify(data));
      }
    });
}
