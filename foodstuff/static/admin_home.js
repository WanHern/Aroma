var btn = document.getElementById("register_btn");

var modal = document.getElementById('register_modal');
btn.onclick = function(){
	modal.style.display = "block";
}



// Get the button that opens the modal

// Get the <span> element that closes the modal
var span = document.getElementById("modal-close");



// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}