from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from flask_login import current_user
from wtforms import StringField, PasswordField, SubmitField, BooleanField, TextAreaField, RadioField, IntegerField, DecimalField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError, NumberRange
from foodstuff.models import User

# Account related
class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=2, max=20)])

    email = StringField('Email', validators=[DataRequired(), Email()])

    password = PasswordField('Password', validators=[DataRequired()])

    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])

    role = StringField('Role (consumer/admin/supplier)')

    submit = SubmitField('Sign Up')

    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('That username has already been taken D:')

    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('That email has already been taken D:')

class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])

    password = PasswordField('Password', validators=[DataRequired()])

    remember = BooleanField('Remember me')

    submit = SubmitField('Log in')

class UpdateAccountForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=2, max=20)])

    email = StringField('Email', validators=[DataRequired(), Email()])
    
    picture = FileField('Update Profile Picture (recommended landscape 4:3)', validators=[FileAllowed(['jpg', 'png'])])

    budget = DecimalField('Monthly budget', validators=[NumberRange(min=0)])

    expenses_update = DecimalField('Update expenses (e.g enter 10.00 to add or -10.00 to subtract)')
    
    address = StringField('Address (This will be used to locate stores near you)')

    company_name = StringField('Company name')

    company_email = StringField('Company email')

    company_address = StringField('Company address')

    password = PasswordField('Password', validators=[DataRequired()])

    submit = SubmitField('Update')

    def validate_username(self, username):
        if username.data != current_user.username:
            user = User.query.filter_by(username=username.data).first()
            if user:
                raise ValidationError('That username has already been taken!')

    def validate_email(self, email):
        if email.data != current_user.email:
            user = User.query.filter_by(email=email.data).first()
            if user:
                raise ValidationError('That email has already been taken!')

# Feature related
class IngredientForm(FlaskForm):
    name = StringField('Ingredient name', validators=[DataRequired()])

    location_name = StringField('Location name', validators=[DataRequired()])

    location_address = StringField('Location address', validators=[DataRequired()])
    
    price = DecimalField('Price (e.g 2.50)', validators=[DataRequired()])

    price_per_weight = StringField('Price per weight (e.g $2.50/kg)', validators=[DataRequired()])

    weight = StringField('Weight', validators=[DataRequired()])

    image = FileField('Upload product image', validators=[FileAllowed(['jpg', 'jpeg', 'png'])])

    submit = SubmitField('Update')

# Admin issues
class RequestResetForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])

    submit = SubmitField('Request Password Reset')

    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user is None:
            raise ValidationError('There is no account linked to that email!')

class ResetPasswordForm(FlaskForm):

    password = PasswordField('Password', validators=[DataRequired()])

    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])

    submit = SubmitField('Reset password')
