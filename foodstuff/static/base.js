// Address of site, used for internal api calls
var fetch_addr = "http://localhost:5000";

$( "#drop-btn" ).mouseover(function() {
    $( "#dropdown" ).show()
  });

$( "#dropdown-div" ).mouseleave(function() {
    $( "#dropdown" ).hide()
  });

// Get the login buttons
var login_open_btn = document.getElementById("login-navbar"); //Button to open modal
var login_close = document.getElementById("login-modal-close"); //Button to close modal
var login_background = document.getElementById("login-modal"); ///


// When the user clicks on the button, open the modal 
login_open_btn.addEventListener("click",function() 
    {
    // console.log(document.getElementById("file").value);
    var login_modal = document.getElementById('login-modal');
    login_modal.style.display = "block";
    } 
)

// Close button in the modal.
login_close.addEventListener("click", function() 
    {
    var login_modal = document.getElementById('login-modal');
    login_modal.style.display = "none";
    }
)

// Close modal by clicking background
login_background.addEventListener("click", function(event) 
    {
    var login_modal = document.getElementById('login-modal');
    if (event.target==login_background) {
        login_modal.style.display = "none";
    }
    }
)
var rel_addr = window.location.pathname+window.location.search
console.log(rel_addr)
// The overall login function
function login() {
    var email = $("#login-email").val() 
    var pass = $("#login-password").val() 

    var lower_email= email.toLowerCase();
    var payload = [lower_email, pass];
    // Header needed to make the fetch request work
    var headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    fetch(`${fetch_addr}/loginapi`,{
        headers,
        method: "POST",
        body: JSON.stringify(payload)
    }).then((response)=>response.json())
    .then(function(data) {
        if (data.loggedin == "true") {
            //Authentication Sucess
            // Check if we need to execute a redirect
            if (data.is_supplier=="true") {
                // Redirect for suppliers
                window.location.href = '/supplier/home'                    
            } else {
                if (data.is_admin=="true") {
                    // Redirect for Admin
                    window.location.href = '/admin/home'                    
                } else {
                    // Execute redirects based on the page we're on
                    // If on the landing page, redirect to the logged in home page
                    if (rel_addr=="/foodstuff" || rel_addr =="/" || rel_addr =="/foodstuff_loggedout") {
                        window.location.href = '/foodstuff'
                    } else {
                        if (rel_addr=="/recipe_results/tab1" || rel_addr=="/recipe_results/tab2" || rel_addr=="/recipe_results/tab3") {
                            // Force a reload on the recipe result page
                            location.reload(true)
                        } else {
                            if (rel_addr=="/find_recipe") {
                                //Change the navbar
                                $("#login-navbar").hide()
                                $("#signup-navbar").hide()
                                $("#partner-navbar").hide()
                                $("#account-navbar").show()
                                $("#logout-navbar").show()
                                $("#shop-navbar").show()
                                //Close the modal
                                $("#login-modal").hide()
                                //Clear the inputs on the modal
                                $("#login-email").text=""
                                $("#login-password").text=""


                                // Check if the user has any ingredients stored.
                                // Store the current tab in the arrays, then check
                                if ($("#tab-1").hasClass("active")==true) {
                                    var tab1 = get_tab_list()
                                    $("#ingredient-modal").data("tab1", tab1)
                                }        
                                if ($("#tab-2").hasClass("active")==true) {
                                    var tab2 = get_tab_list()
                                    $("#ingredient-modal").data("tab2", tab2)
                                }
                                if ($("#tab-3").hasClass("active")==true) {
                                    var tab3 = get_tab_list()
                                    $("#ingredient-modal").data("tab3", tab3)
                                }
                                if ($("#ingredient-modal").data("tab1").length!= 0 || $("#ingredient-modal").data("tab2")!=0 || $("#ingredient-modal").data("tab3") != 0) {
                                    // If there is any content on the current tabs and there is new incoming data, ask how it should be handled.
                                    // Need to open ingredient merge modal
                                    $('#ingredient-merge-modal').show()
                                } else {
                                    // Do nothing, just fetch ingredients and write to the tabs
                                    // Default to tab 1 active.
                                    $("#tab-1").addClass("active")
                                    $("#tab-2").removeClass("active")
                                    $("#tab-3").removeClass("active")

                                    //Get tabs and set their initial colors
                                    var activeColour = "#f9a504";
                                    var inactiveColour = "#823400";
                                    var tab1Element = document.getElementById("tab-1");
                                    var tab2Element = document.getElementById("tab-2");
                                    var tab3Element = document.getElementById("tab-3");
                                    tab1Element.style.backgroundColor = activeColour;
                                    tab2Element.style.backgroundColor = inactiveColour;
                                    tab3Element.style.backgroundColor = inactiveColour;


                                    // Fetch ingredient lists
                                    // Header needed to make the fetch request work
                                    var headers = {
                                        'Accept': 'application/json',
                                        'Content-Type': 'application/json'
                                    };
                                    fetch(`${fetch_addr}/api/ingredients_tabs_pull`,{
                                        headers,
                                        method: "POST",
                                    })
                                    .then((response)=>response.json())
                                    .then(function(data) {
                                        console.log(data)
                                        tab1=data[0]
                                        tab2=data[1]
                                        tab3=data[2]
                                        $("#ingredient-modal").data("tab1", tab1)
                                        $("#ingredient-modal").data("tab2", tab2)
                                        $("#ingredient-modal").data("tab3", tab3)
                                        // Then write to tab1, the default open tab
                                        $("#placeholder-list").remove()
                                        write_tab_list(tab1)
                                    })
                                }
                            } else {
                                // On a 'normal page'
                                //Change the navbar
                                $("#login-navbar").hide()
                                $("#signup-navbar").hide()
                                $("#account-navbar").show()
                                $("#logout-navbar").show()
                                //Close the modal
                                $("#login-modal").hide()
                                //Clear the inputs on the modal
                                $("#login-email").text=""
                                $("#login-password").text=""
                            }
                        }
                    }
                }
                
            }

        } else {
            //Authentication Failed     
            $('#login-modal-error').delay(500).fadeIn('normal', function() {
                $(this).delay(3500).fadeOut();
                });       
        }
        
    });
}
// Call the login function on either the submit button
$("#loginsubmit").click(function(){
    login()
})
// OR on pressing enter in the password box
$('#login-password').keyup(function() {
    if ( event.which == 13 ) {
        login()
    }
})


// Function from edit ingredients page, used in specific login sequence on that page.
var counter=-1
function get_tab_list() {
    var list =document.getElementById("ingredient-list")
    var list_elems = list.children
    var return_array = []
    for (var i = 0; i < list_elems.length; i++) {
        var elem = list_elems[i];
        if (elem.id != "placeholder-list") {
        return_array.push(elem.children[0].innerText)
        }
    }
    return(return_array)
}

// Function from get ingredients, used in particular login sequence
function write_tab_list(list) {
    if(list.length==0) {
        $("#ingredient-list").append(`<li id="placeholder-list" class="list-group-item">Ingredients will appear here</li>`)
    }
    for (var i = 0; i < list.length; i++) {
        $("#ingredient-list").append(`<li id="list_${counter}" class="list-group-item"><p style="display:inline;" id="text_${counter}">${list[i]}</p><span id="${counter}" class="close close-list" >&times;</span> <div id="?${counter}" class="close close-list" >?</div> </li>`)
        counter--;
    }
}