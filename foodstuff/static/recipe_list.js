var fetch_addr = "http://localhost:5000";
console.log(Cookies.get('name'))
$('#back-ingredients').click(function(){
    window.location.href = '/edit_ingredients'
})

$('#fried-rice-start').click(function(){
    window.location.href = '/recipe/fried_rice'
})
$('#beef-strog-start').click(function(){
    window.location.href = '/recipe/beef-stroganoff'
})

var logged_in = false

// Get the ignredient list from the cookie passed along
var ingredient_array = JSON.parse(Cookies.get('ingredients'))

// Fetch exectuted on page load to get recipe results.
// Headers required for the fetch request.

// Use a regular expression to get tabnumber out of the url
var myre = /recipe_results\/tab/

var reresult = window.location.href.split(myre)

var headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};
fetch(`${fetch_addr}/api/recipe_ingredients_results`,{
    headers,
    method: "POST",
    body: JSON.stringify([reresult[1],ingredient_array])
}).then((response)=>response.json())
.then(function(data) {
    console.log(data)
    // data[0] is isloggedin
    if (data[0] == true) {
        logged_in=true;
    }
    for (var i = 1; i < data.length; i++) {
        // data[x][0]=shortname,[1]=name, [2]=has_ing, [3]=missing, [4]=imgsrc, [5]=isliked, [6]=have ingredient list, [7]=missing ingredient list
        // Shortname is used for element id's, name is for display, hasing a bool for whether user has required ingredients, missing is number of missing ingredients
        // Hide loading symbol
        $("#cooking").hide()
        $("#pg-cont").show()
        if (data[0]==true) {
            // User is loggedin
            if (data[i][5]==true){
                // Recipe is favourited
                $('#results-div').append(
                    `<div id="card-${data[i][0]}" class="card recipe-card" style="width: 18rem;">
                    <img src="${data[i][4]}" class="card-img-top card-image" alt="...">
                        <div class="card-body">
                            <h5 class="card-title">${data[i][1]}</h5>
                            <button id="ingredients-${data[i][0]}" type="button" class="btn ${data[i][2] ? 'btn-outline-success' : 'btn-outline-warning' } card-button">${data[i][2] ? "You have everything you need" : "You are missing " + data[i][3] + ' ingredients'}</button>
                            <a class="btn btn-primary" href="/recipe_details/${data[i][0]}">Get Started</a>
                            <span id="like-${data[i][0]}" class="like-button like-liked">&hearts;</span>
                        </div> 
                    </div>
                `)
            } else {
                // Recipe is not favourited
                $('#results-div').append(
                    `<div id="card-${data[i][0]}" class="card recipe-card" style="width: 18rem;">
                    <img src="${data[i][4]}" class="card-img-top card-image" alt="...">
                        <div class="card-body">
                            <h5 class="card-title">${data[i][1]}</h5>
                            <button id="ingredients-${data[i][0]}" type="button" class="btn ${data[i][2] ? 'btn-outline-success' : 'btn-outline-warning' } card-button">${data[i][2] ? "You have everything you need" : "You are missing " + data[i][3] + ' ingredients'}</button>
                            <a class="btn btn-primary" href="/recipe_details/${data[i][0]}">Get Started</a>
                            <span id="like-${data[i][0]}" class="like-button">&hearts;</span>
                        </div> 
                    </div>
                `)
            }

            like_button_handler(data[i][0])
        } else {
            // User is not logged in
            $('#results-div').append(
                `<div id="card-${data[i][0]}" class="card recipe-card" style="width: 18rem;">
                <img src="${data[i][4]}" class="card-img-top card-image" alt="...">
                    <div class="card-body">
                        <h5 class="card-title">${data[i][1]}</h5>
                        <button id="ingredients-${data[i][0]}" type="button" class="btn ${data[i][2] ? 'btn-outline-success' : 'btn-outline-warning' } card-button">${data[i][2] ? "You have everything you need" : "You are missing " + data[i][3] + ' ingredients'}</button>
                        <a class="btn btn-primary" href="/recipe_details/${data[i][0]}">Get Started</a>
                    </div> 
                </div>
                `)   
        }
        if (logged_in==true){
            modal_handler(data[i][0],data[i][6], data[i][7])
        } else {
            modal_handler_local(data[i][0],data[i][6], data[i][7])
        }
    }
})

function like_button_handler(btn_name) {
    $(`#like-${btn_name}`).click(function() {
        if ($(`#like-${btn_name}`).hasClass("like-liked")) {

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
            $(`#like-${btn_name}`).removeClass("like-liked")
        } else {
            // Fetch request
            // Add a favourited recipe
            var payload = btn_name
            var headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };
            fetch(`${fetch_addr}/api/add_favourite_recipe`,{
                headers,
                method: "POST",
                body: JSON.stringify(payload)
            })
            $(`#like-${btn_name}`).addClass("like-liked")
        }
    })
}


function modal_handler_local(in_name,have_ing, miss_ing) {
    // console.log("ok")
    $(`#ingredients-${in_name}`).click(function() { 
        console.log(have_ing)
        console.log(miss_ing)
        $("#ingredients-modal-has").empty()
        for (var i=0; i < have_ing.length;i++) {
            var upper_name = have_ing[i][1][0].toUpperCase() + have_ing[i][1].slice(1)
            
            $("#ingredients-modal-has").append(`<li>${upper_name}</li>`)
        }
        if (miss_ing.length!=0) {
            $("#modal-missing-ingredients").show()
            $("#ingredients-modal-missing").empty()
            for (var i=0; i < miss_ing.length;i++) {
                var upper_name = miss_ing[i][1][0].toUpperCase() + miss_ing[i][1].slice(1)
                $("#ingredients-modal-missing").append(`<li>${upper_name}</li>`)
            }
        } else {
            $("#modal-missing-ingredients").hide() 
        }
        $("#ingredients-modal").show()
    })
}


function modal_handler(in_name,have_ing, miss_ing) {
    // Headers required for the fetch request.
    $(`#ingredients-${in_name}`).click(function() {

        var headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        fetch(`${fetch_addr}/api/recipe_ingredients_ingredients`,{
            headers,
            method: "POST",
            body: JSON.stringify([in_name,have_ing,miss_ing])
        }).then((response)=>response.json())
        .then(function(data) {
            console.log(data)
             var in_data=data
    
             $("#ingredients-modal-has").empty()
             var need_to_shop = false
             var missing_ing=[]
             for (var j=0; j < in_data.length;j++) {
                 switch (in_data[j][0]) {
                    case 0:
                        $("#ingredients-modal-has").append(`<li>${in_data[j][1]}</li>`)
                        break;
                    case 1:
                        if (logged_in==true) {
                            if (need_to_shop==false) {
                                $("#modal-missing-ingredients").show()
                                $("#ingredients-modal-missing").empty()
                                need_to_shop=true
                            }
                            $("#ingredients-modal-missing").append(`<li>${in_data[j][1]}<button id='add-shop-${in_data[j][2]}' class='btn btn-outline-danger add-ingredient-btn' style = 'float:right;'>Add to shopping list</button></li>`)
                            missing_ing.push(in_data[j][2])
                            add_shop_handler(in_data[j][2])
                        } else {
                            // Not logged in, so don't need shopping handlers, just append entry
                            $("#ingredients-modal-missing").append(`<li>${in_data[j][1]}</li>`)
                        }
                        break;
                    case 2:
                        if (logged_in==true) {
                            if (need_to_shop==false) {
                                $("#modal-missing-ingredients").show()
                                $("#ingredients-modal-missing").empty()
                                need_to_shop=true
                            }
                            $("#ingredients-modal-missing").append(`<li>${in_data[j][1]}<button id='add-shop-${in_data[j][2]}' class='btn btn-success add-ingredient-btn' style = 'float:right;'>Added</button></li>`)
                            missing_ing.push(in_data[j][2])
                            add_shop_handler(in_data[j][2])
                        } else {
                            $("#ingredients-modal-missing").append(`<li>${in_data[j][1]}</li>`)
                        }
                        break;
                 }
     
             }
             if (need_to_shop==true) {
                 $("#ingredients-modal-missing").append(`<button id="shop-all-${in_name}" class='btn btn-danger' style = 'float:right;'>Add all to shopping list</button>`)
                 add_shop_all_handler(in_name,missing_ing)
             }
             $("#ingredients-modal").show()

        })


    })
}


// Handler for the add to shopping list button in the modal. It handles both adding and removal
function add_shop_handler(ing_name) {
    console.log(`add-shop-${ing_name}`)

    $(`#add-shop-${ing_name}`).click(function() {

        var payload = ing_name;

        if($(`#add-shop-${ing_name}`).hasClass('btn-outline-danger')) {
            // We are adding an ingredient to shopping list
    
            // Send the backend fetch request
            
            // Header needed to make the fetch request work
            var headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };
            fetch(`${fetch_addr}/api/add_ingredient_shop_list`,{
                headers,
                method: "POST",
                body: JSON.stringify(payload)
            })
            $(`#add-shop-${ing_name}`).removeClass('btn-outline-danger')
            $(`#add-shop-${ing_name}`).addClass('btn-success')
            $(`#add-shop-${ing_name}`).text("Added")
        } else {

        // We are removing an ingredient to shopping list   
        
        // Send the backend fetch request
        
        // Header needed to make the fetch request work
        var headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        // console.log(payload)
        fetch(`${fetch_addr}/api/remove_ingredient_shop_list`,{
            headers,
            method: "POST",
            body: JSON.stringify(payload)
        })
        $(`#add-shop-${ing_name}`).removeClass('btn-success')
        $(`#add-shop-${ing_name}`).addClass('btn-outline-danger')
        $(`#add-shop-${ing_name}`).text("Add to shopping list")
    }
    })
}


// Function for the add all to shopping list handler.
function add_shop_all_handler(name,ing_list) {
    $(`#shop-all-${name}`).click(function() {
        console.log("done")
        var payload = ing_list;
        
        // Header needed to make the fetch request work
        var headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        fetch(`${fetch_addr}/api/add_ingredient_shop_all_list`,{
            headers,
            method: "POST",
            body: JSON.stringify(payload)
        })

        $(`.add-ingredient-btn`).addClass('btn-success')
        $(`.add-ingredient-btn`).removeClass('btn-outline-danger')
        $(`.add-ingredient-btn`).text("Added")

    })
}



$("#ingredients-modal-close").click(function() {
    $("#ingredients-modal").hide()
})


//Show and populate the ingredients modal when the recipe is clicked on
$("#ingredients-fried-rice").click(function() {
    $("#ingredients-modal-has").empty()
    $("#ingredients-modal-has").append("<li>Rice</li><li>Prawns</li><li>Eggs</li><li>Spring Onion</li>")
    $("#modal-missing-ingredients").hide()    
    $("#ingredients-modal").show()
})

//Show and populate the ingredients modal when the recipe is clicked on
$("#ingredients-beef-stroganoff").click(function() {
    $("#ingredients-modal-has").empty();
    $("#ingredients-modal-has").append("<li>Beef</li><li>Rice</li><li>Sour Cream</li><li>Butter</li>")

    $("#modal-missing-ingredients").show()
    $("#ingredients-modal-missing").empty()
    $("#ingredients-modal-missing").append("<li>Paprika<button class='btn btn-outline-danger add-ingredient-btn' style = 'float:right;'>Add to shopping list</button></li>"+
        "<li>Onion<button class='btn btn-outline-danger add-ingredient-btn' style = 'float:right;'>Add to shopping list</button></li>"+
        "<li>Mushrooms<button class='btn btn-outline-danger add-ingredient-btn' style = 'float:right;'>Add to shopping list</button></li>"+
        "<button class='btn btn-danger' style = 'float:right;'>Add all to shopping list</button>")
    $("#ingredients-modal").show()

    // if (event.target && event.target.nodeName == "add-to-shopping-list")
})

// Close modal by clicking background
$("#ingredients-modal").click(function(event) {
    var modal = document.getElementById('ingredients-modal');
    if (event.target==modal) {
        $("#ingredients-modal").hide()
    }
})

// Like button click
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