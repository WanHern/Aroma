var editing=true
var deleting=true

// Editing button
$("#edit").click(function() {
    if (editing==false) {
        // Show the edit buttons
        show_edit()
        // Hide the delete buttons
        hide_delete()
        // Set editing to true
        editing=true;
    } else {
        // Hide the edit buttons
        hide_edit()
        // Hide the delete buttons
        hide_delete()        
        editing=false
    }
})

// Delete button
$("#delete").click(function() {
    if (deleting==false) {
        // Show the delete buttons
        show_delete()
        // Hide the edit buttons
        hide_edit()
        // Set deleting to true
        deleting=true;
    } else {
        // Hide the delete buttons
        hide_delete()
        // Hide the edit buttons
        hide_edit()        
        deleting=false
    }
})

// Listener for the add button
$("#add").click(function() {
    window.location.href = '/supplier/add_ingredient'
})


// Get the modal
var modal = document.getElementById('myModal');

// Get the button that opens the modal
//var btn = document.getElementsByClass("myBtn");

// Get the <span> element that closes the modal
var span = document.getElementById("close");

// When the user clicks on the button, open the modal 
function showModal() {
  modal.style.display = "block";
}

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

