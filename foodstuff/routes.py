import os
import secrets
import urllib.parse
import json
import numpy as np
import datetime
import re
import requests
import ast

from PIL import Image

from flask import render_template, url_for, flash, redirect, request, abort, jsonify,make_response
from flask_login import login_user, logout_user, current_user, login_required
from flask_mail import Message

from foodstuff import app, db, bcrypt, mail
from foodstuff.forms import RegistrationForm, LoginForm, UpdateAccountForm, IngredientForm, RequestResetForm, ResetPasswordForm
from foodstuff.models import User, ApiIngredient, ConIngredient, SupIngredient, Expenses, Liked_recipe, Recipe



#########################
#     COMMON ROUTES     #
#########################

@app.route("/")
@app.route("/foodstuff")
def foodstuff():
    if current_user.is_authenticated:
        return redirect(url_for('home'))

    return render_template('foodstuff.html')

@app.route("/home")
def home():
    if current_user.is_authenticated:
        if current_user.role == "consumer":
            return render_template('home.html')
        elif current_user.role == "admin":
            return render_template('admin_home.html')
        elif current_user.role == "supplier":
            return render_template('supplier_home.html')

    return redirect(url_for('foodstuff'))

@app.route("/login")
def login():
    return redirect(url_for('foodstuff'))

@app.route("/about")
def about():
    return render_template('about.html')

@app.route("/account", methods=['GET', 'POST'])
@login_required
def account():
    form = UpdateAccountForm()
    if form.validate_on_submit():
        if current_user and bcrypt.check_password_hash(current_user.password, form.password.data):
            # Update usual fields
            if form.picture.data:
                picture_file = save_pic(form.picture.data)
                current_user.image_file = picture_file
            current_user.username = form.username.data
            current_user.email = form.email.data
            current_user.budget = form.budget.data
            current_user.address = form.address.data
            # Update expenses
            day_of_month = datetime.datetime.now().day
            week_number = (day_of_month - 1) // 7 + 1
            ex = Expenses.query.filter_by(user_id=current_user.id, week=week_number).first()
            ex.value = ex.value + form.expenses_update.data
            db.session.commit()
            flash('Your account has been updated!', 'info')
            return redirect(url_for('account'))
        else:
            flash('Your password was wrong, please try again!', 'danger')
    elif request.method == 'GET':
        form.username.data = current_user.username
        form.email.data = current_user.email
        form.budget.data = current_user.budget
        form.address.data = current_user.address
        form.expenses_update.data = 0

    # Get expenses graph data
    ex = Expenses.query.filter_by(user_id=current_user.id)
    expenses_month = 0
    li = []
    for e in ex:
        expenses_month += e.value
        li.append(e.value)
    expenses=np.asarray(li)

    weekly_limit = current_user.budget/4

    # Load user's profile picture
    image_file = url_for('static', filename='pics/' + current_user.image_file)

    return render_template('account.html', image_file=image_file, form=form, expenses=expenses, expenses_month=expenses_month, weekly_limit=weekly_limit)

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for('foodstuff_logout'))

@app.route("/foodstuff_loggedout")
def foodstuff_logout():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    resp = make_response(render_template('foodstuff.html'))
    resp.set_cookie('ingredients_tabs', '')
    return resp

@app.route("/register", methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('home'))

    form = RegistrationForm()
    if form.validate_on_submit():
        # Save usual fields
        hashed_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
        user = User(username=form.username.data, email=form.email.data.casefold(), password=hashed_password)
        db.session.add(user)
        db.session.commit()
        user = User.query.filter_by(email=form.email.data.casefold()).first()
        if user.role == "consumer":
            login_user(user)
            flash('Your account has been created! You are now logged in.', 'info')
            # Create weekly expenses for user initialised to 0
            i = 1
            while i < 6:
                new = Expenses(user_id=current_user.id, value=0, week=i)
                db.session.add(new)
                i = i + 1
            db.session.commit()
        return redirect(url_for('home'))

    return render_template('register.html', form = form)

@app.route("/partner")
def partner():
    return render_template('partner.html')


#########################
#     FEATURE ROUTES    #
#########################

# Recipe results page
@app.route("/recipe_results/<tab_in>", methods=['GET','POST'])
def recipe_results(tab_in):

    return render_template('recipe_results.html')

# Recipe details page
@app.route('/recipe_details/<recipe_id>/', methods = ['GET','POST'])
def recipe_details(recipe_id):

    headers = {'X-RapidAPI-Host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com','X-RapidAPI-Key':''}
    url = 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/TOBEREPLACED/information'
    url = re.sub("TOBEREPLACED",recipe_id,url)
    recipeRequest = requests.get(url, headers=headers)
    data = recipeRequest.json()

    name = data[u'title']
    steps_in= data[u'analyzedInstructions'][0][u'steps']
    step_array = []
    for step in steps_in:
        step_array.append(step["step"])
    nutritional_info = ["Healthy"]
    image = data[u'image']

    return render_template('recipe_details.html', name=name, nutritional_info=nutritional_info, steps=step_array, image=image, vegetarian=data[u'vegetarian'],vegan=data[u'vegan'],gf = data[u'glutenFree'],df=data[u'dairyFree'])

# Finding recipe by ingredient search
@app.route("/recipe_search_ingredient", methods=['GET','POST'])
def recipe_search_ingredient():

    return render_template('recipe_search_ingredient.html')
# Finding recipe by cuisine search
@app.route("/recipe_search_cuisine", methods=['GET','POST'])
def recipe_search_cuisine():

    return render_template('recipe_search_cuisine.html')

# Display shopping list
@app.route("/shopping_list", methods=['GET','POST'])
@login_required
def shopping_list():
    # User has made a purchase
    if request.method == 'POST':
        result = request.form
        ingredients = result['dictionary'].split(";")
        totalPrice = 0
        purchased_ingredients = []
        for ingredient in ingredients:
            ingDict = ast.literal_eval(ingredient)
            totalPrice += ingDict["price"]
            purchased_ingredients.append(ingDict["ingredient"])
        # Clear ingredients from shopping list
        if request.form['clear'] == 'yes':
            for ing in purchased_ingredients:
                ingredient_to_remove = ConIngredient.query.filter_by(name=ing,shopping_list=1).first()
                db.session.delete(ingredient_to_remove)
                db.session.commit()
        # Update user expenses
        day_of_month = datetime.datetime.now().day
        week_number = (day_of_month - 1) // 7 + 1
        ex = Expenses.query.filter_by(user_id=current_user.id, week=week_number).first()
        ex.value = ex.value+totalPrice
        db.session.commit()
        flash('Payment successful! Your delivery will arrive in less than an hour.','info')
        return render_template("home.html")

    # Displaying the shopping list
    ingredients = ConIngredient.query.filter_by(user_id=current_user.id, shopping_list=1)
    shoppingList = []
    for ing in ingredients:
        supplier_ingredients = SupIngredient.query.filter_by(name=ing.name)
        ingredient_list = []
        for sup_ing in supplier_ingredients:
            ingredient_list.append(sup_ing)
        shoppingList.append(ingredient_list)

    return render_template('shopping_list.html', shoppingList=shoppingList,all_items=ingredients)

# Remove ingredient from shopping list
@app.route("/delete_shopping_ingredient/<int:ingredient_id>", methods=['GET','POST'])
@login_required
def delete_shopping_ingredient(ingredient_id):
    ingredient = ConIngredient.query.get_or_404(ingredient_id)
    flash('['+ingredient.name+']'+' has been removed from your list','info')
    db.session.delete(ingredient)
    db.session.commit()
    return redirect(url_for('shopping_list'))


################################
#     ADDITIONAL FUNCTIONS     #
################################

def save_pic(form_picture):
    random_hex = secrets.token_hex(8)

    _, f_ext = os.path.splitext(form_picture.filename)

    picture_fn = random_hex + f_ext

    picture_path = os.path.join(app.root_path, 'static/pics', picture_fn)
    output_size = (120,320)

    i = Image.open(form_picture)
    i.thumbnail(output_size, Image.ANTIALIAS)
    i.save(picture_path)

    return picture_fn

def validate_shopping_ingredient(word):
    if word == "" or None:
        return False
    for ing in current_user.shopping_list:
        if word == ing.name and ing.shopping_list == 1:
            return False
    return True

def validate_liked_recipe(num):
    for rec in current_user.liked_recipes:
        if int(num) == int(rec.recipe_id):
            return False
    return True

def check_liked_recipe_integrity():
    if current_user.is_authenticated:
        seen=[]
        for rec in current_user.liked_recipes:
            if rec.recipe_id in seen:
                db.session.delete(rec)
                db.session.commit()
            else:
                seen.append(rec.recipe_id)
    return

def capital(str):
    s = list(str)
    s[0]=s[0].upper()
    return ''.join(s)

def getTimeTakenToUNSW(addr):
    URL = "https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=TOBEREPLACED&destinations=UNSW,Sydney&key="
    URL = re.sub("TOBEREPLACED",addr,URL)
    r = requests.get(url = URL)
    data = r.json()
    time = data[u'rows'][0][u'elements'][0][u'duration'][u'text']
    time=re.sub("[a-zA-Z]+","",time)
    return time

################################
#         SUPPLIERS            #
################################

@app.route("/supplier/home", methods=['GET','POST'])
@login_required
def supplier_home():
    if current_user.role != "supplier":
        return redirect(url_for('home'))
    ingredients = SupIngredient.query.filter_by(user_id=current_user.id)
    return render_template('supplier_home.html', ingredients=ingredients)

@app.route("/supplier/account", methods=['GET','POST'])
@login_required
def supplier_account():
    if current_user.role != "supplier":
        return redirect(url_for('home'))
    form = UpdateAccountForm()
    if form.validate_on_submit():
        if current_user and bcrypt.check_password_hash(current_user.password, form.password.data):
            if form.picture.data:
                picture_file = save_pic(form.picture.data)
                current_user.image_file = picture_file
            current_user.username = form.username.data
            current_user.email = form.email.data
            current_user.company_name = form.company_name.data
            current_user.company_email = form.company_email.data
            current_user.company_address = form.company_address.data
            db.session.commit()
            flash('Your account has been updated!', 'info')
            return redirect(url_for('supplier_account'))
        else:
            flash('Your password was wrong, please try again!', 'danger')
    elif request.method == 'GET':
        form.username.data = current_user.username
        form.email.data = current_user.email
        form.company_name.data = current_user.company_name
        form.company_email.data = current_user.company_email
        form.company_address.data = current_user.company_address

    image_file = url_for('static', filename='pics/' + current_user.image_file)

    return render_template('supplier_account.html', image_file=image_file, form=form)

@app.route("/supplier/add_ingredient", methods=['GET','POST'])
@login_required
def add_ingredient():
    if current_user.role != "supplier":
        return redirect(url_for('home'))
    form = IngredientForm()
    if form.validate_on_submit():
        new = SupIngredient(name=form.name.data.lower(), location_name=form.location_name.data, location_address=form.location_address.data, price=form.price.data, price_per_weight=form.price_per_weight.data, weight=form.weight.data, user_id=current_user.id)
        if form.image.data:
            image_file = save_pic(form.image.data)
            new.image=image_file
        db.session.add(new)
        db.session.commit()
        return redirect(url_for('supplier_home'))

    return render_template('supplier_add_ingredient.html', form=form, add=True)

@app.route("/supplier/edit_ingredient/<int:ingredient_id>", methods=['GET','POST'])
@login_required
def edit_ingredient(ingredient_id):
    if current_user.role != "supplier":
        return redirect(url_for('home'))
    ingredient = SupIngredient.query.get_or_404(ingredient_id)
    form = IngredientForm()
    if form.validate_on_submit():
        ingredient.name = form.name.data
        ingredient.location_data = form.location_name.data
        ingredient.location_address = form.location_address.data
        ingredient.price = form.price.data
        ingredient.price_per_weight = form.price_per_weight.data
        ingredient.weight = form.weight.data
        if form.image.data:
            image_file = save_pic(form.image.data)
            ingredient.image=image_file
        db.session.commit()
        return redirect(url_for('supplier_home'))

    elif request.method == 'GET':
        form.name.data = ingredient.name
        form.location_name.data = ingredient.location_name
        form.location_address.data = ingredient.location_address
        form.price.data = ingredient.price
        form.price_per_weight.data = ingredient.price_per_weight
        form.weight.data = ingredient.weight

    return render_template('supplier_add_ingredient.html', form=form, edit=True)

@app.route("/supplier/delete_ingredient/<int:ingredient_id>", methods=['GET','POST'])
@login_required
def delete_ingredient(ingredient_id):
    if current_user.role != "supplier":
        return redirect(url_for('home'))
    ingredient = SupIngredient.query.get_or_404(ingredient_id)
    db.session.delete(ingredient)
    db.session.commit()
    return redirect(url_for('supplier_home'))

    return "x"

################################
#             ADMIN            #
################################

@app.route("/admin/home", methods=['GET','POST'])
def admin_home():
    form = RegistrationForm()
    if form.validate_on_submit():
        hashed_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
        user = User(username=form.username.data, email=form.email.data.casefold(), password=hashed_password, role=form.role.data)
        db.session.add(user)
        db.session.commit()
        flash('The account has been created!', 'info')

    return render_template('admin_home.html', form = form)

#################################
#           API ROUTES          #
#################################

@app.route("/loginapi", methods=['GET', 'POST'])
def loginapi():
    if current_user.is_authenticated:
        return jsonify(loggedin="true")
    email_in=request.json[0]
    
    password_in=request.json[1]
    user = User.query.filter_by(email=email_in.casefold()).first()
    if user and bcrypt.check_password_hash(user.password, password_in):
        login_user(user, remember=False)
        if current_user.role == "admin":
            return jsonify(loggedin="true",is_supplier="false",is_admin="true")
        elif current_user.role == "supplier":
            return jsonify(loggedin="true",is_supplier="true",is_admin="false")
        else:
            return jsonify(loggedin="true",is_supplier="false",is_admin="false")
    else:
        return jsonify(loggedin="false",is_supplier="false",is_admin="false")

@app.route("/api/isloggedin", methods=['GET', 'POST'])
def isloggedin():
    if current_user.is_authenticated:
        return jsonify(loggedin="true")
    else:
        return jsonify(loggedin="false")

# When navigating away from the edit ingredients page, it calls this to save the user's saved tabs
@app.route("/api/ingredients_store", methods=['GET', 'POST'])
def ingredients_store():
    if current_user.is_authenticated:
        if current_user.role == "consumer":
            for ing in current_user.ingredients:
                if ing.shopping_list == 0:
                    db.session.delete(ing)
            for ing in request.json[0]:
                new = ConIngredient(name=ing, user_id=current_user.id, tab=0)
                db.session.add(new)
            for ing in request.json[1]:
                new = ConIngredient(name=ing, user_id=current_user.id, tab=1)
                db.session.add(new)
            for ing in request.json[2]:
                new = ConIngredient(name=ing, user_id=current_user.id, tab=2)
                db.session.add(new)
            db.session.commit()
    return "x"

# When the edit ingredients page loads, it calls this to load a user's saved tabs
@app.route("/api/ingredients_tabs_pull", methods=['GET', 'POST'])
def ingredients_tabs_pull():
    if not current_user.is_authenticated:
        return jsonify(False)
    tab0 = []
    tab1 = []
    tab2 = []

    if current_user.is_authenticated:
        if current_user.role == "consumer":
            for ing in current_user.ingredients:
                if ing.tab == 0:
                    tab0.append(ing.name)
                elif ing.tab == 1:
                    tab1.append(ing.name)
                elif ing.tab == 2:
                    tab2.append(ing.name)
    tabs = [tab0,tab1,tab2]
    return jsonify(tabs)


# Route for the recipe results page, 
@app.route("/api/recipe_ingredients_results", methods=['GET', 'POST'])
def recipe_ingredients_results():

    # imageurl needs to be parsed withouts https part, otherwise / are interpreted as escape characters
    # Each element of the large array represents a result. The fields are:
    # [recipe_id, display name, Has all ingredients, No of missing ingredients, img_url, is_favourite]
    # First element of large array is isloggeidn.

    # Code for spoonacular call
    ingredient_list = request.json[1]
    headers = {'X-RapidAPI-Host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com','X-RapidAPI-Key':''}
    
    url = 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/findByIngredients?number=5&ranking=1&ignorePantry=false&ingredients='

    for i in ingredient_list:
        url = url + i + "%2C"

    url = url[:-3]
    recipeRequest = requests.get(url, headers=headers)
    data = recipeRequest.json()
    # This is is_logged in
    if current_user.is_authenticated:
        recipes = [True]
        is_logged_in = True
    else:
        recipes = [False]
        is_logged_in = False
    # data is recipeRequest.json
    for i in data:
        temp = []
        temp.append(i["id"])
        temp.append(i["title"])
        # if the missedIngredients is empty the if statement will return false
        # this means we dont have any missing ingredients
        # has all ingredients is set to true
        missed_ing_num = i["missedIngredientCount"]

        have_ingredients = []
        missing_ingredients = []
        
        for ing in i["missedIngredients"]:
            # Check if we have the ingredient as a substring.
            sub_str=False
            for have_ing in ingredient_list:
                if sub_str==False:
                    if have_ing.lower() in ing["name"].lower():
                        sub_str=True
                        missed_ing_num=missed_ing_num-1
                        temp2 = []
                        temp2.append(ing["id"])
                        temp2.append(have_ing)
                        temp2.append(ing["image"])
                        have_ingredients.append(temp2)
            if sub_str==False:
                temp2 = []
                temp2.append(ing["id"])
                temp2.append(ing["name"])
                temp2.append(ing["image"])
                missing_ingredients.append(temp2)

        for ing in i["usedIngredients"]:
            temp2 = []
            temp2.append(ing["id"])
            temp2.append(ing["name"])
            temp2.append(ing["image"])
            have_ingredients.append(temp2)

        if (missed_ing_num==0):
            temp.append(True)
            temp.append(0)
        else:
            temp.append(False)
            temp.append(missed_ing_num)

        temp.append(i["image"])

        #This is the is_favourite.
        if current_user.is_authenticated:
            if i["id"] in current_user.temp_liked_recipes:
                temp.append(True)
            else:
                temp.append(False)
        else:
            temp.append(False)

        if (is_logged_in==True):
            # If we are logged in, create a recipe object and save to database
            new = Recipe()
            new.spoonacular_id = int(i["id"])
            new.name = i["title"]
            new.image = i["image"]
            have_ing_id = []
            miss_ing_id = []
            # Handling ingredients
            for ing in have_ingredients:
                ingredient_result = ApiIngredient.query.filter_by(spoonacular_id=ing[0]).first()
                if ingredient_result:
                    new.ingredients.append(ingredient_result.spoonacular_id)
                    db.session.commit()
                    have_ing_id.append(ingredient_result.spoonacular_id)
                else:
                    # Need to create a new ingredient object
                    new_ing = ApiIngredient()
                    new_ing.name = ing[1]
                    new_ing.spoonacular_id = ing[0]
                    db.session.add(new_ing)
                    db.session.commit()
                    # Then add new ingredient to ingredient list
                    new.ingredients.append(ing[0])
                    db.session.commit()
                    have_ing_id.append(ing[0])
            # Repeat for missed ingredients
            for ing in missing_ingredients:
                ingredient_result = ApiIngredient.query.filter_by(spoonacular_id=ing[0]).first()
                if ingredient_result:
                    new.ingredients.append(ingredient_result.spoonacular_id)
                    db.session.commit()
                    miss_ing_id.append(ing[0])
                else:
                    # Need to create a new ingredient object
                    new_ing = ApiIngredient()
                    new_ing.name = ing[1]
                    new_ing.spoonacular_id = ing[0]
                    db.session.add(new_ing)
                    # Then add new ingredient to ingredient list
                    new.ingredients.append(new.spoonacular_id)
                    db.session.commit()
                    miss_ing_id.append(ing[0])
  
            db.session.add(new)
            db.session.commit()

            # Append id's for use in ingredients modal
            temp.append(have_ing_id)
            temp.append(miss_ing_id)
        else:
            # If we're not logged in, package up an ingredient list and send to frontend
            temp.append(have_ingredients)
            temp.append(missing_ingredients)
        #append the temp array to the recipes array.
        recipes.append(temp)

    return jsonify(recipes)

@app.route("/api/recipe_ingredients_ingredients", methods=['GET', 'POST'])
def recipe_ingredients_ingredients():
    have_ing_list=request.json[1]
    miss_ing_list=request.json[2]
    print(request.json)
    return_list = []
    for ing in have_ing_list:
        # Grab the element from the database
        print("ing")
        print(ing)
        ingredient_result = ApiIngredient.query.filter_by(spoonacular_id=ing).first()
        return_list.append([0,capital(ingredient_result.name),ing])
    for ing in miss_ing_list:
        ingredient_result = ApiIngredient.query.filter_by(spoonacular_id=ing).first()
        # Check if ing_id is in current_user 
        is_shopped = False
        for shop_ing in current_user.temp_shopping_list:
            if int(ing) == int(shop_ing):
                is_shopped=True
        # Numbers are 0 is has ingredient, 1 is missing ingredients, 2 is missing ingredient but in shopping list
        # Fields are [shopping status, Display_name, id]
        # example ingredient_list = [[0,"Cheese"], [1,"Onion", "onion"], [2,"Paprika","paprika"]]
        if is_shopped==True:
            return_list.append([2,capital(ingredient_result.name),ing])
        else:
            return_list.append([1,capital(ingredient_result.name),ing])

    return jsonify(return_list)

@app.route("/api/add_ingredient_shop_list", methods=['GET', 'POST'])
def add_ingredients_shop_list():
    print(request.json)
    ingredient_result = ApiIngredient.query.filter_by(spoonacular_id=request.json).first()
    raw_name = ingredient_result.name
    current_user.temp_shopping_list.append(int(request.json))

    name = raw_name.replace("-", " ")
    if validate_shopping_ingredient(name.lower()):
        new = ConIngredient()
        new.name = name.lower()
        new.shopping_list = 1
        new.user_id = current_user.id
        db.session.add(new)
        db.session.commit()

    return "x"

# Recipe results page, indicates user has un-added an ingredient from the ingredient list.
@app.route("/api/remove_ingredient_shop_list", methods=['GET', 'POST'])
def remove_ingredients_shop_list():
    ingredient_result = ApiIngredient.query.filter_by(spoonacular_id=request.json).first()
    raw_name = ingredient_result.name
    current_user.temp_shopping_list.remove(int(request.json))


    name = raw_name.replace("-", " ")
    ing = ConIngredient.query.filter_by(name=name).first()
    db.session.delete(ing)
    db.session.commit()

    return "x"

# Recipe results page, gets an array of all ingredients to be added. They are the abreviated name from recipe_ingredients_results route.
@app.route("/api/add_ingredient_shop_all_list", methods=['GET', 'POST'])
def add_ingredients_shop_all_list():
    for ing in request.json:
        ingredient_result = ApiIngredient.query.filter_by(spoonacular_id=ing).first()
        raw_name = ingredient_result.name
        current_user.temp_shopping_list.append(int(ing))        

        name = raw_name.replace("-", " ")
        if validate_shopping_ingredient(name.lower()):
            new = ConIngredient()
            new.name = name.lower()
            new.shopping_list = 1
            new.user_id = current_user.id
            db.session.add(new)
    db.session.commit()

    return "x"

# Add a favourite recipe
@app.route("/api/add_favourite_recipe", methods=['GET', 'POST'])
def add_favourite_recipe():
    current_user.temp_liked_recipes.append(request.json)

    return "x"    

# Remove a favourite recipe
@app.route("/api/remove_favourite_recipe", methods=['GET', 'POST'])
def remove_favourite_recipe():
    current_user.temp_liked_recipes.remove(request.json)    

    return "x" 

@app.route("/api/get_favourites", methods=['GET', 'POST'])
def get_favourite_recipes():
    return_list =[]
    for rec_id in current_user.temp_liked_recipes:
        temp = []
        recipe_result = Recipe.query.filter_by(spoonacular_id=rec_id).first()
        temp.append(recipe_result.name)
        temp.append(recipe_result.spoonacular_id)
        temp.append(recipe_result.image)
        return_list.append(temp)
        
    return jsonify(return_list)

@app.route("/api/get_favourite_id", methods=['GET', 'POST'])
def get_favourite_recipe_id():
        
    return jsonify(current_user.temp_liked_recipes)

@app.route("/reset_password", methods=['GET','POST'])
def reset_request():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    form = RequestResetForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        send_reset_email(user)
        flash('An email containing instructions has been sent.', 'info')
        return redirect(url_for('login'))
    return render_template('reset_request.html', form=form)

@app.route("/reset_password/<token>", methods=['GET','POST'])
def reset_token(token):
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    user = User.verify_reset_token(token)
    if not user:
        flash('That is an invalid or expired token', 'warning')
        return redirect(url_for('reset_request'))
    form = ResetPasswordForm()
    if form.validate_on_submit():
        hashed_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
        user.password = hashed_password
        db.session.commit()
        flash('Your password has been changed!', 'info')
        return redirect(url_for('login'))
    return render_template('reset_token.html', form=form)