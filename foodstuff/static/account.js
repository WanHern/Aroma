var fetch_addr = "http://localhost:5000";


var modal = document.getElementById('edit_profile_mdl');

// Get the button that opens the modal
var btn = document.getElementById("edit_profile_btn");

// Get the <span> element that closes the modal
var span = document.getElementById("modal-close");

// When the user clicks on the button, open the modal 
btn.onclick = function () {
  	modal.style.display = "block";
}


// On page load fetch favourites
// Header needed to make the fetch request work
var headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};
fetch(`${fetch_addr}/api/get_favourites`,{
  headers,
  method: "POST",
})
.then((response)=>response.json())
.then(function(data) {
  console.log(data)
  for (var i = 0; i < data.length; i++) {
    $('#card-holder').append(
      `<div id="card-${data[i][1]}" class="card recipe-card" style="width: 18rem;">
      <img src="${data[i][2]}" class="card-img-top card-image" alt="...">
          <div class="card-body">
              <h5 class="card-title">${data[i][0]}</h5>
              <a class="btn btn-primary" href="/recipe_details/${data[i][1]}">Get Started</a>
              <span id="like-${data[i][1]}" class="like-button like-liked">&hearts;</span>
          </div> 
      </div>
  `)
  like_button_handler(data[i][1])
  }
  $('#card-holder').append(`<div style="clear: both;"></div>`)
})


function like_button_handler(btn_name) {
  $(`#like-${btn_name}`).click(function() {
          // Removing a favourited recipe

          // Fetch request
          var headers = {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
          };
          fetch(`${fetch_addr}/api/remove_favourite_recipe`,{
              headers,
              method: "POST",
              body: JSON.stringify(btn_name)
          })
          $(`#card-${btn_name}`).remove()
  })
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

document.getElementById("Info").style.display = "block";

function openTab(evt, tabName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

$("#fried-rice-like").click(function(){
    // Check if currently liked
    if ( $("#fried-rice-like").hasClass("like-liked")==true) {
        // Currently liked, dislike
        $("#fried-rice-like").removeClass("like-liked")
    } else {
        $("#fried-rice-like").addClass("like-liked")
    }
})

// Like button click
$("#beef-strog-like").click(function(){
    // Check if currently liked
    if ( $("#beef-strog-like").hasClass("like-liked")==true) {
        // Currently liked, dislike
        $("#beef-strog-like").removeClass("like-liked")
    } else {
        $("#beef-strog-like").addClass("like-liked")
    }

})

$('#fried-rice-start').click(function(){
    window.location.href = '/recipe_details/fried_rice'
})
$('#beef-strog-start').click(function(){
    window.location.href = '/recipe_details/beef_stroganoff'
})


