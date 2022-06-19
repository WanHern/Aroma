var fetch_addr = "http://localhost:5000";
// Check if the user is logged in.
// Start by assuming no
var loggedin=false;
// Immediately add the placeholder
$("#ingredient-list").append(`<li id="placeholder-list" class="list-group-item">Ingredients will appear here</li>`)
// Storage list for tab contents
var tab1=[];
var tab2=[];
var tab3=[];
// Save the tab data to the page storage elements
$("#ingredient-modal").data("tab1", tab1)
$("#ingredient-modal").data("tab2", tab2)
$("#ingredient-modal").data("tab3", tab3)

// Send a request to backend to see if user logged in and pull their saved tabs
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
    if (data==false) {
        // User is not logged in, populate tabs from cookies, if applicable
        console.log(Cookies.get('ingredients_tabs'))
        var tabs=JSON.parse(Cookies.get('ingredients_tabs'))
        console.log(tabs)
        console.log(typeof tabs)
        if (typeof tabs ==='undefined') {
            // No cookies, no data to populate with
        } else {
            tab1=tabs[0]
            tab2=tabs[1]
            tab3=tabs[2]
            $("#ingredient-modal").data("tab1", tab1)
            $("#ingredient-modal").data("tab2", tab2)
            $("#ingredient-modal").data("tab3", tab3)
            // Then write to tab1, the default open tab
            $("#ingredient-list").empty()
            write_tab_list(tab1)
        }

    } else {
        console.log(data)
        tab1=data[0]
        tab2=data[1]
        tab3=data[2]
        $("#ingredient-modal").data("tab1", tab1)
        $("#ingredient-modal").data("tab2", tab2)
        $("#ingredient-modal").data("tab3", tab3)
        // Then write to tab1, the default open tab
        $("#ingredient-list").empty()
        write_tab_list(tab1)
        // Ensure tab1 is set as active tab
        $("#tab-2").removeClass("active")
        $("#tab-3").removeClass("active")
        // Set this tab as active
        $("#tab-1").addClass("active")
        updateTabCol(tab1Element, tab2Element, tab3Element)
    }
})


// Counter is used to ensure dynamically generated elements have a unique id
var counter = 0

// Helper functions used to get the contents of the sidebar
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

// Helper function to write to the sidebar
function write_tab_list(list) {
    if(list.length==0) {
        $("#ingredient-list").append(`<li id="placeholder-list" class="list-group-item">Ingredients will appear here</li>`)
    }
    for (var i = 0; i < list.length; i++) {
        $("#ingredient-list").append(`<li id="list_${counter}" class="list-group-item"><p style="display:inline;" id="text_${counter}">${list[i]}</p><span id="${counter}" class="close close-list" >&times;</span> <div id="?${counter}" class="close close-list" >?</div> </li>`)
        counter++;
    }
}


// Page close fetch push.
// On page close, this will send the contents of the tabs to the backend
$(window).bind('beforeunload', function(){
    // Push the array to the backend
    var headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };  

    tab1 = $("#ingredient-modal").data("tab1")
    tab2 = $("#ingredient-modal").data("tab2")
    tab3 = $("#ingredient-modal").data("tab3")    

    if($("#tab-1").hasClass("active")==true) {
        tab1 = get_tab_list()
    }
    if($("#tab-2").hasClass("active")==true) {
        tab2 = get_tab_list()
    }
    if($("#tab-3").hasClass("active")==true) {
        tab3 = get_tab_list()
    }
    var payload = [tab1,tab2,tab3]

    var all_tabs_data = JSON.stringify(payload)
    Cookies.set('ingredients_tabs', `${all_tabs_data}`)

    fetch(`${fetch_addr}/api/ingredients_store`,{
        headers,
        method: "POST",
        body: JSON.stringify(payload)
    })
});


// Event listener for the ? and X in the ingredient list
$("#ingredient-list").click(function(event) {
    // Check if close button clicked
	if(event.target && event.target.nodeName == "SPAN") {
        // Close button was clicked, hide the element.
        $(`#list_${event.target.id}`).remove()

        // See if we need to add the list placeholder, relevant if list would otherwise be empty
        var list = document.getElementById("ingredient-list")
        if(list.children.length==0) {
            $("#ingredient-list").append(`<li id="placeholder-list" class="list-group-item">Ingredients will appear here</li>`)
        }

    }
	if(event.target && event.target.nodeName == "DIV") {
        // Info button was clicked. Show the modal
        // $(`#list_${event.target.id}`).hide()
        // Grab the id of the button clicked, then grab the name of the ingredient selected
        var num = event.target.id.substring(1,2)
        var li_name = `text_${num}`
        var name = $(`#${li_name}`).text()

        // Exec a fetch request to nutritionix
        var headers = {
            'x-app-id': 'b02d8266',
            'x-app-key':'f88db37e30b9841142922f35aecb6234',
            'x-remote-user-id':'user1',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        var payload = {
            "query": `${name}`,
            "num_servings": 1,
            "locale": "en_GB"
          }
        fetch(`https://trackapi.nutritionix.com/v2/natural/nutrients`,{
            headers,
            method: "POST",
            body: JSON.stringify(payload)
        }).then((response)=>response.json())
        .then(function(data) {
            console.log(data.foods[0])
            // results are returned based on serving size, so we need to convert everything to 100g
            var convert_factor = 100/data.foods[0].serving_qty

            // Need to convert calories to Kilojoules. Conversion factor is 4.184
            // .toFixed trims off all decimal places, for neater display
            var energy = (data.foods[0].nf_calories*convert_factor*4.184).toFixed(0)
            var fat = (data.foods[0].nf_total_fat*convert_factor).toFixed(0)
            var cholesterol = (data.foods[0].nf_cholesterol*convert_factor).toFixed(0)
            var sodium = (data.foods[0].nf_sodium*convert_factor).toFixed(0)
            var potassium = (data.foods[0].nf_potassium*convert_factor).toFixed(0)
            var carbs = (data.foods[0].nf_total_carbohydrate*convert_factor).toFixed(0)
            var sugars = (data.foods[0].nf_sugars*convert_factor).toFixed(0)
            var fiber = (data.foods[0].nf_dietary_fiber*convert_factor).toFixed(0)
            var protein = (data.foods[0].nf_protein*convert_factor).toFixed(0)
            $('#nutrition-energy').text(energy)
            $('#nutrition-fat').text(fat)
            $('#nutrition-cholesterol').text(cholesterol)
            $('#nutrition-sodium').text(sodium)
            $('#nutrition-potassium').text(potassium)
            $('#nutrition-carbs').text(carbs)
            $('#nutrition-sugar').text(sugars)
            $('#nutrition-fiber').text(fiber)
            $('#nutrition-protein').text(protein)

            $("#ingredient-modal").show()
            $("#food-name").text(name)
        } )

       

	}
});

// Trigger adding ingredient text on button press.
$("#add-text").click(function() {
    var text = $("#ingredients-input").val();
    add_ingredient_text(text)
})


//  Function that handles autcomplete
// Autocomplete for ingredient input
$( function() { 
    $( "#ingredients-input" ).autocomplete({
        // Define source as a function that grabs the data from nutritionix
        source: function (request, response) {
            var text = $("#ingredients-input").val();
            // Exec a fetch request to nutritionix
            var headers = {
                'x-app-id': 'b02d8266',
                'x-app-key':'f88db37e30b9841142922f35aecb6234',
                // 'x-remote-user-id':'user1',
                // 'Accept': 'application/json',
                // 'Content-Type': 'application/json'
            };
            var url = "https://trackapi.nutritionix.com/v2/search/instant?branded=false&query=" +  `${text}`
            fetch(`${url}`,{
                headers,
                method: "GET",
            }).then((response)=>response.json())
            .then(function(data) {
                console.log(data)
                // Extract the foodnames from the return results
                var result_array = []
                var i=0
                while (i<4 && i<data.common.length) {
                    // Capitalise first letter of words
                    var word = data.common[i].food_name
                    var up_case_word= word[0].toUpperCase() + word.substring(1)

                    result_array.push(up_case_word)
                    i++
                }
                // Give this result to the autocompelte box
                response(result_array);
            })       
        },

        // Override the default select behaviour, so that it automatically adds the ingredient to the ingredient list and clears the input box
        select: function (event, ui) {
            // We call the same function as the Add ingredient button and also close the autcomplete dropdown
            add_ingredient_text(ui.item.label)
            $( "#ingredients-input" ).autocomplete( "close" );
        },

        // Delay so that the server is not continuously hit with requests
        delay: 350,
        // Min length to prevent matching single letters, which will give a huge number of irrelevant results
        minLength: 3
    });
})


// Handler for keypresses in Enter ingredients box
$('#ingredients-input').keyup(function() {
    // On any button press, close the autocomplete box
    $( "#ingredients-input" ).autocomplete( "close" );

    // Trigger adding ingredient text after pressing enter key
    if ( event.which == 13 ) {
        // Enter was pressed in the search box
        var text = $("#ingredients-input").val();
        add_ingredient_text(text)
    }
    
})


// Add the current text of input box to the ingredient list
function add_ingredient_text(text) {
    if (text != "") {
        $("#placeholder-list").remove()
        $("#ingredient-list").append(`<li id="list_${counter}" class="list-group-item"><p style="display:inline;" id="text_${counter}">${text}</p> <span id="${counter}" class="close close-list" >&times;</span> <div id="?${counter}" class="close close-list" >?</div> </li>`)
        counter++;    
        $("#ingredients-input").val("")
    }

}




// Move to next page
$('#search-recipes').click(function(){
    // Before we redirect, push the ingredients to the backend. Same code as from beforeunload handler.
   // Push the array to the backend
//    var headers = {
//     'Accept': 'application/json',
//     'Content-Type': 'application/json'
//     };  
    var active
    var activedata

    tab1 = $("#ingredient-modal").data("tab1")
    tab2 = $("#ingredient-modal").data("tab2")
    tab3 = $("#ingredient-modal").data("tab3")    

    if($("#tab-1").hasClass("active")==true) {
        tab1 = get_tab_list()
        active="tab1"
        activedata=tab1
    }
    if($("#tab-2").hasClass("active")==true) {
        tab2 = get_tab_list()
        active="tab2"
        activedata=tab2
    }
    if($("#tab-3").hasClass("active")==true) {
        tab3 = get_tab_list()
        active="tab3"
        activedata=tab3
    }
    var payload = [tab1,tab2,tab3]

    

    // Store the active tab contents as a cooke
    var stringdata = JSON.stringify(activedata)
    var all_tabs_data = JSON.stringify(payload)
    Cookies.set('ingredients', `${stringdata}`)
    Cookies.set('ingredients_tabs', `${all_tabs_data}`)

    // Check if active tab is empty
    if (activedata.length==0) {
        // Show warning bar
        $('#empty-error').delay(500).fadeIn('normal', function() {
            $(this).delay(3500).fadeOut();
            });   
    } else {
        // Then redirect
        window.location.href = `/recipe_results/${active}`  
    }

})

//Close the ingredients modal by clicking the X
$("#ingredient-modal-close").click(function() {
    $("#ingredient-modal").hide()
})


// Close modal by clicking background
$("#ingredient-modal").click(function(event) {
    var modal = document.getElementById('ingredient-modal');
    if (event.target==modal) {
        $("#ingredient-modal").hide()
    }
})


// Delete ingredients modal
// Open when clear button clicked
$("#tab-clear").click(function(event) {
    $("#delete-ingredient-modal").show()
})
// Delete ingredients modal yes
$("#delete-ingredients-yes").click(function() {
    $("#ingredient-list").empty()
    $("#ingredient-list").append(`<li id="placeholder-list" class="list-group-item">Ingredients will appear here</li>`)
    $("#delete-ingredient-modal").hide()
})
        

//Close the delete ingredients modal by clicking the X
$("#delete-ingredient-modal-close").click(function() {
    $("#delete-ingredient-modal").hide()
})

// Close delete ingredients modal by clicking cancel
$("#delete-ingredients-no").click(function() {
    $("#delete-ingredient-modal").hide()
})


// Close modal by clicking background
$("#delete-ingredient-modal").click(function(event) {
    var modal = document.getElementById('delete-ingredient-modal');
    if (event.target==modal) {
        $("#delete-ingredient-modal").hide()
    }
})


// Listener for ingredient merge tabs on login
// Overwrite
$("#overwrite-ingredients").click(function(event) {

    // Fetch the tab content from the backend
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
        tab1=data[0]
        tab2=data[1]
        tab3=data[2]
        $("#ingredient-modal").data("tab1", tab1)
        $("#ingredient-modal").data("tab2", tab2)
        $("#ingredient-modal").data("tab3", tab3)
        // Then write to tab1, the default open tab
        $("#ingredient-list").empty()
        write_tab_list(tab1)


        // Return to tab-1 active
        tab1Element.style.backgroundColor = activeColour;
        tab2Element.style.backgroundColor = inactiveColour;
        tab3Element.style.backgroundColor = inactiveColour;
        $("#tab-1").addClass("active")
        $("#tab-2").removeClass("active")
        $("#tab-3").removeClass("active")

        $('#ingredient-merge-modal').hide()
    })


})


// Listener for ingredient merge tabs on login
// Merge
$("#merge-ingredients").click(function(event) {

    // Fetch the tab content from the backend
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
        if ($("#tab-1").hasClass("active")==true) {
            tab1 = get_tab_list()
            $("#ingredient-modal").data("tab1", tab1)
        }        
        if ($("#tab-2").hasClass("active")==true) {
            tab2 = get_tab_list()
            $("#ingredient-modal").data("tab2", tab2)
        }
        if ($("#tab-3").hasClass("active")==true) {
            tab3 = get_tab_list()
            $("#ingredient-modal").data("tab3", tab3)
        }
        tab1=tab1.concat(data[0])
        tab2=tab2.concat(data[1])
        tab3=tab3.concat(data[2])
        $("#ingredient-modal").data("tab1", tab1)
        $("#ingredient-modal").data("tab2", tab2)
        $("#ingredient-modal").data("tab3", tab3)
        $("#ingredient-list").empty()
        // Then write to tab1, the default open tab
        write_tab_list(tab1)

        // Return to tab-1 active
        tab1Element.style.backgroundColor = activeColour;
        tab2Element.style.backgroundColor = inactiveColour;
        tab3Element.style.backgroundColor = inactiveColour;
        $("#tab-1").addClass("active")
        $("#tab-2").removeClass("active")
        $("#tab-3").removeClass("active")

        $('#ingredient-merge-modal').hide()

    })


})



// Tab colors
var activeColour = "#f9a504";
var inactiveColour = "#823400";

//Get tabs and set their initial colors
var tab1Element = document.getElementById("tab-1");
var tab2Element = document.getElementById("tab-2");
var tab3Element = document.getElementById("tab-3");
tab1Element.style.backgroundColor = activeColour;
tab2Element.style.backgroundColor = inactiveColour;
tab3Element.style.backgroundColor = inactiveColour;

// For the tabs
$("#tab-1").click(function(){
    // Check if the tab is currently active.
    if($("#tab-1").hasClass("active")==true) {
        // Tab is already active, do nothing
    } else {
        // Pull from the saved data
        tab1 = $("#ingredient-modal").data("tab1")
        tab2 = $("#ingredient-modal").data("tab2")
        tab3 = $("#ingredient-modal").data("tab3")    
        // Check which tab is active and save accordingly
        if ($("#tab-2").hasClass("active")==true) {
            tab2 = get_tab_list()
            $("#ingredient-modal").data("tab2", tab2)
        }
        if ($("#tab-3").hasClass("active")==true) {
            tab3 = get_tab_list()
            $("#ingredient-modal").data("tab3", tab3)
        }

        // Remove active from the other two tabs
        $("#tab-2").removeClass("active")
        $("#tab-3").removeClass("active")

        // Set this tab as active
        $("#tab-1").addClass("active")
        updateTabCol(tab1Element, tab2Element, tab3Element)
        // Empty the ingredient list
        $("#ingredient-list").empty()
        // Repopulate with tab1 contents
        write_tab_list(tab1)
        // Saved back to the data store
        $("#ingredient-modal").data("tab1", tab1)
        $("#ingredient-modal").data("tab2", tab2)
        $("#ingredient-modal").data("tab3", tab3)
    }
})

$("#tab-2").click(function(){
    // Check if the tab is currently active.
    if($("#tab-2").hasClass("active")==true) {
        // Tab is already active, do nothing
    } else {
        // Check which tab is active and save accordingly
        tab1 = $("#ingredient-modal").data("tab1")
        tab2 = $("#ingredient-modal").data("tab2")
        tab3 = $("#ingredient-modal").data("tab3")   
        if ($("#tab-1").hasClass("active")==true) {
            tab1 = get_tab_list()
            $("#ingredient-modal").data("tab1", tab1)
        }
        if ($("#tab-3").hasClass("active")==true) {
            tab3 = get_tab_list()
            $("#ingredient-modal").data("tab3", tab3)
        }
        // Remove active from the other two tabs
        $("#tab-1").removeClass("active")
        $("#tab-3").removeClass("active")

        // Set this tab as active
        $("#tab-2").addClass("active")
        updateTabCol(tab2Element, tab3Element, tab1Element)
        // Empty the ingredient list
        $("#ingredient-list").empty()
        // Repopulate with saved content
        write_tab_list(tab2)

        $("#ingredient-modal").data("tab1", tab1)
        $("#ingredient-modal").data("tab2", tab2)
        $("#ingredient-modal").data("tab3", tab3)
    }
})

$("#tab-3").click(function(){
    // Check if the tab is currently active.
    if($("#tab-3").hasClass("active")==true) {
        // Tab is already active, do nothing
    } else {
        // Check which tab is active and save accordingly
        tab1 = $("#ingredient-modal").data("tab1")
        tab2 = $("#ingredient-modal").data("tab2")
        tab3 = $("#ingredient-modal").data("tab3")   
        if ($("#tab-1").hasClass("active")==true) {
            tab1 = get_tab_list()
            $("#ingredient-modal").data("tab1", tab1)
        }
        if ($("#tab-2").hasClass("active")==true) {
            tab2 = get_tab_list()
            $("#ingredient-modal").data("tab2", tab2)
        }
        // Remove active from the other two tabs
        $("#tab-1").removeClass("active")
        $("#tab-2").removeClass("active")

        // Set this tab as active
        $("#tab-3").addClass("active")
        updateTabCol(tab3Element, tab2Element, tab1Element)
        // Empty the ingredient list
        $("#ingredient-list").empty()
        // Repopulate with saved content
        write_tab_list(tab3)
        $("#ingredient-modal").data("tab1", tab1)
        $("#ingredient-modal").data("tab2", tab2)
        $("#ingredient-modal").data("tab3", tab3)
    }
})

// Takes the three tabs and sets the appropriate colours
function updateTabCol (active, inactive1, inactive2) {
    active.style.backgroundColor = activeColour;
    inactive1.style.backgroundColor = inactiveColour;
    inactive2.style.backgroundColor = inactiveColour;
}

// Category card management

// Return to category card button
$("#return-categories").click(function() {
        // Hide the return to category card button
        $("#return-categories").hide()
        // Hide all food cards
        $(".ingredient-card").hide()
        // Unhide category cards
        $(".category-card").show()
})

// Vegetable category card listener
$("#card-vegetables").click(function() {
    // Hide the category cards
    $("#card-vegetables").hide()
    $("#card-grains").hide()
    $("#card-meat").hide()    
    $("#card-sauce").hide()    

    // Unhide the return to category card button
    $("#return-categories").show()  
    // Show the vegetable cards
    $("#card-tomato").show()
    $("#card-carrot").show() 
    $("#card-potato").show()
})

// Grains category card listener
$("#card-grains").click(function() {
    // Hide the category cards
    $("#card-vegetables").hide()
    $("#card-grains").hide()
    $("#card-meat").hide()    
    $("#card-sauce").hide() 
    
    // Unhide the return to category card button
    $("#return-categories").show()  
    // Show the vegetable cards
    $("#card-rice").show()
    $("#card-bread").show() 
    $("#card-flatbread").show() 
})


// Hardcoded for the add by category
$("#add-tomato").click(function() {
    $("#placeholder-list").remove()
    $("#ingredient-list").append(`<li id="list_${counter}" class="list-group-item"><p style="display:inline;" id="text_${counter}">Tomato</p><span id="${counter}" class="close close-list" >&times;</span> <div id="?${counter}" class="close close-list" >?</div> </li>`)
    counter++;
    $("#card-tomato").hide()
})
$("#add-carrot").click(function() {
    $("#placeholder-list").remove()
    $("#ingredient-list").append(`<li id="list_${counter}" class="list-group-item"><p style="display:inline;" id="text_${counter}">Carrot</p><span id="${counter}" class="close close-list" >&times;</span> <div id="?${counter}" class="close close-list" >?</div> </li>`)
    counter++;
    $("#card-carrot").hide()
})
$("#add-potato").click(function() {
    $("#placeholder-list").remove()
    $("#ingredient-list").append(`<li id="list_${counter}" class="list-group-item"><p style="display:inline;" id="text_${counter}">Potato</p><span id="${counter}" class="close close-list" >&times;</span> <div id="?${counter}" class="close close-list" >?</div> </li>`)
    counter++;
    $("#card-potato").hide()
})


$("#add-rice").click(function() {
    $("#placeholder-list").remove()
    $("#ingredient-list").append(`<li id="list_${counter}" class="list-group-item"><p style="display:inline;" id="text_${counter}">Rice</p><span id="${counter}" class="close close-list" >&times;</span> <div id="?${counter}" class="close close-list" >?</div> </li>`)
    counter++;
    $("#card-rice").hide()
})
$("#add-bread").click(function() {
    $("#placeholder-list").remove()
    $("#ingredient-list").append(`<li id="list_${counter}" class="list-group-item"><p style="display:inline;" id="text_${counter}">Bread</p><span id="${counter}" class="close close-list" >&times;</span> <div id="?${counter}" class="close close-list" >?</div> </li>`)
    counter++;
    $("#card-bread").hide()
})
$("#add-flatbread").click(function() {
    $("#placeholder-list").remove()
    $("#ingredient-list").append(`<li id="list_${counter}" class="list-group-item"><p style="display:inline;" id="text_${counter}">Flatbread</p><span id="${counter}" class="close close-list" >&times;</span> <div id="?${counter}" class="close close-list" >?</div> </li>`)
    counter++;
    $("#card-flatbread").hide()
})




