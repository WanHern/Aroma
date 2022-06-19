from datetime import datetime
from itsdangerous import TimedJSONWebSignatureSerializer as Serializer
from foodstuff import db, login_manager, app
from flask_login import UserMixin


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# The user class will be used for consumers, admins and suppliers
class User(db.Model, UserMixin):

    # Common attributes
    id = db.Column(db.Integer, primary_key=True)

    role = db.Column(db.String(20), nullable=False, default='consumer')
    
    username = db.Column(db.String(20), unique=True, nullable=False)
    
    email = db.Column(db.String(120), unique=True, nullable=False)
    
    image_file = db.Column(db.String(30), nullable=False, default='default.jpeg')
    
    password = db.Column(db.String(60), nullable=False)

    # Consumer attributes
    budget = db.Column(db.Numeric(10,2), default=0)

    expenditure = db.relationship('Expenses', backref='user', lazy=True)

    address = db.Column(db.String(100), default="")

    ingredients = db.relationship('ConIngredient', backref='userI', lazy=True)

    shopping_list = db.relationship('ConIngredient', backref='userSL', lazy=True)

    temp_shopping_list = []

    liked_recipes = db.relationship('Liked_recipe', backref='user', lazy=True)

    temp_liked_recipes = []
    
    # Supplier attributes

    supplier_ingredients = db.relationship('SupIngredient', backref='user', lazy=True)

    company_name = db.Column(db.String(100), default="")

    company_email = db.Column(db.String(100), default="")

    company_address = db.Column(db.String(100), default="")

    def get_reset_token(self, expires_sec=1800):
        s = Serializer(app.config['SECRET_KEY'], expires_sec)
        return s.dumps({'user_id': self.id}).decode('utf-8')

    @staticmethod
    def verify_reset_token(token):
        s = Serializer(app.config['SECRET_KEY'], expires_sec)
        try:
            user_id = s.loads(token)['user_id']
        except:
            return None
        return User.query.get(user_id)

    def __repr__(self):
        return f"User('{self.username}','{self.email}','{self.image_file}')"


# Ingredient class for Spoonacular API
class ApiIngredient(db.Model):

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(50), default="")

    spoonacular_id = db.Column(db.Integer)


# Ingredient class for consumers
class ConIngredient(db.Model):

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(50), default="")

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    shopping_list = db.Column(db.Integer, nullable=False, default=0)

    tab = db.Column(db.Integer, default=None)

    def getSuppliers(self):
        return self.suppliers


# Ingredient class for suppliers
class SupIngredient(db.Model):

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(50), default="")

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    location_name = db.Column(db.String(100), default="")

    location_address = db.Column(db.String(100), default="")

    price = db.Column(db.Numeric(10,2), nullable=False, default=0)

    price_per_weight = db.Column(db.String(20), nullable=False, default="")

    weight = db.Column(db.String(20), default="")

    image = db.Column(db.String(30), default="aroma.png")

    earnings = db.Column(db.Numeric(10,2), nullable=False, default=0)

    def __repr__(self):
        return f"{self.name}"


# Consumer's liked recipes
class Liked_recipe(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    recipe_id = db.Column(db.Integer)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)


# Recipe class to display
class Recipe(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    spoonacular_id = db.Column(db.Integer)

    name = db.Column(db.String(30), default="")

    ingredients = []

    nutritional_info = db.Column(db.String(512), default="")

    steps = db.Column(db.String(2048), default="")

    image = db.Column(db.String(30), default="aroma.png")


# Consumer's expenses
class Expenses(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    value = db.Column(db.Numeric(10,2), nullable=False, default=0)

    week = db.Column(db.Integer, nullable=False, default=0)