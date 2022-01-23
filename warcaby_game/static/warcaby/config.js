
$(document).ready(function() {
  $('#size').on('input', function() {
    var size=$(this);
    var size_val=size.val();
    var err1 = document.getElementById("error1");

    if(size_val < 4 || Math.floor(size_val) != size_val)
    {
      err1.classList.remove("error");
      err1.classList.add("show_error");

    }
    else{
      err1.classList.remove("show_error");
      err1.classList.add("error");    
    }

  });

  $('#starting_rows').on('input', function() {
    var starting_rows=$(this);
    var starting_rows_val=starting_rows.val();
    var err2 = document.getElementById("error2");

    if(starting_rows_val < 2 || Math.floor(starting_rows_val) != starting_rows_val)
    {
      err2.classList.remove("error");
      err2.classList.add("show_error");

    }
    else{
      err2.classList.remove("show_error");
      err2.classList.add("error");    
    }
  });



});

function validateForm(e) {
  var err1 = document.getElementById("error1");
  var err2 = document.getElementById("error2");
  if(err1.className == "show_error" || err2.className == "show_error"){
    e.preventDefault();
    return false;
  }
  var size=document.getElementById("size");
  var size_val=size.value;   
  var starting_rows=document.getElementById("starting_rows");
  var starting_rows_val=starting_rows.value; 
  var err3 = document.getElementById("error3");
  if(size_val - 2 * starting_rows_val < 2){
    e.preventDefault();
    err3.classList.remove("error");
    err3.classList.add("show_error");
    return false;
  }
  else{
    err3.classList.remove("show_error");
    err3.classList.add("error");
  }
}