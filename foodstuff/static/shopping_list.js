var dictionary = new Set();

addAccordian();

function addToCart(ingredient, supplierName, price){
	console.log('['+ingredient+']');
  newIngredient = {};
  newIngredient["ingredient"] = ingredient;
  newIngredient["ingredient_supplier"] = supplierName;
  newIngredient["quantity"] = "1";
  newIngredient["price"] = price;
  dictionary.add(newIngredient);
	document.getElementById("shoppingCart_content").innerHTML += "<div id = "+ingredient+"_addedToCart><h2>"+ingredient+"</h2><h3>"+supplierName+"</h3></div>";
  document.getElementById("addToCart_"+ingredient).disabled = true;
  document.getElementById("checkoutbutton").disabled = false;
}

function checkout(name, email, address) {

  shoppingCart = document.getElementById("shoppingCart");

   checkoutPage = `<!-- Display shopping list -->
    <h2 class="cream_text">Checkout</h2>
    <br>
    <label class="accordion1" style = "margin-bottom:0rem">Confirm Ingredients</label>
          <div class="panel" style = "display:block">
              <article class="media content-section">
              <div class="container">
                  <div class="media-body">
                      <div class="row">
                        <h3>You have <b>`+dictionary.size+`</b> item`;
    if (dictionary.size !== 1){
      checkoutPage += 's';
    }

    checkoutPage += ` in your cart:</h3>
                        <table style="width:100%">
                                <tr>
                                    
                                  <th>Item</th>
                                  <th>Location</th> 
                                  <th>Cost</th>
                                </tr>`;

 

  
  dictString = '';
  for (const key of dictionary.keys()){
    console.log("Got in the for loop");
    if (dictString !== ''){
      dictString += ';';
    }
    console.log(JSON.stringify(key));
    checkoutPage += `
    <tr>
    <td>`+key["ingredient"]+`</td>`;
    checkoutPage += `<td>`+key["ingredient_supplier"]+`</td>`;
    checkoutPage += `<td>$`+key["price"]+`</td>
    </tr>`;
    dictString += JSON.stringify(key);

  }

  console.log(dictString);
   checkoutPage+=`
                </table>
                </div>
              </div>
              </div>
          </article>
      </div>
<form method = "POST">
  <label class="accordion1" style = "margin-bottom:0rem">Confirm Delivery Address</label>
    <div class="panel" style = "display: block">
      <article class="media content-section">
        <div class="container">
          <div class="media-body">
            
            <div class="row">
              <div class="col-75">
                <div class="container">
                  <form action="">
                  
                    <div class="row">
                      <div class="col-50">
                        <h3>Billing Address</h3>
                        <label for="fname"><i class="fa fa-user"></i> Full Name</label>
                        <input type="text" id="fname" name="firstname" value ="`+name+`">
                        <label for="email"><i class="fa fa-envelope"></i> Email</label>
                        <input type="text" id="email" name="email" value ="`+email+`">
                        <label for="adr"><i class="fa fa-address-card-o"></i> Address</label>
                        <input type="text" id="adr" name="address" value="`+address+`">
                        <label for="city"><i class="fa fa-institution"></i> City</label>
                        <input type="text" id="city" name="city" placeholder="">
                        <label for="state">State</label>
                        <input type="text" id="state" name="state" placeholder="">
                        <label for="zip">Zip</label>
                        <input type="text" id="zip" name="zip" placeholder="">
                         
                      </div>

                      <div class="col-50">
                        <h3>Payment</h3>
                        <label for="fname">Accepted Cards</label>
                        <div class="icon-container">
                          <i class="fa fa-cc-visa" style="color:navy;"></i>
                          <i class="fa fa-cc-amex" style="color:blue;"></i>
                          <i class="fa fa-cc-mastercard" style="color:red;"></i>
                          <i class="fa fa-cc-discover" style="color:orange;"></i>
                        </div>
                        <label for="cname">Name on Card</label>
                        <input type="text" id="cname" name="cardname" value="`+name+`">
                        <label for="ccnum">Credit card number</label>
                        <input type="text" id="ccnum" name="cardnumber" placeholder="xxxx-xxxx-xxxx-xxxx">
                        <label for="expmonth">Exp Month</label>
                        <input type="text" id="expmonth" name="expmonth" placeholder="January">
                        <label for="expyear">Exp Year</label>
                        <input type="text" id="expyear" name="expyear" placeholder="xxxx">
                        <label for="cvv">CVV</label>
                        <input type="text" id="cvv" name="cvv" placeholder="xxx">
                        
                        </div>
                      </div>
                      
                    </div>
                    Do you want to clear the purchased ingredients from your shopping list after purchase?
                    <label>
                      <input type="radio" name="clear" value="yes" /> Yes
                      <input type="radio" name="clear" value="no" checked/> No
                    </label>
                    <input type="submit" value="Make payment" class="btn btn-danger">
                    <input type="text" id="dictionary" name ="dictionary" value='`+dictString+`' style ="background-color:#ffffff00; color:#ffffff00; height:0px; border:#ffffff00">
                  </form>
                </div>
              </div>
          </div>
        </div>
      </article>
    </div>
    <br>`;
 

  //console.log(document.getElementById("shoppingCart").innerHTML);
  shoppingCart.style.width = "0";
  //console.log(checkoutPage);
  document.getElementById("main_shoppingList").innerHTML = checkoutPage;
}


function addAccordian(){
  var acc = document.getElementsByClassName("accordion");
  var i;


  for (i = 0; i < acc.length; i++) {
    acc[i].addEventListener("click", function() {
      var acc1 = document.getElementsByClassName("accordion");
      this.classList.toggle("active");
      var panel = this.nextElementSibling;
      if (panel.style.display === "block") {
        panel.style.display = "none";
      } else {
        panel.style.display = "block";
      }
    });
  }
}

