var fetch_addr = "http://localhost:5000";
var logged_in=false;
var headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};
fetch(`${fetch_addr}/api/isloggedin`,{
    headers,
    method: "POST",
}).then((response)=>response.json())
.then(function(data) {
    console.log(data)
    if (data.loggedin=="true") {
        logged_in=true
        if(logged_in==true) {
            console.log("true")
        }
    }
})



// Category card management

// Return to category card button
$("#return-categories").click(function() {
        // Hide the return to category card button
        $("#return-categories").hide()
        // Hide all food cards
        $(".recipe-card").hide()
        // Unhide category cards
        $(".category-card").show()
})

var cuisines = [["Chinese","https://www.sbs.com.au/food/sites/sbs.com.au.food/files/styles/full/public/dfclowres-14.jpg"],["Italian","https://travelfoodatlas.com/wp-content/uploads/2018/02/Italian-food.jpeg"],["Japanese","https://cdn2.lamag.com/wp-content/uploads/sites/6/2017/08/MAIN-2-1.jpg"],["Korean","https://cdn2.atlantamagazine.com/wp-content/uploads/sites/4/2018/04/0418_KoreanFoodBanchan_GregoryMiller_oneuseonly.jpg"],["Indian","https://wine4food.com/wp-content/uploads/2019/01/bigstock-Selection-of-Indian-food-inclu-12014759.jpg"],["Mexican","https://media-cdn.tripadvisor.com/media/photo-s/0f/16/5d/ba/authentic-mexican-food.jpg"]]
// Generate category cards for each cuisine.
for (var i=0;i<cuisines.length;i++) {
    console.log("ok")
    $("#card-carrier").append(`
    <div id="card-${cuisines[i][0]}" class="card category-card">
        <img src="${cuisines[i][1]}" class="card-img-top card-image" alt="...">
        <div class="card-body">
            <h5 class="card-title">${cuisines[i][0]}</h5>
        </div>
    </div>  
    `)
    category_handler(cuisines[i][0])
}
$("#search-btn").click(function() {
    var search = $("#cuisine-input").val()
    console.log(search)
    if (search!='') {
        $("#loader").show()
        $("#cooking").show()
        $("#return-cat").hide()
        $("#choose-bar").hide()
        $("#card-carrier").empty()
        var headers = 
        {'X-RapidAPI-Host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com',
        'X-RapidAPI-Key':''
        }
        var search = $("#cuisine-input").val()
        fetch(`https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/search?query=${search}&number=8`,{
            headers,
            method: "GET",
        })
        .then((response)=>response.json())
        .then(function(data) {
            if(logged_in==true) {
                var headers = {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                };
                fetch(`${fetch_addr}/api/get_favourite_id`,{
                    headers,
                    method: "POST",
                }).then((response)=>response.json())
                .then(function(data2) {
                    $("#loader").hide()
                    $("#cooking").hide()
                    console.log(data)
                    for (var i=0;i<data.results.length;i++) {
                        console.log("here")
                        if (data2.includes(data.results[i].id)) {
                            $("#card-carrier").append(`
                            <div id="card-${data.results[i].id}" class="card recipe-card chinese">
                                <img src="${data.baseUri}${data.results[i].image}" class="card-img-top card-image" alt="...">
                                <div class="card-body">
                                    <h5 class="card-title">${data.results[i].title}</h5>
                                    <a class="btn btn-primary" href="/recipe_details/${data.results[i].id}">Get Started</a>
                                    <span id="like-${data.results[i].id}" class="like-button like-liked">&hearts;</span>
                                </div>
                            </div>
                            `)
                        } else {
                            $("#card-carrier").append(`
                            <div id="card-${data.results[i].id}" class="card recipe-card chinese">
                                <img src="${data.baseUri}${data.results[i].image}" class="card-img-top card-image" alt="...">
                                <div class="card-body">
                                    <h5 class="card-title">${data.results[i].title}</h5>
                                    <a class="btn btn-primary" href="/recipe_details/${data.results[i].id}">Get Started</a>
                                    <span id="like-${data.results[i].id}" class="like-button">&hearts;</span>
                                </div>
                            </div>
                            `)
                        }
                        like_button_handler(data.results[i].id)
                    }

                })
            } else {
                $("#loader").hide()
                $("#cooking").hide()
                for (var i=0;i<data.results.length;i++) {
                    console.log("here")
                    $("#card-carrier").append(`
                    <div id="card-${data.results[i].id}" class="card recipe-card chinese">
                        <img src="${data.baseUri}${data.results[i].image}" class="card-img-top card-image" alt="...">
                        <div class="card-body">
                            <h5 class="card-title">${data.results[i].title}</h5>
                            <a class="btn btn-primary" href="/recipe_details/${data.results[i].id}">Get Started</a>
                        </div>
                    </div>
                    `)
                }
            }
        })
    } else {
        $('#empty-error').delay(500).fadeIn('normal', function() {
            $(this).delay(3500).fadeOut();
            });  
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

function category_handler(cuisine_name) {
    $(`#card-${cuisine_name}`).click(function() {
        // Show the return to category card button
        $("#return-categories").show()
        // Hide category cards
        $(".category-card").hide()
        // Show loading symbol
        $("#loader").show()
        $("#cooking").show()
        // Exec fetch request for spoonacular data
        
        var headers = 
            {'X-RapidAPI-Host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com',
            'X-RapidAPI-Key':''
            }
        fetch(`https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/search?query=${cuisine_name}&number=10`,{
            headers,
            method: "GET",
        })
        .then((response)=>response.json())
        .then(function(data) {
            console.log(data)
            if(logged_in==true) {
                var headers = {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                };
                fetch(`${fetch_addr}/api/get_favourite_id`,{
                    headers,
                    method: "POST",
                }).then((response)=>response.json())
                .then(function(data2) {
                    $("#loader").hide()
                    $("#cooking").hide()
                    console.log(data)
                    for (var i=0;i<data.results.length;i++) {
                        console.log("here")
                        if (data2.includes(data.results[i].id)) {
                            $("#card-carrier").append(`
                            <div id="card-${data.results[i].id}" class="card recipe-card chinese">
                                <img src="${data.baseUri}${data.results[i].image}" class="card-img-top card-image" alt="...">
                                <div class="card-body">
                                    <h5 class="card-title">${data.results[i].title}</h5>
                                    <a class="btn btn-primary" href="/recipe_details/${data.results[i].id}">Get Started</a>
                                    <span id="like-${data.results[i].id}" class="like-button like-liked">&hearts;</span>
                                </div>
                            </div>
                            `)
                        } else {
                            $("#card-carrier").append(`
                            <div id="card-${data.results[i].id}" class="card recipe-card chinese">
                                <img src="${data.baseUri}${data.results[i].image}" class="card-img-top card-image" alt="...">
                                <div class="card-body">
                                    <h5 class="card-title">${data.results[i].title}</h5>
                                    <a class="btn btn-primary" href="/recipe_details/${data.results[i].id}">Get Started</a>
                                    <span id="like-${data.results[i].id}" class="like-button">&hearts;</span>
                                </div>
                            </div>
                            `)
                        }
                        like_button_handler(data.results[i].id)
                    }

                })
            } else {
                $("#loader").hide()
                for (var i=0;i<data.results.length;i++) {
                    console.log("here")
                    $("#card-carrier").append(`
                    <div id="card-${data.results[i].id}" class="card recipe-card chinese">
                        <img src="${data.baseUri}${data.results[i].image}" class="card-img-top card-image" alt="...">
                        <div class="card-body">
                            <h5 class="card-title">${data.results[i].title}</h5>
                            <a class="btn btn-primary" href="/recipe_details/${data.results[i].id}">Get Started</a>
                        </div>
                    </div>
                    `)
                }
            }
        })
    })
}

