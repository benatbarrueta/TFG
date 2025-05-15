# AUTHENTICATION MICROSERVICE 🪪
This microservice is developed in Flask(Python) and is used to log in, register and get the data related with the user. All the data is saved in a mysql database.

## INSTALLATION ⚙️
To run it, you need to download or clone the repository and have Python installed.

You need to download the following dependecies:

**fastapi, pydantic, uvicorn, mysql-connector-python, SQLAlchemy, pymysq, PyJWT, python-dotenv, python-multipart**

To do this run the following command:

    pip install -r requirements.txt

You need to have the database in your computer

### MAC USER
To create the database run the next command:

    mysql -u root -p < ./db/db.sql

### WINDOWS USER

To create the database run the next command:

    mysql -u root -p < .\db\db.sql

Once you have made it, it would ask you for a password, enter the password you have for root user **(normally *root*)**

## EXECUTION ▶️
To run the project, simply execute the following command:
    
    uvicorn main:app --reload