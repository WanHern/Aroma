var trend_recipe_array = [[1,"Fried Rice",false,0,"https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Yeung_Chow_Fried_Rice_in_Hong_Kong_Fast_Food_Shop.JPG/220px-Yeung_Chow_Fried_Rice_in_Hong_Kong_Fast_Food_Shop.JPG","http://localhost:5000/recipe_details/fried_rice"],[2,"Beef Stroganoff",false,0,"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Beef_Stroganoff-02_cropped.jpg/250px-Beef_Stroganoff-02_cropped.jpg","http://localhost:5000/recipe_details/beef_stroganoff"]]

for (var i = 0; i < trend_recipe_array.length; i++) {
    $('#trend-recipe-holder').append(
        `<div id="card-${trend_recipe_array[i][0]}" class="card recipe-card" style="width: 18rem;">
        <img src="${trend_recipe_array[i][4]}" class="card-img-top card-image" alt="...">
            <div class="card-body">
                <h5 class="card-title">${trend_recipe_array[i][1]}</h5>
                <a class="btn btn-primary" href="${trend_recipe_array[i][5]}">Get Started</a>
            </div> 
        </div>
        `)  
}