const size = document.getElementById("size");

function validateForm(e) {
    e.preventDefault();
    if(document.getElementById("size"))
    alert("Name must be filled out");
    return false;
  }